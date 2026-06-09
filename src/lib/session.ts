'use client'

import type { AuthResponse, StoredSession } from '@/types/auth'

const SESSION_KEY = 'sw_session'

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
		localStorage.setItem(SESSION_KEY, JSON.stringify(session))
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
		localStorage.removeItem(SESSION_KEY)
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
