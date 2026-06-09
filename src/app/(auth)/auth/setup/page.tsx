'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import Button from '@/components/ui/Button'
import ProfileTypeCard from '@/components/auth/ProfileTypeCard'
import type { AccountType } from '@/types/auth'

const PROFILE_OPTIONS: Array<{
	accountType: AccountType
	title: string
	description: string
	icon: React.ReactNode
	href: string
}> = [
	{
		accountType: 'BUSINESS',
		title: 'Business',
		description: "I'm hiring SEO experts or agencies to grow my brand's search presence.",
		href: '/auth/setup/business',
		icon: (
			<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
				<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
			</svg>
		),
	},
	{
		accountType: 'AGENCY',
		title: 'Agency',
		description: 'I run an SEO agency and manage multiple clients and team members.',
		href: '/auth/setup/agency',
		icon: (
			<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
				<path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
			</svg>
		),
	},
	{
		accountType: 'SEO_EXPERT',
		title: 'Freelancer',
		description: "I'm an independent SEO expert offering my skills and services to clients.",
		href: '/auth/setup/expert',
		icon: (
			<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
				<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
			</svg>
		),
	},
]

export default function SetupPage() {
	const router = useRouter()
	const [selected, setSelected] = useState<AccountType | null>(null)

	const selectedOption = PROFILE_OPTIONS.find((opt) => opt.accountType === selected)

	const handleContinue = () => {
		if (selectedOption) {
			router.push(selectedOption.href)
		}
	}

	return (
		<div className="w-full max-w-2xl">
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-semibold text-gray-900">How will you use SEOWallet?</h1>
				<p className="mt-2 text-gray-500">Choose your account type. You can add more later.</p>
			</div>

			<div className="flex flex-col gap-4">
				{PROFILE_OPTIONS.map((option) => (
					<ProfileTypeCard
						key={option.accountType}
						accountType={option.accountType}
						title={option.title}
						description={option.description}
						icon={option.icon}
						selected={selected === option.accountType}
						onSelect={setSelected}
					/>
				))}
			</div>

			<Button
				fullWidth
				className="mt-6"
				disabled={!selected}
				onClick={handleContinue}
			>
				Continue
			</Button>
		</div>
	)
}
