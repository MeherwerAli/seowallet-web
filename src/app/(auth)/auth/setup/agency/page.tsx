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
import { requireSession } from '@/lib/session'
import type { AgencySetupFormValues } from '@/types/auth'

const SEO_SPECIALTIES = [
	'Technical SEO',
	'Local SEO',
	'E-commerce SEO',
	'Content Strategy',
	'Link Building',
	'International SEO',
	'YouTube SEO',
	'App Store Optimization',
]

type FormErrors = Partial<Record<keyof AgencySetupFormValues, string>>

function validate(values: AgencySetupFormValues): FormErrors {
	const errors: FormErrors = {}
	if (!values.agencyName.trim()) errors.agencyName = 'Agency name is required'
	if (values.websiteUrl && !/^https?:\/\/.+/.test(values.websiteUrl)) {
		errors.websiteUrl = 'Enter a valid URL starting with http(s)://'
	}
	return errors
}

export default function AgencySetupPage() {
	const router = useRouter()
	const [values, setValues] = useState<AgencySetupFormValues>({
		agencyName: '',
		websiteUrl: '',
		specialties: '',
		yearsOfExperience: '',
		shortBio: '',
	})
	const [selectedSpecialties, setSelectedSpecialties] = useState<Array<string>>([])
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
	const [apiError, setApiError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const update =
		(field: keyof AgencySetupFormValues) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
			setValues((prev) => ({ ...prev, [field]: e.target.value }))
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
		}

	const toggleSpecialty = (specialty: string) => {
		setSelectedSpecialties((prev) =>
			prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
		)
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
					accountType: 'AGENCY',
					agencyProfile: {
						agencyName: values.agencyName,
						description: values.shortBio,
						websiteUrl: values.websiteUrl,
						// TODO: send specialties, yearsOfExperience once backend extends AgencyProfileRequest
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
			title="Set up your agency profile"
			subtitle="Let businesses and freelancers know what your agency specialises in"
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<FormField label="Agency name" htmlFor="agencyName" error={fieldErrors.agencyName} required>
					<Input
						id="agencyName"
						value={values.agencyName}
						onChange={update('agencyName')}
						error={fieldErrors.agencyName}
						placeholder="Acme SEO Agency"
					/>
				</FormField>

				<FormField label="Agency website" htmlFor="websiteUrl" error={fieldErrors.websiteUrl} hint="Include https://">
					<Input
						id="websiteUrl"
						type="url"
						value={values.websiteUrl}
						onChange={update('websiteUrl')}
						error={fieldErrors.websiteUrl}
						placeholder="https://acmeseo.com"
					/>
				</FormField>

				<FormField label="Years of experience" htmlFor="yearsOfExperience">
					<select
						id="yearsOfExperience"
						value={values.yearsOfExperience}
						onChange={update('yearsOfExperience')}
						className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
					>
						<option value="">Select range</option>
						{['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'].map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</FormField>

				<FormField label="Specialities">
					<div className="flex flex-wrap gap-2">
						{SEO_SPECIALTIES.map((specialty) => {
							const active = selectedSpecialties.includes(specialty)
							return (
								<button
									key={specialty}
									type="button"
									onClick={() => toggleSpecialty(specialty)}
									className={[
										'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
										active
											? 'border-brand-500 bg-brand-500 text-white'
											: 'border-gray-200 bg-white text-gray-600 hover:border-brand-400',
									].join(' ')}
								>
									{specialty}
								</button>
							)
						})}
					</div>
				</FormField>

				<FormField label="Short bio" htmlFor="shortBio" hint="Describe your agency (optional, max 280 chars)">
					<Textarea
						id="shortBio"
						value={values.shortBio}
						onChange={update('shortBio')}
						maxLength={280}
						placeholder="We're a results-driven SEO agency specialising in…"
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
