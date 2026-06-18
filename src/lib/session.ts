'use client'

import type { AuthResponse, StoredSession } from '@/types/auth'

export const SESSION_KEY = 'sw_session'
export const SHARED_SESSION_KEY = 'seowallet_suite_session'
export const LOGOUT_MARKER_KEY = 'seowallet_suite_logout_at'

// Keys that @nuxtjs/auth-next (laravelJWT strategy) writes to localStorage in the hub.
// Clearing these here ensures the hub sees no lingering token when the web console logs out.
const HUB_AUTH_NEXT_KEYS = [
	'_token.laravelJWT',
	'auth._token.laravelJWT',
	'_refresh_token.laravelJWT',
	'auth._refresh_token.laravelJWT',
	'_token_expiration.laravelJWT',
	'auth._token_expiration.laravelJWT',
	'strategy',
	'auth.strategy',
	'loggedIn',
	'auth.loggedIn',
	'sso.accessToken',
	'auth.sso.accessToken',
	'sso.refreshToken',
	'auth.sso.refreshToken',
	'sso.expiresAt',
	'auth.sso.expiresAt',
	'sso.user',
	'auth.sso.user',
]

const COOKIE_KEYS = [
	SESSION_KEY,
	SHARED_SESSION_KEY,
	'_token.laravelJWT',
	'auth._token.laravelJWT',
	'_refresh_token.laravelJWT',
	'auth._refresh_token.laravelJWT',
	'_token_expiration.laravelJWT',
	'auth._token_expiration.laravelJWT',
	'strategy',
	'auth.strategy',
	'loggedIn',
	'auth.loggedIn',
	'sso.accessToken',
	'auth.sso.accessToken',
	'sso.refreshToken',
	'auth.sso.refreshToken',
	'sso.expiresAt',
	'auth.sso.expiresAt',
	'sso.user',
	'auth.sso.user',
]

const COOKIE_PATHS = ['/', '/hub', '/hub/', '/console', '/console/']

function expireCookie(name: string, path: string): void {
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`
}

export function storeSession(authResponse: AuthResponse): void {
	const session: StoredSession = {
		accessToken: authResponse.accessToken,
		refreshToken: authResponse.refreshToken,
		expiresAt: authResponse.expiresAt,
		user: authResponse.user,
		authProvider: authResponse.authProvider ?? 'legacy-user-service',
		idToken: authResponse.idToken,
	}
	if (typeof window !== 'undefined') {
		localStorage.removeItem(LOGOUT_MARKER_KEY)
		localStorage.setItem(SESSION_KEY, JSON.stringify(session))
		localStorage.setItem(SHARED_SESSION_KEY, JSON.stringify(session))
	}
}

export function getSession(): StoredSession | null {
	if (typeof window === 'undefined') return null
	const raw = localStorage.getItem(SESSION_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as StoredSession
	} catch {
		return null
	}
}

export function clearSession(): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(LOGOUT_MARKER_KEY, new Date().toISOString())
		localStorage.removeItem(SESSION_KEY)
		localStorage.removeItem(SHARED_SESSION_KEY)

		// Clear hub's auth-next localStorage state.
		HUB_AUTH_NEXT_KEYS.forEach((key) => localStorage.removeItem(key))

		// Expire same-origin auth cookies for both mounted apps.
		COOKIE_KEYS.forEach((key) => {
			COOKIE_PATHS.forEach((path) => expireCookie(key, path))
		})
	}
}

export function isSessionExpired(session: StoredSession): boolean {
	return new Date(session.expiresAt) <= new Date()
}

export function requireSession(): StoredSession {
	const session = getSession()
	if (!session || isSessionExpired(session)) {
		clearSession()
		throw new Error('No active session')
	}
	return session
}
