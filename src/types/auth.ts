// ---------------------------------------------------------------------------
// Mirrors google-sso-user-service DTOs exactly.
// Fields marked TODO require backend extension on CompleteRegistrationRequest.
// ---------------------------------------------------------------------------

export type AccountType = 'SEO_EXPERT' | 'AGENCY' | 'BUSINESS'

// ── Auth responses ──────────────────────────────────────────────────────────

export interface SignupResponse {
	userId: string
	email: string
	username: string
	emailVerified: boolean
	message: string
}

export interface AuthUserProfile {
	id: string
	email: string
	username: string
	firstName: string
	lastName: string
	displayName: string
	pictureUrl: string | null
	badge: string | null
	status: string
	emailVerified: boolean
	accountType: AccountType | null
	profileTypes: Array<AccountType>
	roles: Array<string>
	profileCompleted: boolean
	newlyCreated: boolean
}

export interface AuthResponse {
	accessToken: string
	refreshToken: string
	tokenType: string
	expiresAt: string
	user: AuthUserProfile
	authProvider?: 'legacy-user-service' | 'keycloak'
	idToken?: string
}

// ── Profile responses ───────────────────────────────────────────────────────

export interface AgencyProfileResponse {
	agencyName: string
	description: string | null
	websiteUrl: string | null
	createdAt: string
}

export interface BusinessProfileResponse {
	businessName: string
	domainName: string | null
	websiteUrl: string | null
	createdAt: string
}

export interface AccountProfileResponse {
	userId: string
	email: string
	username: string
	firstName: string
	lastName: string
	displayName: string
	pictureUrl: string | null
	badge: string | null
	status: string
	accountType: AccountType | null
	profileTypes: Array<AccountType>
	roles: Array<string>
	profileCompleted: boolean
	agencyProfile: AgencyProfileResponse | null
	businessProfile: BusinessProfileResponse | null
	createdAt: string
}

// ── Request payloads ────────────────────────────────────────────────────────

export interface LocalSignupRequest {
	firstName: string
	lastName: string
	username: string
	email: string
	password: string
	retypePassword: string
}

export interface LocalLoginRequest {
	usernameOrEmail: string
	password: string
}

export interface AgencyProfileRequest {
	agencyName: string
	description: string
	websiteUrl: string
	// TODO: extend CompleteRegistrationRequest.AgencyProfileRequest with:
	//   specialties: string[]
	//   yearsOfExperience: number
}

export interface BusinessProfileRequest {
	businessName: string
	domainName: string
	websiteUrl: string
	// TODO: extend CompleteRegistrationRequest.BusinessProfileRequest with:
	//   numberOfEmployees: string (range enum)
	//   industry: string
	//   shortBio: string
}

export interface ExpertProfileRequest {
	// TODO: add CompleteRegistrationRequest.ExpertProfileRequest to backend with:
	//   specialties: string[]
	//   yearsOfExperience: number
	//   shortBio: string
}

export interface CompleteRegistrationRequest {
	accountType: AccountType
	agencyProfile?: AgencyProfileRequest
	businessProfile?: BusinessProfileRequest
}

// ── UI-only setup form values (superset of backend fields) ──────────────────

export interface AgencySetupFormValues {
	agencyName: string
	websiteUrl: string
	specialties: string
	yearsOfExperience: string
	shortBio: string
}

export interface BusinessSetupFormValues {
	businessName: string
	websiteUrl: string
	numberOfEmployees: string
	industry: string
	shortBio: string
}

export interface ExpertSetupFormValues {
	specialties: string
	yearsOfExperience: string
	shortBio: string
}

// ── Session ─────────────────────────────────────────────────────────────────

export interface StoredSession {
	accessToken: string
	refreshToken: string
	expiresAt: string
	user: AuthUserProfile
	authProvider?: 'legacy-user-service' | 'keycloak'
	idToken?: string
}

// ── API error ───────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
	message: string
	status: number
	path?: string
}
