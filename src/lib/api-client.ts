import type {
	AccountProfileResponse,
	AuthResponse,
	CompleteRegistrationRequest,
	LocalLoginRequest,
	LocalSignupRequest,
	SignupResponse,
} from '@/types/auth'

const getBaseUrl = () =>
	(process.env.NEXT_PUBLIC_SSO_API_BASE_URL ?? 'http://localhost:8080/api/v1').replace(/\/+$/, '')

class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

async function request<ResponseType>(
	path: string,
	options: RequestInit = {},
	accessToken?: string,
): Promise<ResponseType> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json',
		...(options.headers as Record<string, string>),
	}

	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`
	}

	const response = await fetch(`${getBaseUrl()}${path}`, {
		...options,
		headers,
	})

	const text = await response.text()
	const data = text ? (JSON.parse(text) as ResponseType) : ({} as ResponseType)

	if (!response.ok) {
		const errBody = data as { message?: string; error?: string }
		throw new ApiError(response.status, errBody.message ?? errBody.error ?? `HTTP ${response.status}`)
	}

	return data
}

// ── Local auth ──────────────────────────────────────────────────────────────

export const authApi = {
	signup: (payload: LocalSignupRequest) =>
		request<SignupResponse>('/auth/signup', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),

	login: (payload: LocalLoginRequest) =>
		request<AuthResponse>('/auth/login', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),

	verifyEmail: (token: string) =>
		request<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

	forgotPassword: (email: string) =>
		request<{ message: string }>('/auth/forgot-password', {
			method: 'POST',
			body: JSON.stringify({ email }),
		}),

	resetPassword: (token: string, newPassword: string, retypePassword = newPassword) =>
		request<{ message: string }>('/auth/reset-password', {
			method: 'POST',
			body: JSON.stringify({ token, newPassword, retypePassword }),
		}),
}

// ── Google SSO ──────────────────────────────────────────────────────────────

export const googleAuthApi = {
	getAuthUrl: (redirectUri: string, signup = false) => {
		const params = new URLSearchParams({ redirectUri, clientKey: 'web', signup: signup ? 'true' : 'false' })
		return request<{ authUrl?: string; authorizationUrl?: string }>(`/auth/google/url?${params.toString()}`)
	},

	callback: (code: string, state: string, redirectUri: string) =>
		request<AuthResponse>('/auth/google/callback', {
			method: 'POST',
			body: JSON.stringify({ code, state, redirectUri }),
		}),
}

// ── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
	completeRegistration: (payload: CompleteRegistrationRequest, accessToken: string) =>
		request<AccountProfileResponse>('/profile/complete', { method: 'POST', body: JSON.stringify(payload) }, accessToken),

	getMe: (accessToken: string) => request<AccountProfileResponse>('/profile/me', {}, accessToken),
}

export type WalletTransaction = {
	id: string
	action: string
	description: string
	credits: number
	amount: number
	balanceAfter: number
	createdAt: string
	type: 'credit' | 'debit'
	source: 'tool' | 'topup' | 'grant' | 'payment' | 'refund' | 'adjustment'
	reference?: string
	idempotencyKey: string
}

export type WalletLedger = {
	userId: string
	balance: number
	transactions: WalletTransaction[]
}

export const walletApi = {
	getWallet: (accessToken: string) => request<WalletLedger>('/wallet', {}, accessToken),

	grant: (
		payload: { amount: number; description: string; reference?: string; idempotencyKey: string },
		accessToken: string,
	) =>
		request<WalletLedger>(
			'/wallet/grant',
			{ method: 'POST', body: JSON.stringify(payload) },
			accessToken,
		),

	spend: (
		payload: { amount: number; toolId: string; description: string; idempotencyKey: string },
		accessToken: string,
	) =>
		request<WalletLedger>(
			'/wallet/spend',
			{ method: 'POST', body: JSON.stringify(payload) },
			accessToken,
		),
}

export { ApiError }
