'use client'

import Link from 'next/link'
import { useState } from 'react'

import AuthCard from '@/components/auth/AuthCard'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import { ApiError, authApi } from '@/lib/api-client'

function isValidEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('')
	const [emailError, setEmailError] = useState<string | undefined>()
	const [apiError, setApiError] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setApiError(null)
		setMessage(null)

		const trimmedEmail = email.trim()
		if (!trimmedEmail) {
			setEmailError('Email is required')
			return
		}
		if (!isValidEmail(trimmedEmail)) {
			setEmailError('Enter a valid email')
			return
		}

		setEmailError(undefined)
		setLoading(true)
		try {
			const response = await authApi.forgotPassword(trimmedEmail)
			setMessage(response.message || 'If the email exists, a password reset link has been sent.')
		} catch (error) {
			setApiError(error instanceof ApiError ? error.message : 'Could not send reset email. Try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthCard title="Reset your password" subtitle="Enter your account email and we will send a reset link">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<FormField label="Email" htmlFor="email" error={emailError} required>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						value={email}
						onChange={(event) => {
							setEmail(event.target.value)
							setEmailError(undefined)
							setApiError(null)
							setMessage(null)
						}}
						error={emailError}
						placeholder="jane@example.com"
					/>
				</FormField>

				{apiError && <Alert variant="error" message={apiError} />}
				{message && <Alert variant="success" message={message} />}

				<Button type="submit" fullWidth loading={loading}>
					Send reset link
				</Button>
			</form>

			<p className="mt-6 text-center text-sm text-gray-500">
				Remembered your password?{' '}
				<Link href="/auth/login" className="font-medium text-brand-500 hover:underline">
					Log in
				</Link>
			</p>
		</AuthCard>
	)
}
