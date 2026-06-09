'use client'

import { useState } from 'react'

import Button from '@/components/ui/Button'
import { keycloakAuth } from '@/lib/keycloak-auth'

interface KeycloakSignInButtonProps {
	label?: string
	nextPath?: string
	identityProvider?: string
}

export default function KeycloakSignInButton({
	label = 'Continue with Google',
	nextPath = '/dashboard',
	identityProvider = 'google',
}: KeycloakSignInButtonProps) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleClick = async () => {
		setError(null)
		setLoading(true)
		try {
			await keycloakAuth.startLogin(nextPath, identityProvider)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to start SSO login')
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<Button variant="secondary" fullWidth loading={loading} onClick={handleClick} type="button">
				<KeycloakIcon />
				{label}
			</Button>
			{error && <p className="text-center text-xs text-red-500">{error}</p>}
		</div>
	)
}

function KeycloakIcon() {
	return (
		<svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 3 4 7v5c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-4Z" />
			<path d="M9 12h6" />
			<path d="M12 9v6" />
		</svg>
	)
}
