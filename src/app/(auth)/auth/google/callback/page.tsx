'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import { googleAuthApi, ApiError } from '@/lib/api-client'
import { storeSession } from '@/lib/session'

function GoogleCallbackContent() {
	const router = useRouter()
	const params = useSearchParams()
	const [error, setError] = useState<string | null>(null)
	const handledCallbackRef = useRef<string | null>(null)

	useEffect(() => {
		const code = params.get('code')
		const state = params.get('state')
		const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '')
		const redirectUri = `${window.location.origin}${basePath}/auth/google/callback`

		if (!code || !state) {
			setError('Invalid callback parameters from Google.')
			return
		}
		const callbackKey = `${code}:${state}`
		if (handledCallbackRef.current === callbackKey) return
		handledCallbackRef.current = callbackKey

		googleAuthApi
			.callback(code, state, redirectUri)
			.then((authResponse) => {
				storeSession(authResponse)
				if (!authResponse.user.profileCompleted || authResponse.user.newlyCreated) {
					router.replace('/auth/setup')
				} else {
					router.replace('/dashboard')
				}
			})
			.catch((err) => {
				setError(err instanceof ApiError ? err.message : 'Google sign-in failed.')
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
			<p className="text-sm">Completing sign-in…</p>
		</div>
	)
}

export default function GoogleCallbackPage() {
	return (
		<Suspense>
			<GoogleCallbackContent />
		</Suspense>
	)
}
