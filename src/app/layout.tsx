import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'SEOWallet',
	description: 'Your SEO workspace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="font-sans">
			<body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
		</html>
	)
}
