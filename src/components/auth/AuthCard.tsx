interface AuthCardProps {
	title: string
	subtitle?: string
	children: React.ReactNode
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
	return (
		<div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-sm">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
			</div>
			{children}
		</div>
	)
}
