export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			{/* Logo */}
			<div className="mb-8 flex items-center gap-2">
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
					<svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
					</svg>
				</div>
				<span className="text-lg font-semibold text-gray-900">SEOWallet</span>
			</div>
			{children}
		</main>
	)
}
