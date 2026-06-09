'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import AuthCard from '@/components/auth/AuthCard'
import KeycloakSignInButton from '@/components/auth/KeycloakSignInButton'
import { authApi, ApiError } from '@/lib/api-client'
import type { LocalSignupRequest } from '@/types/auth'

type FormErrors = Partial<Record<keyof LocalSignupRequest, string>>

function validate(values: LocalSignupRequest): FormErrors {
	const errors: FormErrors = {}
	if (!values.firstName.trim()) errors.firstName = 'First name is required'
	if (!values.lastName.trim()) errors.lastName = 'Last name is required'
	if (values.username.length < 3) errors.username = 'Username must be at least 3 characters'
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email'
	if (values.password.length < 8) errors.password = 'Password must be at least 8 characters'
	if (values.password !== values.retypePassword) errors.retypePassword = 'Passwords do not match'
	return errors
}

export default function SignupPage() {
	const router = useRouter()
	const [values, setValues] = useState<LocalSignupRequest>({
		firstName: '',
		lastName: '',
		username: '',
		email: '',
		password: '',
		retypePassword: '',
	})
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
	const [apiError, setApiError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const update = (field: keyof LocalSignupRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setValues((prev) => ({ ...prev, [field]: e.target.value }))
		setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setApiError(null)

		const errors = validate(values)
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors)
			return
		}

		setLoading(true)
		try {
			await authApi.signup(values)
			router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`)
		} catch (err) {
			setApiError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthCard title="Create your account" subtitle="Start managing your SEO workflow">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<div className="grid grid-cols-2 gap-3">
					<FormField label="First name" htmlFor="firstName" error={fieldErrors.firstName} required>
						<Input
							id="firstName"
							autoComplete="given-name"
							value={values.firstName}
							onChange={update('firstName')}
							error={fieldErrors.firstName}
							placeholder="Jane"
						/>
					</FormField>
					<FormField label="Last name" htmlFor="lastName" error={fieldErrors.lastName} required>
						<Input
							id="lastName"
							autoComplete="family-name"
							value={values.lastName}
							onChange={update('lastName')}
							error={fieldErrors.lastName}
							placeholder="Doe"
						/>
					</FormField>
				</div>

				<FormField label="Username" htmlFor="username" error={fieldErrors.username} required>
					<Input
						id="username"
						autoComplete="username"
						value={values.username}
						onChange={update('username')}
						error={fieldErrors.username}
						placeholder="janedoe"
					/>
				</FormField>

				<FormField label="Email" htmlFor="email" error={fieldErrors.email} required>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						value={values.email}
						onChange={update('email')}
						error={fieldErrors.email}
						placeholder="jane@example.com"
					/>
				</FormField>

				<FormField label="Password" htmlFor="password" error={fieldErrors.password} required>
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

				<Button type="submit" fullWidth loading={loading} className="mt-1">
					Create account
				</Button>
			</form>

			<div className="my-5 flex items-center gap-3">
				<hr className="flex-1 border-gray-200" />
				<span className="text-xs text-gray-400">or</span>
				<hr className="flex-1 border-gray-200" />
			</div>

			<div className="space-y-3">
				<KeycloakSignInButton label="Sign up with Google" />
			</div>

			<p className="mt-6 text-center text-sm text-gray-500">
				Already have an account?{' '}
				<Link href="/auth/login" className="font-medium text-brand-500 hover:underline">
					Log in
				</Link>
			</p>
		</AuthCard>
	)
}
