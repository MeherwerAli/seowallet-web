import type { AccountType } from '@/types/auth'

interface ProfileTypeCardProps {
	accountType: AccountType
	title: string
	description: string
	icon: React.ReactNode
	selected: boolean
	onSelect: (accountType: AccountType) => void
}

export default function ProfileTypeCard({
	accountType,
	title,
	description,
	icon,
	selected,
	onSelect,
}: ProfileTypeCardProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(accountType)}
			className={[
				'flex w-full flex-col items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all',
				'hover:border-brand-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
				selected
					? 'border-brand-500 bg-brand-50 shadow-md'
					: 'border-gray-200 bg-white',
			].join(' ')}
		>
			<div
				className={[
					'flex h-14 w-14 items-center justify-center rounded-xl',
					selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500',
				].join(' ')}
			>
				{icon}
			</div>
			<div>
				<p className={`text-base font-semibold ${selected ? 'text-brand-600' : 'text-gray-900'}`}>
					{title}
				</p>
				<p className="mt-1 text-sm text-gray-500">{description}</p>
			</div>
			<div
				className={[
					'ml-auto h-5 w-5 shrink-0 self-end rounded-full border-2 transition-colors',
					selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300',
				].join(' ')}
			>
				{selected && (
					<svg viewBox="0 0 20 20" fill="white" className="h-full w-full">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
						/>
					</svg>
				)}
			</div>
		</button>
	)
}
