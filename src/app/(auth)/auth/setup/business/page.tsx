'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import AuthCard from '@/components/auth/AuthCard'
import { profileApi, ApiError } from '@/lib/api-client'
import { requireSession, storeSession } from '@/lib/session'
import type { BusinessSetupFormValues } from '@/types/auth'

const EMPLOYEE_RANGES = ['1–10', '11–50', '51–200', '201–500', '500+']

const INDUSTRY_OPTIONS = [
	'E-commerce',
	'SaaS / Software',
	'Healthcare',
	'Finance',
	'Education',
	'Real Estate',
	'Media / Publishing',
	'Hospitality & Travel',
	'Other',
]

type FormErrors = Partial<Record<keyof BusinessSetupFormValues, string>>

function validate(values: BusinessSetupFormValues): FormErrors {
	const errors: FormErrors = {}
	if (!values.businessName.trim()) errors.businessName = 'Business name is required'
	if (values.websiteUrl && !/^https?:\/\/.+/.test(values.websiteUrl)) {
		errors.websiteUrl = 'Enter a valid URL starting with http(s)://'
	}
	return errors
}

export default function BusinessSetupPage() {
	const router = useRouter()
	const [values, setValues] = useState<BusinessSetupFormValues>({
		businessName: '',
		websiteUrl: '',
		numberOfEmployees: '',
		industry: '',
		shortBio: '',
	})
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
	const [apiError, setApiError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const update =
		(field: keyof BusinessSetupFormValues) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
			setValues((prev) => ({ ...prev, [field]: e.target.value }))
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
		}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const errors = validate(values)
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors)
			return
		}

		setLoading(true)
		setApiError(null)
		try {
			const session = requireSession()
			await profileApi.completeRegistration(
				{
					accountType: 'BUSINESS',
					businessProfile: {
						businessName: values.businessName,
						// domainName derived from websiteUrl for convenience
						domainName: values.websiteUrl
							? new URL(values.websiteUrl.startsWith('http') ? values.websiteUrl : `https://${values.websiteUrl}`).hostname
							: '',
						websiteUrl: values.websiteUrl,
						// TODO: send numberOfEmployees, industry, shortBio once backend extends BusinessProfileRequest
					},
				},
				session.accessToken,
			)
			router.push('/dashboard')
		} catch (err) {
			if (err instanceof Error && err.message === 'No active session') {
				router.push('/auth/login')
				return
			}
			setApiError(err instanceof ApiError ? err.message : 'Failed to save profile. Try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthCard
			title="Set up your business profile"
			subtitle="Tell us about your company so the right experts can find you"
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<FormField label="Business name" htmlFor="businessName" error={fieldErrors.businessName} required>
					<Input
						id="businessName"
						value={values.businessName}
						onChange={update('businessName')}
						error={fieldErrors.businessName}
						placeholder="Acme Corp"
					/>
				</FormField>

				<FormField
					label="Company website"
					htmlFor="websiteUrl"
					error={fieldErrors.websiteUrl}
					hint="Include https://"
				>
					<Input
						id="websiteUrl"
						type="url"
						value={values.websiteUrl}
						onChange={update('websiteUrl')}
						error={fieldErrors.websiteUrl}
						placeholder="https://acme.com"
					/>
				</FormField>

				<FormField label="Number of employees" htmlFor="numberOfEmployees">
					<select
						id="numberOfEmployees"
						value={values.numberOfEmployees}
						onChange={update('numberOfEmployees')}
						className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
					>
						<option value="">Select range</option>
						{EMPLOYEE_RANGES.map((range) => (
							<option key={range} value={range}>
								{range}
							</option>
						))}
					</select>
				</FormField>

				<FormField label="Industry / field" htmlFor="industry">
					<select
						id="industry"
						value={values.industry}
						onChange={update('industry')}
						className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
					>
						<option value="">Select industry</option>
						{INDUSTRY_OPTIONS.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</FormField>

				<FormField
					label="Short bio"
					htmlFor="shortBio"
					hint="Describe what your company does (optional, max 280 chars)"
				>
					<Textarea
						id="shortBio"
						value={values.shortBio}
						onChange={update('shortBio')}
						maxLength={280}
						placeholder="We help e-commerce brands grow through…"
					/>
				</FormField>

				{apiError && <Alert variant="error" message={apiError} />}

				<div className="flex gap-3 pt-1">
					<Link href="/auth/setup" className="flex-1">
						<Button variant="secondary" fullWidth type="button">
							Back
						</Button>
					</Link>
					<Button type="submit" fullWidth loading={loading} className="flex-1">
						Complete setup
					</Button>
				</div>
			</form>
		</AuthCard>
	)
}
