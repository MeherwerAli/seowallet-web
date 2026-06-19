'use client'

import { profileApi } from '@/lib/api-client'
import { storeSession } from '@/lib/session'
import type { AuthResponse, AuthUserProfile, StoredSession } from '@/types/auth'

const SHARED_SESSION_KEY = 'seowallet_suite_session'
const LOGOUT_MARKER_KEY = 'seowallet_suite_logout_at'

const TOKEN_KEYS = [
	'_token.laravelJWT',
	'auth._token.laravelJWT',
	'sso.accessToken',
	'auth.sso.accessToken',
]

const REFRESH_TOKEN_KEYS = ['_refresh_token.laravelJWT', 'auth._refresh_token.laravelJWT', 'sso.refreshToken']
const ID_TOKEN_KEYS = ['sso.idToken', 'auth.sso.idToken']
const EXPIRY_KEYS = ['_token_expiration.laravelJWT', 'auth._token_expiration.laravelJWT', 'sso.expiresAt']

function readJson<T>(value: string | null): T | null {
	if (!value) return null
	try {
		return JSON.parse(value) as T
	} catch {
		return null
	}
}

function readLocalStorage(key: string): string | null {
	try {
		return window.localStorage.getItem(key)
	} catch {
		return null
	}
}

function readCookie(key: string): string | null {
	const entry = document.cookie
		.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${key}=`))
	if (!entry) return null
	try {
		return decodeURIComponent(entry.slice(key.length + 1))
	} catch {
		return entry.slice(key.length + 1)
	}
}

function unwrapStoredValue(value: string): string {
	const parsed = readJson<unknown>(value)
	if (typeof parsed === 'string') return parsed
	if (typeof parsed === 'number') return String(parsed)
	return value
}

function firstStoredValue(keys: string[]): string | null {
	for (const key of keys) {
		const value = readLocalStorage(key) ?? readCookie(key)
		if (value) return unwrapStoredValue(value)
	}
	return null
}

function normalizeToken(token: string | null): string | null {
	if (!token) return null
	return token.replace(/^Bearer\s+/i, '').trim() || null
}

function normalizeExpiry(value: string | null): string {
	if (!value) return new Date(Date.now() + 60 * 60 * 1000).toISOString()
	if (/^\d+$/.test(value)) {
		const numeric = Number(value)
		return new Date(numeric > 9999999999 ? numeric : numeric * 1000).toISOString()
	}
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : parsed.toISOString()
}

function isExpired(expiresAt: string): boolean {
	return new Date(expiresAt) <= new Date()
}

function profileToUser(profile: Awaited<ReturnType<typeof profileApi.getMe>>): AuthUserProfile {
	return {
		id: profile.userId,
		email: profile.email,
		username: profile.username,
		firstName: profile.firstName,
		lastName: profile.lastName,
		displayName: profile.displayName,
		pictureUrl: profile.pictureUrl,
		badge: profile.badge,
		status: profile.status,
		emailVerified: true,
		accountType: profile.accountType,
		profileTypes: profile.profileTypes,
		roles: profile.roles,
		profileCompleted: profile.profileCompleted,
		newlyCreated: false,
	}
}

function storedSessionToAuthResponse(session: StoredSession): AuthResponse | null {
	if (!session.accessToken || !session.user || !session.expiresAt || isExpired(session.expiresAt)) {
		return null
	}

	return {
		accessToken: session.accessToken,
		refreshToken: session.refreshToken || '',
		tokenType: 'Bearer',
		expiresAt: session.expiresAt,
		user: session.user,
		authProvider: session.authProvider ?? 'legacy-user-service',
		idToken: session.idToken,
	}
}

function readSharedSession(): AuthResponse | null {
	const shared = readJson<StoredSession>(readLocalStorage(SHARED_SESSION_KEY))
	return shared ? storedSessionToAuthResponse(shared) : null
}

async function hydrateSessionProfile(session: AuthResponse): Promise<AuthResponse> {
	const profile = await profileApi.getMe(session.accessToken)
	return {
		...session,
		user: profileToUser(profile),
	}
}

export async function adoptHubSession(): Promise<AuthResponse | null> {
	if (typeof window === 'undefined') return null
	if (readLocalStorage(LOGOUT_MARKER_KEY)) return null

	const sharedSession = readSharedSession()
	if (sharedSession) {
		const hydratedSession = await hydrateSessionProfile(sharedSession)
		storeSession(hydratedSession)
		return hydratedSession
	}

	const accessToken = normalizeToken(firstStoredValue(TOKEN_KEYS))
	if (!accessToken) return null

	const expiresAt = normalizeExpiry(firstStoredValue(EXPIRY_KEYS))
	if (isExpired(expiresAt)) return null

	const profile = await profileApi.getMe(accessToken)
	const authResponse: AuthResponse = {
		accessToken,
		refreshToken: normalizeToken(firstStoredValue(REFRESH_TOKEN_KEYS)) ?? '',
		idToken: normalizeToken(firstStoredValue(ID_TOKEN_KEYS)) ?? undefined,
		tokenType: 'Bearer',
		expiresAt,
		authProvider: 'legacy-user-service',
		user: profileToUser(profile),
	}

	storeSession(authResponse)
	return authResponse
}
