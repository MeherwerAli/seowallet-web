'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import AuthCard from '@/components/auth/AuthCard'
import { authApi, ApiError } from '@/lib/api-client'

function VerifyEmailContent() {
	const router = useRouter()
	const params = useSearchParams()

	const token = params.get('token')
	const email = params.get('email')
	const shouldResend = params.get('resend') === '1'
	const verifiedTokenRef = useRef<string | null>(null)

	const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
	const [message, setMessage] = useState<string | null>(null)
	const [resending, setResending] = useState(false)

	// Auto-verify when token is present in URL (link from email)
	useEffect(() => {
		if (!token) return
		if (verifiedTokenRef.current === token) return
		verifiedTokenRef.current = token
		setStatus('verifying')
		authApi
			.verifyEmail(token)
			.then(({ message: msg }) => {
				setMessage(msg ?? 'Email verified! You can now log in.')
				setStatus('success')
			})
			.catch((err) => {
				setMessage(err instanceof ApiError ? err.message : 'Verification failed. The link may have expired.')
				setStatus('error')
			})
	}, [token])

	const handleResend = async () => {
		if (!email) return
		setResending(true)
		try {
			await authApi.forgotPassword(email) // reuses forgot-password flow for now
			setMessage('Verification email resent. Check your inbox.')
		} catch {
			setMessage('Could not resend the email. Try again later.')
		} finally {
			setResending(false)
		}
	}

	// Showing verify-in-progress / result when token is in URL
	if (token) {
		return (
			<AuthCard
				title={status === 'success' ? 'Email verified!' : 'Verifying your email…'}
				subtitle={status === 'verifying' ? 'Just a moment' : undefined}
			>
				{message && (
					<Alert
						variant={status === 'success' ? 'success' : 'error'}
						message={message}
					/>
				)}
				{status === 'success' && (
					<Button fullWidth className="mt-5" onClick={() => router.push('/auth/login')}>
						Go to login
					</Button>
				)}
				{status === 'error' && (
					<Link href="/auth/signup" className="mt-4 block text-center text-sm text-brand-500 hover:underline">
						Back to sign up
					</Link>
				)}
			</AuthCard>
		)
	}

	// Instructional state — user just signed up
	return (
		<AuthCard title="Check your email" subtitle={email ? `We sent a link to ${email}` : 'We sent you a verification link'}>
			<div className="flex flex-col items-center gap-5 py-2 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
					<svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
					</svg>
				</div>
				<p className="text-sm text-gray-500">
					Click the link in the email to activate your account. It expires in 24 hours.
				</p>

				{message && <Alert variant="info" message={message} />}

				{shouldResend && email && (
					<Button variant="ghost" loading={resending} onClick={handleResend}>
						Resend verification email
					</Button>
				)}
			</div>

			<p className="mt-6 text-center text-sm text-gray-500">
				Already verified?{' '}
				<Link href="/auth/login" className="font-medium text-brand-500 hover:underline">
					Log in
				</Link>
			</p>
		</AuthCard>
	)
}

export default function VerifyEmailPage() {
	return (
		<Suspense>
			<VerifyEmailContent />
		</Suspense>
	)
}
