'use client'

import type { AuthResponse, AuthUserProfile } from '@/types/auth'

const PKCE_KEY = 'sw_keycloak_pkce'

type PkceState = {
	state: string
	verifier: string
	redirectUri: string
	nextPath: string
	mode?: 'interactive' | 'silent'
}

type KeycloakTokenResponse = {
	access_token: string
	refresh_token?: string
	id_token?: string
	token_type: string
	expires_in: number
	refresh_expires_in?: number
}

type KeycloakClaims = {
	sub: string
	email?: string
	preferred_username?: string
	given_name?: string
	family_name?: string
	name?: string
	picture?: string
	realm_access?: { roles?: string[] }
	resource_access?: Record<string, { roles?: string[] }>
}

const base64Url = (bytes: ArrayBuffer | Uint8Array) => {
	const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
	let binary = ''
	buffer.forEach((byte) => {
		binary += String.fromCharCode(byte)
	})
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const randomString = (length = 64) => {
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	return base64Url(bytes)
}

const sha256 = async (value: string) => {
	const bytes = new TextEncoder().encode(value)
	return crypto.subtle.digest('SHA-256', bytes)
}

const decodeJwtPayload = <T>(token: string): T => {
	const payload = token.split('.')[1]
	if (!payload) throw new Error('Invalid token payload')
	const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
	const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
	const json = decodeURIComponent(
		atob(padded)
			.split('')
			.map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
			.join(''),
	)
	return JSON.parse(json) as T
}

export const keycloakConfig = {
	url: (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8081').replace(/\/+$/, ''),
	realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'seowallet',
	clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'seowallet-web',
}

const appBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '')

export const keycloakAuth = {
	async startLogin(nextPath = '/dashboard', identityProvider?: string) {
		await startAuthorization({ nextPath, identityProvider, mode: 'interactive', prompt: 'select_account' })
	},

	async startSilentLogin(nextPath = '/dashboard') {
		await startAuthorization({ nextPath, mode: 'silent', prompt: 'none' })
	},

	consumeLoginError(state?: string | null) {
		const raw = sessionStorage.getItem(PKCE_KEY)
		if (!raw) return { mode: 'interactive' as const, nextPath: '/dashboard' }

		const pkceState = JSON.parse(raw) as PkceState
		const mode = pkceState.mode ?? 'interactive'
		const nextPath = pkceState.nextPath || '/dashboard'
		if (!state || pkceState.state === state) {
			sessionStorage.removeItem(PKCE_KEY)
		}

		return { mode, nextPath }
	},

	async completeLogin(code: string, state: string): Promise<{ authResponse: AuthResponse; nextPath: string; mode: 'interactive' | 'silent' }> {
		const raw = sessionStorage.getItem(PKCE_KEY)
		if (!raw) throw new Error('Missing Keycloak login state. Please try again.')

		const pkceState = JSON.parse(raw) as PkceState
		if (pkceState.state !== state) throw new Error('Invalid Keycloak login state.')

		const response = await fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: keycloakConfig.clientId,
				redirect_uri: pkceState.redirectUri,
				code,
				code_verifier: pkceState.verifier,
			}),
		})

		const tokenResponse = await response.json() as KeycloakTokenResponse & { error?: string; error_description?: string }
		if (!response.ok) {
			throw new Error(tokenResponse.error_description ?? tokenResponse.error ?? 'Keycloak token exchange failed')
		}

		sessionStorage.removeItem(PKCE_KEY)
		return {
			authResponse: toAuthResponse(tokenResponse),
			nextPath: pkceState.nextPath || '/dashboard',
			mode: pkceState.mode ?? 'interactive',
		}
	},

	logoutUrl(idToken?: string | null) {
		const params = new URLSearchParams({
			client_id: keycloakConfig.clientId,
			post_logout_redirect_uri: `${window.location.origin}${appBasePath}/auth/login`,
		})
		if (idToken) params.set('id_token_hint', idToken)
		return `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout?${params.toString()}`
	},
}

async function startAuthorization({
	nextPath,
	identityProvider,
	mode,
	prompt,
}: {
	nextPath: string
	identityProvider?: string
	mode: 'interactive' | 'silent'
	prompt?: 'none' | 'login' | 'consent' | 'select_account'
}) {
	const redirectUri = `${window.location.origin}${appBasePath}/auth/keycloak/callback`
	const verifier = randomString()
	const state = randomString(32)
	const challenge = base64Url(await sha256(verifier))

	const pkceState: PkceState = { state, verifier, redirectUri, nextPath, mode }
	sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkceState))

	const params = new URLSearchParams({
		client_id: keycloakConfig.clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid profile email',
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256',
	})
	if (identityProvider) {
		params.set('kc_idp_hint', identityProvider)
	}
	if (prompt) {
		params.set('prompt', prompt)
	}

	window.location.href = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth?${params.toString()}`
}

function toAuthResponse(tokenResponse: KeycloakTokenResponse): AuthResponse {
	const claims = decodeJwtPayload<KeycloakClaims>(tokenResponse.id_token ?? tokenResponse.access_token)
	const username = claims.preferred_username ?? claims.email ?? claims.sub
	const roles = new Set<string>(claims.realm_access?.roles ?? [])
	const clientRoles = claims.resource_access?.[keycloakConfig.clientId]?.roles ?? []
	clientRoles.forEach((role) => roles.add(role))

	const user: AuthUserProfile = {
		id: claims.sub,
		email: claims.email ?? '',
		username,
		firstName: claims.given_name ?? '',
		lastName: claims.family_name ?? '',
		displayName: claims.name ?? username,
		pictureUrl: claims.picture ?? null,
		badge: null,
		status: 'active',
		emailVerified: true,
		accountType: null,
		profileTypes: [],
		roles: Array.from(roles),
		profileCompleted: false,
		newlyCreated: false,
	}

	return {
		accessToken: tokenResponse.access_token,
		refreshToken: tokenResponse.refresh_token ?? '',
		idToken: tokenResponse.id_token,
		tokenType: tokenResponse.token_type,
		expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
		user,
		authProvider: 'keycloak',
	}
}
