'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import AuthCard from '@/components/auth/AuthCard'
import KeycloakSignInButton from '@/components/auth/KeycloakSignInButton'
import { authApi, ApiError } from '@/lib/api-client'
import { keycloakAuth } from '@/lib/keycloak-auth'
import { getSession, isSessionExpired, storeSession } from '@/lib/session'
import { adoptHubSession } from '@/lib/session-bridge'
import type { LocalLoginRequest } from '@/types/auth'

function LoginContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [values, setValues] = useState<LocalLoginRequest>({ usernameOrEmail: '', password: '' })
	const [apiError, setApiError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [checkingSso, setCheckingSso] = useState(true)
	const attemptedSilentSsoRef = useRef(false)

	useEffect(() => {
		let cancelled = false
		const existingSession = getSession()
		if (existingSession && !isSessionExpired(existingSession)) {
			router.replace('/dashboard')
			return
		}

		const silentMiss = searchParams.get('sso') === 'miss'

		const checkSharedSession = async () => {
			try {
				const adoptedSession = await adoptHubSession()
				if (cancelled) return
				if (adoptedSession) {
					router.replace(adoptedSession.user.profileCompleted ? '/dashboard' : '/auth/setup')
					return
				}
			} catch {
				// Continue to Keycloak silent SSO or the login form.
			}

			if (cancelled) return
			if (silentMiss || attemptedSilentSsoRef.current) {
				setCheckingSso(false)
				return
			}

			attemptedSilentSsoRef.current = true
			keycloakAuth.startSilentLogin('/dashboard').catch(() => {
				if (!cancelled) setCheckingSso(false)
			})
		}

		checkSharedSession()

		return () => {
			cancelled = true
		}
	}, [router, searchParams])

	const update = (field: keyof LocalLoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setValues((prev) => ({ ...prev, [field]: e.target.value }))
		setApiError(null)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!values.usernameOrEmail.trim() || !values.password) {
			setApiError('Email/username and password are required')
			return
		}
		setLoading(true)
		setApiError(null)
		try {
			const authResponse = await authApi.login(values)
			storeSession(authResponse)

			// Route based on profile completion state
			if (!authResponse.user.profileCompleted) {
				router.push('/auth/setup')
			} else {
				router.push('/dashboard')
			}
		} catch (err) {
			if (err instanceof ApiError && err.status === 403) {
				router.push(`/auth/verify-email?email=${encodeURIComponent(values.usernameOrEmail)}&resend=1`)
				return
			}
			setApiError(err instanceof ApiError ? err.message : 'Invalid credentials')
		} finally {
			setLoading(false)
		}
	}

	if (checkingSso) {
		return (
			<AuthCard title="Checking session" subtitle="Looking for your SEOWallet SSO session...">
				<div className="flex justify-center py-6">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
				</div>
			</AuthCard>
		)
	}

	return (
		<AuthCard title="Welcome back" subtitle="Log in to your SEOWallet account">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<FormField label="Email or username" htmlFor="usernameOrEmail" required>
					<Input
						id="usernameOrEmail"
						autoComplete="username"
						value={values.usernameOrEmail}
						onChange={update('usernameOrEmail')}
						placeholder="jane@example.com"
					/>
				</FormField>

				<FormField label="Password" htmlFor="password" required>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						value={values.password}
						onChange={update('password')}
						placeholder="Your password"
					/>
				</FormField>

				<div className="flex justify-end">
					<Link href="/auth/forgot-password" className="text-sm text-brand-500 hover:underline">
						Forgot password?
					</Link>
				</div>

				{apiError && <Alert variant="error" message={apiError} />}

				<Button type="submit" fullWidth loading={loading}>
					Log in
				</Button>
			</form>

			<div className="my-5 flex items-center gap-3">
				<hr className="flex-1 border-gray-200" />
				<span className="text-xs text-gray-400">or</span>
				<hr className="flex-1 border-gray-200" />
			</div>

			<div className="space-y-3">
				<KeycloakSignInButton label="Continue with Google" />
			</div>

			<p className="mt-6 text-center text-sm text-gray-500">
				Don&apos;t have an account?{' '}
				<Link href="/auth/signup" className="font-medium text-brand-500 hover:underline">
					Sign up
				</Link>
			</p>
		</AuthCard>
	)
}

export default function LoginPage() {
	return (
		<Suspense>
			<LoginContent />
		</Suspense>
	)
}
