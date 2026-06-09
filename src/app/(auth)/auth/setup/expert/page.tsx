'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Textarea from '@/components/ui/Textarea'
import AuthCard from '@/components/auth/AuthCard'
import { profileApi, ApiError } from '@/lib/api-client'
import { requireSession } from '@/lib/session'
import type { ExpertSetupFormValues } from '@/types/auth'

const SEO_SPECIALTIES = [
	'Technical SEO',
	'Local SEO',
	'E-commerce SEO',
	'Content Strategy',
	'Link Building',
	'International SEO',
	'YouTube SEO',
	'App Store Optimization',
	'Keyword Research',
	'On-Page SEO',
	'Analytics & Reporting',
	'Site Audits',
]

export default function ExpertSetupPage() {
	const router = useRouter()
	const [values, setValues] = useState<ExpertSetupFormValues>({
		specialties: '',
		yearsOfExperience: '',
		shortBio: '',
	})
	const [selectedSpecialties, setSelectedSpecialties] = useState<Array<string>>([])
	const [apiError, setApiError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const updateBio = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setValues((prev) => ({ ...prev, shortBio: e.target.value }))
	}

	const updateExperience = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setValues((prev) => ({ ...prev, yearsOfExperience: e.target.value }))
	}

	const toggleSpecialty = (specialty: string) => {
		setSelectedSpecialties((prev) =>
			prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
		)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setApiError(null)
		try {
			const session = requireSession()
			// SEO_EXPERT has no sub-profile in the current backend DTO.
			// TODO: extend CompleteRegistrationRequest with expertProfile once backend is updated.
			await profileApi.completeRegistration(
				{ accountType: 'SEO_EXPERT' },
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
			title="Set up your freelancer profile"
			subtitle="Help clients understand your expertise and find the right match"
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
				<FormField label="Specialities" hint="Pick all that apply">
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

				<FormField label="Years of experience" htmlFor="yearsOfExperience">
					<select
						id="yearsOfExperience"
						value={values.yearsOfExperience}
						onChange={updateExperience}
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

				<FormField label="Short bio" htmlFor="shortBio" hint="Tell clients about your background (optional, max 280 chars)">
					<Textarea
						id="shortBio"
						value={values.shortBio}
						onChange={updateBio}
						maxLength={280}
						placeholder="Experienced SEO consultant with a focus on…"
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
