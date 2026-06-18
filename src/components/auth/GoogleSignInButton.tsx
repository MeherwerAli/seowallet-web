'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { googleAuthApi } from '@/lib/api-client'
import { ApiError } from '@/lib/api-client'

interface GoogleSignInButtonProps {
	redirectUri?: string
	label?: string
	signup?: boolean
}

export default function GoogleSignInButton({
	redirectUri,
	label = 'Continue with Google',
	signup = false,
}: GoogleSignInButtonProps) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '')

	const resolvedRedirectUri =
		redirectUri ??
		(typeof window !== 'undefined'
			? `${window.location.origin}${basePath}/auth/google/callback`
			: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/google/callback`)

	const handleClick = async () => {
		setError(null)
		setLoading(true)
		try {
			const response = await googleAuthApi.getAuthUrl(resolvedRedirectUri, signup)
			const authorizationUrl = response.authorizationUrl ?? response.authUrl
			if (!authorizationUrl) {
				throw new Error('Google sign-in URL was not returned')
			}
			window.location.href = authorizationUrl
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to initiate Google sign-in')
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<Button variant="secondary" fullWidth loading={loading} onClick={handleClick} type="button">
				<GoogleIcon />
				{label}
			</Button>
			{error && <p className="text-center text-xs text-red-500">{error}</p>}
		</div>
	)
}

function GoogleIcon() {
	return (
		<svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	)
}
