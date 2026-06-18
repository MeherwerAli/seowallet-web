'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import { profileApi } from '@/lib/api-client'
import { keycloakAuth } from '@/lib/keycloak-auth'
import { storeSession } from '@/lib/session'

function KeycloakCallbackContent() {
	const router = useRouter()
	const params = useSearchParams()
	const handledCallbackRef = useRef<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const code = params.get('code')
		const state = params.get('state')
		const keycloakError = params.get('error_description') ?? params.get('error')

		if (keycloakError) {
			const pendingLogin = keycloakAuth.consumeLoginError(state)
			if (pendingLogin.mode === 'silent') {
				router.replace('/auth/login?sso=miss')
				return
			}
			setError(keycloakError)
			return
		}

		if (!code || !state) {
			setError('Invalid callback parameters from Keycloak.')
			return
		}

		const callbackKey = `${code}:${state}`
		if (handledCallbackRef.current === callbackKey) return
		handledCallbackRef.current = callbackKey

		keycloakAuth
			.completeLogin(code, state)
			.then(async ({ authResponse, nextPath }) => {
				const profile = await profileApi.getMe(authResponse.accessToken)
				const syncedResponse = {
					...authResponse,
					user: {
						...authResponse.user,
						id: profile.userId,
						email: profile.email,
						username: profile.username,
						firstName: profile.firstName,
						lastName: profile.lastName,
						displayName: profile.displayName,
						pictureUrl: profile.pictureUrl,
						badge: profile.badge,
						status: profile.status,
						accountType: profile.accountType,
						profileTypes: profile.profileTypes,
						roles: profile.roles,
						profileCompleted: profile.profileCompleted,
					},
				}
				storeSession(syncedResponse)
				router.replace(profile.profileCompleted ? nextPath : '/auth/setup')
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : 'Keycloak sign-in failed.')
			})
	}, [params, router])

	if (error) {
		return (
			<div className="w-full max-w-md">
				<Alert variant="error" message={error} />
				<button
					className="mt-4 text-sm text-brand-500 hover:underline"
					onClick={() => router.push('/auth/login')}
				>
					Back to login
				</button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center gap-3 text-gray-500">
			<Spinner size="md" />
			<p className="text-sm">Completing SSO sign-in...</p>
		</div>
	)
}

export default function KeycloakCallbackPage() {
	return (
		<Suspense>
			<KeycloakCallbackContent />
		</Suspense>
	)
}
