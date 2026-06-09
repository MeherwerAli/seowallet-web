'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import AuthCard from '@/components/auth/AuthCard'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import { ApiError, authApi } from '@/lib/api-client'

type ResetFields = {
	password: string
	retypePassword: string
}

type ResetErrors = Partial<Record<keyof ResetFields, string>>

function validate(values: ResetFields): ResetErrors {
	const errors: ResetErrors = {}
	if (values.password.length < 8) errors.password = 'Password must be at least 8 characters'
	if (values.password !== values.retypePassword) errors.retypePassword = 'Passwords do not match'
	return errors
}

function ResetPasswordContent() {
	const router = useRouter()
	const params = useSearchParams()
	const token = params.get('token') || ''

	const [values, setValues] = useState<ResetFields>({ password: '', retypePassword: '' })
	const [fieldErrors, setFieldErrors] = useState<ResetErrors>({})
	const [apiError, setApiError] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const update = (field: keyof ResetFields) => (event: React.ChangeEvent<HTMLInputElement>) => {
		setValues((previous) => ({ ...previous, [field]: event.target.value }))
		setFieldErrors((previous) => ({ ...previous, [field]: undefined }))
		setApiError(null)
		setMessage(null)
	}

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setApiError(null)
		setMessage(null)

		if (!token) {
			setApiError('Reset token is missing. Request a new password reset link.')
			return
		}

		const errors = validate(values)
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors)
			return
		}

		setLoading(true)
		try {
			const response = await authApi.resetPassword(token, values.password, values.retypePassword)
			setMessage(response.message || 'Password reset successfully.')
			window.setTimeout(() => router.push('/auth/login'), 1200)
		} catch (error) {
			setApiError(error instanceof ApiError ? error.message : 'Could not reset password. The link may be invalid or expired.')
		} finally {
			setLoading(false)
		}
	}

	if (!token) {
		return (
			<AuthCard title="Reset link missing" subtitle="Request a new reset link to continue">
				<Alert variant="error" message="This password reset link is missing its token." />
				<Link href="/auth/forgot-password" className="mt-5 block text-center text-sm font-medium text-brand-500 hover:underline">
					Request a new link
				</Link>
			</AuthCard>
		)
	}

	return (
		<AuthCard title="Choose a new password" subtitle="Use at least 8 characters">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<FormField label="New password" htmlFor="password" error={fieldErrors.password} required>
					<Input
						id="password"
						type="password"
						autoComplete="new-password"
						value={values.password}
						onChange={update('password')}
						error={fieldErrors.password}
						placeholder="Min. 8 characters"
					/>
				</FormField>

				<FormField label="Confirm password" htmlFor="retypePassword" error={fieldErrors.retypePassword} required>
					<Input
						id="retypePassword"
						type="password"
						autoComplete="new-password"
						value={values.retypePassword}
						onChange={update('retypePassword')}
						error={fieldErrors.retypePassword}
						placeholder="Repeat your password"
					/>
				</FormField>

				{apiError && <Alert variant="error" message={apiError} />}
				{message && <Alert variant="success" message={message} />}

				<Button type="submit" fullWidth loading={loading}>
					Reset password
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

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordContent />
		</Suspense>
	)
}
