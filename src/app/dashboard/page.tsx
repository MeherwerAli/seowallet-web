'use client'

import { useRouter } from 'next/navigation'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'

import Spinner from '@/components/ui/Spinner'
import { ApiError, profileApi, walletApi, type WalletLedger, type WalletTransaction } from '@/lib/api-client'
import { keycloakAuth } from '@/lib/keycloak-auth'
import { analyzeSeoTool, seoTools, type SeoTool, type ToolAnalysisResult } from '@/lib/seo-tools'
import { LOGOUT_MARKER_KEY, SESSION_KEY, SHARED_SESSION_KEY, clearSession, requireSession } from '@/lib/session'
import type { AccountProfileResponse, AuthUserProfile, StoredSession } from '@/types/auth'

type Role = 'business' | 'seo'
type Screen = 'dashboard' | 'tools' | 'marketplace' | 'wallet' | 'profile' | 'keyword-tool'
type Theme = 'dark' | 'light'
type Toast = { id: number; message: string; type: 'credit' | 'debit' | 'info' }
type ToolRunState = 'idle' | 'loading' | 'results'
type ProfileDraft = {
	phoneNumber: string
	nationality: string
	country: string
	city: string
	timezone: string
	headline: string
	bio: string
	linkedinUrl: string
	xUrl: string
	facebookUrl: string
	websiteUrl: string
	portfolioUrl: string
	relatedLinks: string
}
type RoleSetupDraft = {
	companyName: string
	websiteUrl: string
	industry: string
	teamSize: string
	profileKind: 'freelancer' | 'agency'
	serviceName: string
	specialties: string
	yearsOfExperience: string
	shortBio: string
}
type RoleSetupRecord = {
	business?: RoleSetupDraft & { completedAt: string }
	seo?: RoleSetupDraft & { completedAt: string }
}

const emptyProfileDraft: ProfileDraft = {
	phoneNumber: '',
	nationality: '',
	country: '',
	city: '',
	timezone: '',
	headline: '',
	bio: '',
	linkedinUrl: '',
	xUrl: '',
	facebookUrl: '',
	websiteUrl: '',
	portfolioUrl: '',
	relatedLinks: '',
}

const emptyRoleSetupDraft: RoleSetupDraft = {
	companyName: '',
	websiteUrl: '',
	industry: '',
	teamSize: '',
	profileKind: 'freelancer',
	serviceName: '',
	specialties: '',
	yearsOfExperience: '',
	shortBio: '',
}

const tools = seoTools
type Tool = SeoTool

const jobsSeo = [
	{ id: 1, title: 'Full SEO Audit - B2B SaaS Platform', budget: '$200', posted: '2h ago', client: 'TechFlow Inc.', tags: ['Site Audit', 'KW Research'] },
	{ id: 2, title: '500-keyword research list', budget: '$120', posted: '5h ago', client: 'Bloom Agency', tags: ['Keyword Research'] },
	{ id: 3, title: 'Competitor analysis report', budget: '$180', posted: '1d ago', client: 'Momentum Labs', tags: ['Competitor Gap', 'Reports'] },
]

const jobsBusiness = [
	{ id: 1, title: 'SEO Audit & Strategy for E-commerce', budget: '$150', bids: 4, posted: '2h ago', tags: ['Site Audit', 'Keyword Research'] },
	{ id: 2, title: 'Monthly SEO Reporting - SaaS Startup', budget: '$80/mo', bids: 7, posted: '1d ago', tags: ['Reports', 'Rank Tracking'] },
	{ id: 3, title: 'Backlink Campaign for Tech Blog', budget: '$250', bids: 2, posted: '3d ago', tags: ['Backlinks', 'Outreach'] },
]

const packages = [
	{ id: 'starter', name: 'Starter', credits: 3000, price: 29, color: '#00cfa3', note: 'Best for occasional use' },
	{ id: 'growth', name: 'Growth', credits: 7500, price: 59, color: '#4d7fff', note: 'Most popular' },
	{ id: 'scale', name: 'Scale', credits: 20000, price: 149, color: '#ffc84a', note: 'Agencies and teams' },
]

const dashboardThemes: Record<Theme, CSSProperties> = {
	dark: {
		'--sw-bg': '#07101f',
		'--sw-sidebar': '#040c18',
		'--sw-card': '#0f1d34',
		'--sw-accent-card': '#0d1e38',
		'--sw-border': '#172440',
		'--sw-text': '#e6f0ff',
		'--sw-body': '#c8d8f0',
		'--sw-muted': '#6b7d9a',
		'--sw-soft': '#8a9bb8',
		'--sw-placeholder': '#43536d',
		'--sw-accent': '#00cfa3',
		'--sw-accent-contrast': '#041a14',
		'--sw-accent-soft': '#00cfa31f',
		'--sw-accent-border': '#00cfa340',
		'--sw-info': '#4d7fff',
		'--sw-info-soft': '#4d7fff1f',
		'--sw-info-border': '#4d7fff4d',
		'--sw-muted-soft': '#6b7d9a1a',
		'--sw-overlay': '#020817cc',
	} as CSSProperties,
	light: {
		'--sw-bg': '#f8fafc',
		'--sw-sidebar': '#ffffff',
		'--sw-card': '#ffffff',
		'--sw-accent-card': '#f0f4ff',
		'--sw-border': '#e5e7eb',
		'--sw-text': '#111827',
		'--sw-body': '#374151',
		'--sw-muted': '#6b7280',
		'--sw-soft': '#4b5563',
		'--sw-placeholder': '#9ca3af',
		'--sw-accent': '#4f6ef7',
		'--sw-accent-contrast': '#ffffff',
		'--sw-accent-soft': '#f0f4ff',
		'--sw-accent-border': '#e0eaff',
		'--sw-info': '#4f6ef7',
		'--sw-info-soft': '#f0f4ff',
		'--sw-info-border': '#e0eaff',
		'--sw-muted-soft': '#f3f4f6',
		'--sw-overlay': '#11182799',
	} as CSSProperties,
}

function roleFromAccount(user?: AuthUserProfile | AccountProfileResponse | null): Role {
	return user?.accountType === 'BUSINESS' ? 'business' : 'seo'
}

function displayName(user?: AuthUserProfile | AccountProfileResponse | null) {
	return user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || user?.email || 'User'
}

function initials(user?: AuthUserProfile | AccountProfileResponse | null) {
	return displayName(user)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join('') || 'U'
}

function userStorageKey(user?: AuthUserProfile | AccountProfileResponse | null) {
	const id = 'userId' in (user ?? {}) ? (user as AccountProfileResponse).userId : (user as AuthUserProfile | null)?.id
	return `seowallet-role-setup:${id || user?.email || 'guest'}`
}

function userProfileStorageKey(user?: AuthUserProfile | AccountProfileResponse | null) {
	const id = 'userId' in (user ?? {}) ? (user as AccountProfileResponse).userId : (user as AuthUserProfile | null)?.id
	return `seowallet-profile-details:${id || user?.email || 'guest'}`
}

function formatTransactionDate(createdAt: string) {
	const date = new Date(createdAt)
	if (Number.isNaN(date.getTime())) return 'Unknown'

	const today = new Date()
	const isToday = date.toDateString() === today.toDateString()
	if (isToday) {
		return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
	}

	const yesterday = new Date(today)
	yesterday.setDate(today.getDate() - 1)
	if (date.toDateString() === yesterday.toDateString()) {
		return 'Yesterday'
	}

	return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function createIdempotencyKey(prefix: string) {
	const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2)
	return `${prefix}:${Date.now()}:${random}`
}

function hasRoleSetup(role: Role, user?: AuthUserProfile | AccountProfileResponse | null, setup?: RoleSetupRecord) {
	if (role === 'business') {
		return Boolean(
			setup?.business ||
			user?.accountType === 'BUSINESS' ||
			('businessProfile' in (user ?? {}) && (user as AccountProfileResponse).businessProfile),
		)
	}
	return Boolean(
		setup?.seo ||
		user?.accountType === 'SEO_EXPERT' ||
		user?.accountType === 'AGENCY' ||
		('agencyProfile' in (user ?? {}) && (user as AccountProfileResponse).agencyProfile),
	)
}

function isEmailVerified(user?: AuthUserProfile | AccountProfileResponse | null) {
	return 'emailVerified' in (user ?? {}) ? Boolean((user as AuthUserProfile).emailVerified) : true
}

function UserAvatar({ user }: { user?: AuthUserProfile | AccountProfileResponse | null }) {
	const [failed, setFailed] = useState(false)
	const pictureUrl = user?.pictureUrl
	if (pictureUrl && !failed) {
		return (
			<img
				src={pictureUrl}
				alt={displayName(user)}
				onError={() => setFailed(true)}
				className="h-10 w-10 rounded-xl border border-[var(--sw-border)] object-cover"
				referrerPolicy="no-referrer"
			/>
		)
	}
	return (
		<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] text-sm font-extrabold text-[var(--sw-accent)]">
			{initials(user)}
		</div>
	)
}

function RoleSetupModal({
	role,
	draft,
	onChange,
	onCancel,
	onSubmit,
}: {
	role: Role
	draft: RoleSetupDraft
	onChange: (draft: RoleSetupDraft) => void
	onCancel: () => void
	onSubmit: () => void
}) {
	const isBusiness = role === 'business'
	const canSubmit = isBusiness
		? Boolean(draft.companyName.trim() && draft.industry.trim() && draft.shortBio.trim())
		: Boolean(draft.serviceName.trim() && draft.specialties.trim() && draft.yearsOfExperience.trim() && draft.shortBio.trim())

	const setField = (field: keyof RoleSetupDraft, value: string) => onChange({ ...draft, [field]: value })

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--sw-overlay)] px-4 py-6 backdrop-blur">
			<div className="w-full max-w-2xl rounded-2xl border border-[var(--sw-border)] bg-[var(--sw-bg)] shadow-2xl">
				<div className="border-b border-[var(--sw-border)] px-6 py-5">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-xl font-extrabold text-[var(--sw-text)]">
								{isBusiness ? 'Set up your Business profile' : 'Set up your SEO profile'}
							</h2>
							<p className="mt-1 text-sm leading-6 text-[var(--sw-soft)]">
								{isBusiness
									? 'Add the basics businesses need before hiring experts and running SEO workflows.'
									: 'Add the details businesses need before they can evaluate your SEO services.'}
							</p>
						</div>
						<button onClick={onCancel} className="rounded-lg border border-[var(--sw-border)] px-3 py-2 text-sm font-bold text-[var(--sw-soft)] hover:text-[var(--sw-text)]">
							Close
						</button>
					</div>
				</div>

				<div className="grid gap-4 px-6 py-5 md:grid-cols-2">
					{isBusiness ? (
						<>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Business name</span>
								<input value={draft.companyName} onChange={(event) => setField('companyName', event.target.value)} className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Website</span>
								<input value={draft.websiteUrl} onChange={(event) => setField('websiteUrl', event.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Industry</span>
								<input value={draft.industry} onChange={(event) => setField('industry', event.target.value)} className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Team size</span>
								<select value={draft.teamSize} onChange={(event) => setField('teamSize', event.target.value)} className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]">
									<option value="">Select</option>
									<option value="1-10">1-10</option>
									<option value="11-50">11-50</option>
									<option value="51-200">51-200</option>
									<option value="201+">201+</option>
								</select>
							</label>
						</>
					) : (
						<>
							<div className="md:col-span-2">
								<div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Profile type</div>
								<div className="grid gap-2 sm:grid-cols-2">
									{[
										{ id: 'freelancer' as const, label: 'SEO Freelancer' },
										{ id: 'agency' as const, label: 'SEO Agency' },
									].map((item) => (
										<button
											key={item.id}
											onClick={() => onChange({ ...draft, profileKind: item.id })}
											className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${draft.profileKind === item.id ? 'border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]' : 'border-[var(--sw-border)] bg-[var(--sw-sidebar)] text-[var(--sw-soft)]'}`}
										>
											{item.label}
										</button>
									))}
								</div>
							</div>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">{draft.profileKind === 'agency' ? 'Agency name' : 'Display service name'}</span>
								<input value={draft.serviceName} onChange={(event) => setField('serviceName', event.target.value)} className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Website or portfolio</span>
								<input value={draft.websiteUrl} onChange={(event) => setField('websiteUrl', event.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Specialties</span>
								<input value={draft.specialties} onChange={(event) => setField('specialties', event.target.value)} placeholder="Technical SEO, SaaS SEO" className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
							<label className="space-y-2">
								<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Years of experience</span>
								<input value={draft.yearsOfExperience} onChange={(event) => setField('yearsOfExperience', event.target.value)} inputMode="numeric" className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
							</label>
						</>
					)}
					<label className="space-y-2 md:col-span-2">
						<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">{isBusiness ? 'What do you need SEO help with?' : 'Short bio'}</span>
						<textarea value={draft.shortBio} onChange={(event) => setField('shortBio', event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none focus:border-[var(--sw-accent)]" />
					</label>
				</div>

				<div className="flex flex-col-reverse gap-3 border-t border-[var(--sw-border)] px-6 py-5 sm:flex-row sm:justify-end">
					<AppButton variant="ghost" onClick={onCancel}>Cancel</AppButton>
					<AppButton onClick={onSubmit} disabled={!canSubmit}>
						Save and switch
					</AppButton>
				</div>
			</div>
		</div>
	)
}

function Card({ children, accent = false, className = '' }: { children: React.ReactNode; accent?: boolean; className?: string }) {
	return (
		<div className={[
			'rounded-2xl border p-5',
			accent ? 'border-[var(--sw-accent-border)] bg-[linear-gradient(140deg,var(--sw-accent-card),var(--sw-card))]' : 'border-[var(--sw-border)] bg-[var(--sw-card)]',
			className,
		].join(' ')}>
			{children}
		</div>
	)
}

function Badge({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'blue' | 'yellow' | 'purple' | 'muted' }) {
	const tones = {
		green: 'bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]',
		blue: 'bg-[var(--sw-info-soft)] text-[var(--sw-info)]',
		yellow: 'bg-[#ffc84a1f] text-[#ffc84a]',
		purple: 'bg-[#a855f71f] text-[#a855f7]',
		muted: 'bg-[var(--sw-muted-soft)] text-[var(--sw-soft)]',
	}
	return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>
}

function ToolIcon({ short, color }: { short: string; color: string }) {
	return (
		<div
			className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold tracking-wide"
			style={{ color, borderColor: `${color}33`, backgroundColor: `${color}18` }}
		>
			{short}
		</div>
	)
}

function AppButton({
	children,
	onClick,
	variant = 'primary',
	className = '',
	disabled = false,
}: {
	children: React.ReactNode
	onClick?: () => void
	variant?: 'primary' | 'secondary' | 'ghost'
	className?: string
	disabled?: boolean
}) {
	const variants = {
		primary: 'bg-[var(--sw-accent)] text-[var(--sw-accent-contrast)]',
		secondary: 'border border-[var(--sw-border)] bg-[var(--sw-card)] text-[var(--sw-text)]',
		ghost: 'border border-[var(--sw-border)] bg-transparent text-[var(--sw-text)]',
	}
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-bold transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
		>
			{children}
		</button>
	)
}

function Icon({ name, className = 'h-4 w-4' }: { name: 'sun' | 'moon' | 'chevron' | 'user' | 'logout' | 'home'; className?: string }) {
	const paths = {
		sun: (
			<>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
			</>
		),
		moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z" />,
		chevron: <path d="m6 9 6 6 6-6" />,
		user: (
			<>
				<path d="M20 21a8 8 0 0 0-16 0" />
				<circle cx="12" cy="7" r="4" />
			</>
		),
		logout: (
			<>
				<path d="M10 17 15 12 10 7" />
				<path d="M15 12H3" />
				<path d="M21 3v18" />
			</>
		),
		home: (
			<>
				<path d="m3 11 9-8 9 8" />
				<path d="M5 10v10h14V10" />
			</>
		),
	}

	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			{paths[name]}
		</svg>
	)
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
	return (
		<button
			onClick={onToggle}
			className="inline-flex items-center gap-2 rounded-xl border border-[var(--sw-border)] bg-[var(--sw-card)] px-3 py-2 text-xs font-bold text-[var(--sw-text)] transition hover:opacity-85"
			aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
		>
			<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]">
				<Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-3.5 w-3.5" />
			</span>
			<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
		</button>
	)
}

function AccountMenu({
	user,
	theme,
	open,
	onToggleOpen,
	onProfile,
	onToggleTheme,
	onLogout,
}: {
	user?: AuthUserProfile | AccountProfileResponse | null
	theme: Theme
	open: boolean
	onToggleOpen: () => void
	onProfile: () => void
	onToggleTheme: () => void
	onLogout: () => void
}) {
	return (
		<div className="relative">
			<button onClick={onToggleOpen} className="flex items-center gap-2 rounded-xl border border-transparent p-1 transition hover:border-[var(--sw-border)] hover:bg-[var(--sw-card)]" aria-label="Open account menu">
				<UserAvatar user={user} />
				<Icon name="chevron" className="hidden h-4 w-4 text-[var(--sw-muted)] sm:block" />
			</button>
			{open ? (
				<div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-[var(--sw-border)] bg-[var(--sw-card)] shadow-2xl">
					<div className="border-b border-[var(--sw-border)] p-4">
						<div className="flex items-center gap-3">
							<UserAvatar user={user} />
							<div className="min-w-0">
								<div className="truncate text-sm font-extrabold text-[var(--sw-text)]">{displayName(user)}</div>
								<div className="truncate text-xs text-[var(--sw-muted)]">{user?.email}</div>
							</div>
						</div>
					</div>
					<div className="p-2">
						<button onClick={onProfile} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[var(--sw-text)] transition hover:bg-[var(--sw-bg)]">
							<Icon name="user" />
							Profile
						</button>
						<button onClick={onToggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[var(--sw-text)] transition hover:bg-[var(--sw-bg)]">
							<Icon name={theme === 'dark' ? 'sun' : 'moon'} />
							{theme === 'dark' ? 'Light mode' : 'Dark mode'}
						</button>
						<button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#f87171] transition hover:bg-[#f8717114]">
							<Icon name="logout" />
							Log out
						</button>
					</div>
				</div>
			) : null}
		</div>
	)
}

function Sidebar({
	screen,
	role,
	credits,
	onNavigate,
	onSetRole,
}: {
	screen: Screen
	role: Role
	credits: number
	onNavigate: (screen: Screen) => void
	onSetRole: (role: Role) => void
}) {
	const nav = [
		{ id: 'dashboard' as const, label: 'Dashboard' },
		{ id: 'tools' as const, label: 'Tools' },
		{ id: 'marketplace' as const, label: role === 'business' ? 'Hire an SEO' : 'Find Work' },
		{ id: 'wallet' as const, label: 'Wallet' },
	]

	return (
		<aside className="hidden h-dvh w-[260px] shrink-0 flex-col overflow-hidden border-r border-[var(--sw-border)] bg-[var(--sw-sidebar)] lg:flex">
			<div className="border-b border-[var(--sw-border)] px-6 py-5">
				<button onClick={() => onNavigate('dashboard')} className="flex items-center gap-3 text-left transition hover:opacity-80">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] text-sm font-extrabold text-[var(--sw-accent)]">SW</div>
					<div>
						<div className="text-[15px] font-extrabold tracking-tight text-[var(--sw-text)]">SEO Wallets</div>
						<div className="text-[11px] text-[var(--sw-muted)]">Credit-powered SEO</div>
					</div>
				</button>
			</div>

			<div className="px-4 py-4">
				<div className="flex gap-1 rounded-xl border border-[var(--sw-border)] bg-[var(--sw-bg)] p-1">
					{[
						{ id: 'business' as const, label: 'Business' },
						{ id: 'seo' as const, label: 'SEO Pro' },
					].map((item) => (
						<button
							key={item.id}
							onClick={() => onSetRole(item.id)}
							className={`flex-1 rounded-[9px] px-2.5 py-2 text-xs font-bold transition ${role === item.id ? 'bg-[var(--sw-card)] text-[var(--sw-accent)] shadow' : 'text-[var(--sw-muted)]'}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
				{nav.map((item) => (
					<button
						key={item.id}
						onClick={() => onNavigate(item.id)}
						className={`rounded-xl border-l-2 px-4 py-3 text-left text-sm font-bold transition ${screen === item.id || (item.id === 'tools' && screen === 'keyword-tool') ? 'border-[var(--sw-accent)] bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]' : 'border-transparent text-[var(--sw-soft)] hover:bg-[var(--sw-bg)]'}`}
					>
						{item.label}
					</button>
				))}
			</nav>

			<div className="border-t border-[var(--sw-border)] p-4">
				<div className="mb-3 rounded-xl border border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] p-4">
					<div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-[var(--sw-muted)]">
						<span>Credits</span>
						<button onClick={() => onNavigate('wallet')} className="normal-case tracking-normal">History</button>
					</div>
					<div className="mt-2 text-2xl font-extrabold text-[var(--sw-accent)]">{credits.toLocaleString()}</div>
				</div>
			</div>
		</aside>
	)
}

function DashboardScreen({
	role,
	credits,
	transactions,
	user,
	onNavigate,
	onOpenTool,
}: {
	role: Role
	credits: number
	transactions: WalletTransaction[]
	user?: AuthUserProfile | AccountProfileResponse | null
	onNavigate: (screen: Screen) => void
	onOpenTool: (tool: Tool) => void
}) {
	const now = Date.now()
	const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
	const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
	const creditsAddedThisWeek = transactions
		.filter((item) => item.type === 'credit' && new Date(item.createdAt).getTime() >= sevenDaysAgo)
		.reduce((sum, item) => sum + item.credits, 0)
	const toolsRunThisMonth = transactions
		.filter((item) => item.source === 'tool' && new Date(item.createdAt).getTime() >= thirtyDaysAgo).length
	const creditsUsedThisMonth = Math.abs(transactions
		.filter((item) => item.type === 'debit' && new Date(item.createdAt).getTime() >= thirtyDaysAgo)
		.reduce((sum, item) => sum + item.credits, 0))
	const lastTransaction = transactions[0]
	const stats = role === 'business'
		? [
			{ label: 'Credits Remaining', val: credits.toLocaleString(), color: '#00cfa3', sub: `${creditsAddedThisWeek.toLocaleString()} added this week` },
			{ label: 'Tools Run This Month', val: toolsRunThisMonth.toLocaleString(), color: '#4d7fff', sub: `${creditsUsedThisMonth.toLocaleString()} credits used` },
			{ label: 'Ledger Entries', val: transactions.length.toLocaleString(), color: '#ffc84a', sub: lastTransaction ? `Last: ${formatTransactionDate(lastTransaction.createdAt)}` : 'No activity yet' },
			{ label: 'Avg Credits / Tool', val: toolsRunThisMonth ? Math.round(creditsUsedThisMonth / toolsRunThisMonth).toLocaleString() : '0', color: '#a855f7', sub: 'based on real runs' },
		]
		: [
			{ label: 'Credits Remaining', val: credits.toLocaleString(), color: '#00cfa3', sub: `${creditsAddedThisWeek.toLocaleString()} added this week` },
			{ label: 'Active Clients', val: '4', color: '#4d7fff', sub: '2 new this month' },
			{ label: 'Bids Pending', val: '2', color: '#ffc84a', sub: 'Awaiting response' },
			{ label: 'Tools Run This Month', val: toolsRunThisMonth.toLocaleString(), color: '#a855f7', sub: `${creditsUsedThisMonth.toLocaleString()} credits used` },
		]

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm text-[var(--sw-muted)]">Welcome back</p>
					<h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--sw-text)]">
						{role === 'business' ? `Good morning, ${displayName(user).split(' ')[0]}` : `${displayName(user).split(' ')[0]}, 2 jobs match your profile`}
					</h1>
				</div>
				<div className="flex items-center gap-3 rounded-2xl border border-[var(--sw-border)] bg-[var(--sw-card)] p-2 pr-4">
					<UserAvatar user={user} />
					<div>
						<div className="text-sm font-bold text-[var(--sw-text)]">{displayName(user)}</div>
						<div className="text-xs text-[var(--sw-muted)]">{user?.email}</div>
					</div>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.label}>
						<div className="text-3xl font-extrabold" style={{ color: stat.color }}>{stat.val}</div>
						<div className="mt-2 text-sm font-bold text-[var(--sw-text)]">{stat.label}</div>
						<div className="mt-1 text-xs text-[var(--sw-muted)]">{stat.sub}</div>
					</Card>
				))}
			</div>

			{role === 'business' ? (
				<>
					<div className="flex items-center justify-between">
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Quick Tools</h2>
						<button onClick={() => onNavigate('tools')} className="text-sm font-bold text-[var(--sw-accent)]">All tools</button>
					</div>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						{tools.slice(0, 4).map((tool) => (
							<button key={tool.id} onClick={() => onOpenTool(tool)} className="text-left">
								<Card className="h-full transition hover:border-[var(--sw-accent-border)]">
									<ToolIcon short={tool.short} color={tool.color} />
									<div className="mt-3 text-sm font-extrabold text-[var(--sw-text)]">{tool.name}</div>
									<div className="mt-3"><Badge>{tool.credits} credits</Badge></div>
								</Card>
							</button>
						))}
					</div>
					<ActivityList transactions={transactions.slice(0, 5)} />
				</>
			) : (
				<JobList role={role} />
			)}
		</div>
	)
}

function ActivityList({ transactions }: { transactions: WalletTransaction[] }) {
	return (
		<div>
			<div className="mb-3 flex items-center justify-between gap-3">
				<h2 className="text-base font-extrabold text-[var(--sw-text)]">Recent Credit Activity</h2>
				<Badge tone="muted">{transactions.length} entries</Badge>
			</div>
			<Card className="overflow-hidden p-0">
				{transactions.length ? (
					transactions.map((item, index) => (
						<div key={item.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${index < transactions.length - 1 ? 'border-b border-[var(--sw-border)]' : ''}`}>
							<div className="flex min-w-0 items-center gap-3">
								<span className={`h-2 w-2 shrink-0 rounded-full ${item.type === 'credit' ? 'bg-[var(--sw-accent)]' : 'bg-[#f87171]'}`} />
								<div className="min-w-0">
									<div className="truncate text-sm font-bold text-[var(--sw-body)]">{item.action}</div>
									<div className="text-xs text-[var(--sw-muted)]">Balance after: {item.balanceAfter.toLocaleString()} credits</div>
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-4">
								<span className="hidden text-xs text-[var(--sw-muted)] sm:inline">{formatTransactionDate(item.createdAt)}</span>
								<span className={`min-w-20 text-right text-sm font-extrabold ${item.type === 'credit' ? 'text-[var(--sw-accent)]' : 'text-[#f87171]'}`}>
									{item.credits > 0 ? '+' : ''}{item.credits.toLocaleString()}
								</span>
							</div>
						</div>
					))
				) : (
					<div className="px-5 py-8 text-center text-sm leading-6 text-[var(--sw-muted)]">
						No credit transactions yet. Run a tool or add credits to create ledger entries.
					</div>
				)}
			</Card>
		</div>
	)
}

function ToolsScreen({ onOpenTool }: { onOpenTool: (tool: Tool) => void }) {
	const [category, setCategory] = useState('All')
	const categories = ['All', ...Array.from(new Set(tools.map((tool) => tool.category)))]
	const visible = category === 'All' ? tools : tools.filter((tool) => tool.category === category)
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold text-[var(--sw-text)]">SEO Tools</h1>
				<p className="mt-1 text-sm text-[var(--sw-muted)]">{tools.length} extension-derived tools available · pay per action</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{categories.map((item) => (
					<button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-sm font-bold ${category === item ? 'border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]' : 'border-[var(--sw-border)] text-[var(--sw-muted)]'}`}>
						{item}
					</button>
				))}
			</div>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{visible.map((tool) => (
					<Card key={tool.id} className="flex min-h-52 flex-col gap-3">
						<div className="flex items-start justify-between gap-3">
							<ToolIcon short={tool.short} color={tool.color} />
							<Badge>{tool.credits} credits</Badge>
						</div>
						<div>
							<h2 className="text-base font-extrabold text-[var(--sw-text)]">{tool.name}</h2>
							<p className="mt-2 text-sm leading-6 text-[var(--sw-muted)]">{tool.desc}</p>
							<p className="mt-3 text-xs font-bold text-[var(--sw-soft)]">From Chrome extension: {tool.extensionOrigin}</p>
						</div>
						<AppButton variant="secondary" className="mt-auto self-start" onClick={() => onOpenTool(tool)}>
							Open Tool
						</AppButton>
					</Card>
				))}
			</div>
		</div>
	)
}

function ToolDetailScreen({
	tool,
	query,
	state,
	result,
	onQueryChange,
	onBack,
	onRun,
}: {
	tool: Tool
	query: string
	state: ToolRunState
	result: ToolAnalysisResult | null
	onQueryChange: (value: string) => void
	onBack: () => void
	onRun: () => void
}) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<ToolIcon short={tool.short} color={tool.color} />
					<div>
						<button onClick={onBack} className="mb-2 text-sm font-bold text-[var(--sw-muted)] hover:text-[var(--sw-accent)]">Back to tools</button>
						<h1 className="text-2xl font-extrabold text-[var(--sw-text)]">{tool.name}</h1>
						<p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--sw-muted)]">{tool.desc}</p>
					</div>
				</div>
				<Badge>{tool.credits} credits per run</Badge>
			</div>

			<Card className="grid gap-4 xl:grid-cols-[1fr_280px] xl:items-end">
				<label className="flex-1 space-y-2">
					<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">{tool.inputLabel}</span>
					{tool.inputMode === 'textarea' ? (
						<textarea
							value={query}
							onChange={(event) => onQueryChange(event.target.value)}
							placeholder={tool.placeholder}
							rows={6}
							className="w-full resize-y rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm leading-6 text-[var(--sw-text)] outline-none placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
						/>
					) : (
						<input
							value={query}
							onChange={(event) => onQueryChange(event.target.value)}
							placeholder={tool.placeholder}
							className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
						/>
					)}
				</label>
				<div className="space-y-3">
					<div className="rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] p-3 text-xs leading-5 text-[var(--sw-soft)]">
						<span className="font-bold text-[var(--sw-text)]">Web workflow:</span> {tool.webWorkflow}
					</div>
					<AppButton className="w-full" onClick={onRun} disabled={!query.trim() || state === 'loading'}>
						{state === 'loading' ? 'Analyzing...' : tool.credits ? `Run Tool - ${tool.credits} credits` : 'Run Tool'}
					</AppButton>
				</div>
			</Card>

			{state === 'idle' ? (
				<Card accent className="flex flex-col items-center gap-4 py-12 text-center">
					<ToolIcon short={tool.short} color={tool.color} />
					<div>
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Set up your first run</h2>
						<p className="mt-2 max-w-md text-sm leading-6 text-[var(--sw-muted)]">Use the web workflow for {tool.extensionOrigin}. Paste input, run the local analysis, then connect backend execution later where live data is needed.</p>
					</div>
					<div className="flex flex-wrap justify-center gap-2">
						{tool.samples.map((sample) => (
							<button key={sample} onClick={() => onQueryChange(sample)} className="rounded-full border border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--sw-accent)]">
								Use sample
							</button>
						))}
					</div>
				</Card>
			) : null}

			{state === 'loading' ? (
				<div className="space-y-4">
					<Card>
						<div className="mb-3 flex items-center gap-3 text-sm font-bold text-[var(--sw-text)]">
							<span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--sw-accent)]" />
							Analyzing {query}
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-[var(--sw-border)]">
							<div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,var(--sw-accent),var(--sw-info))]" />
						</div>
					</Card>
					<div className="grid gap-4 md:grid-cols-4">
						{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 rounded-2xl bg-[var(--sw-muted-soft)]" />)}
					</div>
				</div>
			) : null}

			{state === 'results' ? (
				result ? <ToolResult result={result} /> : null
			) : null}
		</div>
	)
}

function ToolResult({ result }: { result: ToolAnalysisResult }) {
	return (
		<div className="space-y-5">
			<Card accent>
				<h2 className="text-lg font-extrabold text-[var(--sw-text)]">{result.title}</h2>
				<p className="mt-2 text-sm leading-6 text-[var(--sw-soft)]">{result.summary}</p>
			</Card>

			<div className="grid gap-4 md:grid-cols-4">
				{result.metrics.map((metric) => (
					<Card key={metric.label}>
						<div className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">{metric.label}</div>
						<div className="mt-2 text-2xl font-extrabold" style={{ color: metric.color || 'var(--sw-text)' }}>{metric.value}</div>
						<div className="mt-1 truncate text-xs text-[var(--sw-muted)]">{metric.sub}</div>
					</Card>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				{result.findings.map((finding) => (
					<Card key={`${finding.title}-${finding.detail}`}>
						<Badge tone={finding.tone === 'good' ? 'green' : finding.tone === 'warn' ? 'yellow' : 'blue'}>{finding.tone}</Badge>
						<h3 className="mt-3 text-sm font-extrabold text-[var(--sw-text)]">{finding.title}</h3>
						<p className="mt-2 break-words text-sm leading-6 text-[var(--sw-muted)]">{finding.detail}</p>
					</Card>
				))}
			</div>

			{result.output ? (
				<Card>
					<div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Output</div>
					<div className="break-all rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] p-4 text-sm font-bold text-[var(--sw-accent)]">{result.output}</div>
				</Card>
			) : null}

			{result.table ? (
				<Card className="overflow-hidden p-0">
					<div className="flex items-center justify-between border-b border-[var(--sw-border)] px-5 py-4">
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Extracted data</h2>
						<Badge tone="muted">{result.table.rows.length} rows</Badge>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] text-left text-sm">
							<thead className="border-b border-[var(--sw-border)] text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">
								<tr>
									{result.table.columns.map((column) => (
										<th key={column} className="px-5 py-3">{column}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{result.table.rows.map((row, rowIndex) => (
									<tr key={`${row.join('-')}-${rowIndex}`} className="border-b border-[var(--sw-border)] last:border-b-0">
										{row.map((cell, cellIndex) => (
											<td key={`${cell}-${cellIndex}`} className="max-w-[420px] break-words px-5 py-4 text-[var(--sw-body)] first:font-bold first:text-[var(--sw-text)]">{cell}</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			) : null}
		</div>
	)
}

function JobList({ role }: { role: Role }) {
	const jobs = role === 'business' ? jobsBusiness : jobsSeo
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-base font-extrabold text-[var(--sw-text)]">{role === 'business' ? 'Recommended SEO Pros' : 'Available Jobs'}</h2>
				<Badge tone="muted">{jobs.length} open</Badge>
			</div>
			{jobs.map((job) => (
				<Card key={job.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div className="text-base font-bold text-[var(--sw-text)]">{job.title}</div>
						<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--sw-muted)]">
							<span>{'client' in job ? job.client : `${job.bids} bids`}</span>
							<span>·</span>
							<span>{job.posted}</span>
							{job.tags.map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
						</div>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-lg font-extrabold text-[var(--sw-accent)]">{job.budget}</span>
						<AppButton>{role === 'business' ? 'View' : 'Bid'}</AppButton>
					</div>
				</Card>
			))}
		</div>
	)
}

function WalletScreen({
	credits,
	transactions,
	onPurchase,
}: {
	credits: number
	transactions: WalletTransaction[]
	onPurchase: (credits: number, name: string) => void
}) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold text-[var(--sw-text)]">Wallet & Credits</h1>
				<p className="mt-1 text-sm text-[var(--sw-muted)]">Action-based pricing · pay only for what you use</p>
			</div>
			<Card accent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Available Balance</div>
					<div className="mt-3 text-6xl font-extrabold leading-none text-[var(--sw-accent)]">{credits.toLocaleString()}</div>
					<div className="mt-2 text-sm text-[var(--sw-muted)]">credits · shared across SEO Wallet products</div>
				</div>
				<AppButton onClick={() => document.getElementById('credit-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Add Credits</AppButton>
			</Card>
			<div id="credit-packages" className="grid scroll-mt-6 gap-4 md:grid-cols-3">
				{packages.map((pkg) => (
					<Card key={pkg.id} className="relative">
						<div className="text-3xl font-extrabold" style={{ color: pkg.color }}>${pkg.price}</div>
						<div className="mt-1 text-sm text-[var(--sw-muted)]">{pkg.note}</div>
						<div className="mt-5 text-xl font-extrabold text-[var(--sw-text)]">{pkg.credits.toLocaleString()} credits</div>
						<div className="mt-2 text-xs text-[var(--sw-muted)]">Payment provider pending; this records a ledger top-up.</div>
						<AppButton className="mt-5 w-full" onClick={() => onPurchase(pkg.credits, pkg.name)}>Add {pkg.name} Credits</AppButton>
					</Card>
				))}
			</div>
			<ActivityList transactions={transactions} />
		</div>
	)
}

function MarketplaceScreen({ role }: { role: Role }) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold text-[var(--sw-text)]">{role === 'business' ? 'Hire an SEO' : 'Find Work'}</h1>
				<p className="mt-1 text-sm text-[var(--sw-muted)]">{role === 'business' ? 'Post work and compare SEO professionals.' : 'Find credit-powered SEO work from businesses.'}</p>
			</div>
			<JobList role={role} />
		</div>
	)
}

function ProfileInput({
	label,
	value,
	onChange,
	placeholder,
	type = 'text',
}: {
	label: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	type?: string
}) {
	return (
		<label className="space-y-2">
			<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">{label}</span>
			<input
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none transition placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
			/>
		</label>
	)
}

function ProfileScreen({
	user,
	role,
	draft,
	roleSetup,
	onChange,
	onSave,
	onEditRole,
}: {
	user?: AuthUserProfile | AccountProfileResponse | null
	role: Role
	draft: ProfileDraft
	roleSetup: RoleSetupRecord
	onChange: (draft: ProfileDraft) => void
	onSave: () => void
	onEditRole: (role: Role) => void
}) {
	const setField = (field: keyof ProfileDraft, value: string) => onChange({ ...draft, [field]: value })
	const activeRoleSetup = roleSetup[role]
	const profileTypes = user?.profileTypes?.length ? user.profileTypes.join(', ') : user?.accountType || 'Not set'
	const relatedLinks = draft.relatedLinks
		.split('\n')
		.map((link) => link.trim())
		.filter(Boolean)

	return (
		<div className="space-y-6">
			<Card accent className="p-6">
				<div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-4">
						<div className="scale-125">
							<UserAvatar user={user} />
						</div>
						<div>
							<h1 className="text-2xl font-extrabold text-[var(--sw-text)]">{displayName(user)}</h1>
							<p className="mt-1 text-sm text-[var(--sw-soft)]">{draft.headline || user?.email}</p>
							<div className="mt-3 flex flex-wrap gap-2">
								<Badge>{role === 'business' ? 'Business mode' : 'SEO Pro mode'}</Badge>
								<Badge tone="muted">{profileTypes}</Badge>
								{isEmailVerified(user) ? <Badge tone="blue">Email verified</Badge> : <Badge tone="yellow">Email pending</Badge>}
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<AppButton variant="secondary" onClick={() => onEditRole(role)}>
							Edit {role === 'business' ? 'Business' : 'SEO'} details
						</AppButton>
						<AppButton onClick={onSave}>Save profile</AppButton>
					</div>
				</div>
			</Card>

			<div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
				<div className="space-y-6">
					<Card>
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Personal details</h2>
						<div className="mt-5 grid gap-4 md:grid-cols-2">
							<ProfileInput label="Phone number" value={draft.phoneNumber} onChange={(value) => setField('phoneNumber', value)} placeholder="+971 ..." />
							<ProfileInput label="Nationality" value={draft.nationality} onChange={(value) => setField('nationality', value)} placeholder="Pakistani, Emirati, ..." />
							<ProfileInput label="Country" value={draft.country} onChange={(value) => setField('country', value)} />
							<ProfileInput label="City" value={draft.city} onChange={(value) => setField('city', value)} />
							<ProfileInput label="Timezone" value={draft.timezone} onChange={(value) => setField('timezone', value)} placeholder="Asia/Dubai" />
							<ProfileInput label="Professional headline" value={draft.headline} onChange={(value) => setField('headline', value)} placeholder="Technical SEO consultant for SaaS teams" />
						</div>
						<label className="mt-4 block space-y-2">
							<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">About</span>
							<textarea
								value={draft.bio}
								onChange={(event) => setField('bio', event.target.value)}
								rows={5}
								placeholder="Short public profile summary"
								className="w-full resize-none rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm leading-6 text-[var(--sw-text)] outline-none transition placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
							/>
						</label>
					</Card>

					<Card>
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Socials and useful links</h2>
						<div className="mt-5 grid gap-4 md:grid-cols-2">
							<ProfileInput label="LinkedIn" value={draft.linkedinUrl} onChange={(value) => setField('linkedinUrl', value)} placeholder="https://linkedin.com/in/..." />
							<ProfileInput label="X / Twitter" value={draft.xUrl} onChange={(value) => setField('xUrl', value)} placeholder="https://x.com/..." />
							<ProfileInput label="Facebook" value={draft.facebookUrl} onChange={(value) => setField('facebookUrl', value)} placeholder="https://facebook.com/..." />
							<ProfileInput label="Website" value={draft.websiteUrl} onChange={(value) => setField('websiteUrl', value)} placeholder="https://..." />
							<ProfileInput label="Portfolio / case studies" value={draft.portfolioUrl} onChange={(value) => setField('portfolioUrl', value)} placeholder="https://..." />
						</div>
						<label className="mt-4 block space-y-2">
							<span className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Related links</span>
							<textarea
								value={draft.relatedLinks}
								onChange={(event) => setField('relatedLinks', event.target.value)}
								rows={4}
								placeholder="One useful link per line"
								className="w-full resize-none rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm leading-6 text-[var(--sw-text)] outline-none transition placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
							/>
						</label>
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Account identity</h2>
						<div className="mt-4 space-y-3 text-sm">
							<div className="flex justify-between gap-4"><span className="text-[var(--sw-muted)]">Email</span><span className="truncate font-bold text-[var(--sw-text)]">{user?.email}</span></div>
							<div className="flex justify-between gap-4"><span className="text-[var(--sw-muted)]">Username</span><span className="font-bold text-[var(--sw-text)]">{user?.username || '-'}</span></div>
							<div className="flex justify-between gap-4"><span className="text-[var(--sw-muted)]">Status</span><span className="font-bold capitalize text-[var(--sw-accent)]">{user?.status || 'active'}</span></div>
						</div>
					</Card>

					<Card>
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-base font-extrabold text-[var(--sw-text)]">{role === 'business' ? 'Business details' : 'SEO profile details'}</h2>
							<button onClick={() => onEditRole(role)} className="text-sm font-bold text-[var(--sw-accent)]">Edit</button>
						</div>
						<div className="mt-4 space-y-3 text-sm">
							{activeRoleSetup ? (
								<>
									<div className="flex justify-between gap-4"><span className="text-[var(--sw-muted)]">{role === 'business' ? 'Business' : 'Profile'}</span><span className="font-bold text-[var(--sw-text)]">{role === 'business' ? activeRoleSetup.companyName : activeRoleSetup.serviceName}</span></div>
									<div className="flex justify-between gap-4"><span className="text-[var(--sw-muted)]">{role === 'business' ? 'Industry' : 'Specialties'}</span><span className="text-right font-bold text-[var(--sw-text)]">{role === 'business' ? activeRoleSetup.industry : activeRoleSetup.specialties}</span></div>
									<div className="flex justify-between gap-4"><span className="text-[var(--sw-muted)]">{role === 'business' ? 'Team size' : 'Experience'}</span><span className="font-bold text-[var(--sw-text)]">{role === 'business' ? activeRoleSetup.teamSize || '-' : `${activeRoleSetup.yearsOfExperience} years`}</span></div>
								</>
							) : (
								<p className="text-sm leading-6 text-[var(--sw-soft)]">Complete this role profile to unlock a cleaner marketplace experience.</p>
							)}
						</div>
					</Card>

					<Card>
						<h2 className="text-base font-extrabold text-[var(--sw-text)]">Public links preview</h2>
						<div className="mt-4 flex flex-wrap gap-2">
							{[draft.linkedinUrl, draft.xUrl, draft.facebookUrl, draft.websiteUrl, draft.portfolioUrl, ...relatedLinks].filter(Boolean).length ? (
								[draft.linkedinUrl, draft.xUrl, draft.facebookUrl, draft.websiteUrl, draft.portfolioUrl, ...relatedLinks].filter(Boolean).map((link) => (
									<Badge key={link} tone="muted">{link.replace(/^https?:\/\//, '').slice(0, 34)}</Badge>
								))
							) : (
								<p className="text-sm leading-6 text-[var(--sw-soft)]">Add socials, portfolio pages, case studies, or useful related links.</p>
							)}
						</div>
					</Card>
				</div>
			</div>
		</div>
	)
}

function Toasts({ toasts }: { toasts: Toast[] }) {
	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
			{toasts.map((toast) => (
				<div key={toast.id} className={`rounded-xl border px-4 py-3 text-sm font-bold backdrop-blur ${toast.type === 'credit' ? 'border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]' : toast.type === 'debit' ? 'border-[#f871714d] bg-[#f8717126] text-[#f87171]' : 'border-[var(--sw-info-border)] bg-[var(--sw-info-soft)] text-[var(--sw-text)]'}`}>
					{toast.message}
				</div>
			))}
		</div>
	)
}

export default function DashboardPage() {
	const router = useRouter()
	const [session, setSession] = useState<StoredSession | null>(null)
	const [profile, setProfile] = useState<AccountProfileResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [screen, setScreen] = useState<Screen>('dashboard')
	const [role, setRole] = useState<Role>('business')
	const [wallet, setWallet] = useState<WalletLedger>({ userId: '', balance: 0, transactions: [] })
	const [toasts, setToasts] = useState<Toast[]>([])
	const [roleSetup, setRoleSetup] = useState<RoleSetupRecord>({})
	const [pendingRole, setPendingRole] = useState<Role | null>(null)
	const [setupDraft, setSetupDraft] = useState<RoleSetupDraft>(emptyRoleSetupDraft)
	const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft)
	const [theme, setTheme] = useState<Theme>('light')
	const [accountMenuOpen, setAccountMenuOpen] = useState(false)
	const [selectedTool, setSelectedTool] = useState<Tool>(tools[0])
	const [toolRunState, setToolRunState] = useState<ToolRunState>('idle')
	const [toolQuery, setToolQuery] = useState('')
	const [toolResult, setToolResult] = useState<ToolAnalysisResult | null>(null)

	useEffect(() => {
		try {
			const activeSession = requireSession()
			setSession(activeSession)
			setRole(roleFromAccount(activeSession.user))
			profileApi
				.getMe(activeSession.accessToken)
				.then((nextProfile) => {
					setProfile(nextProfile)
					setRole(roleFromAccount(nextProfile))
				})
				.catch(() => setProfile(null))
				.finally(() => setLoading(false))
		} catch {
			router.replace('/auth/login')
		}
	}, [router])

	useEffect(() => {
		const handleSuiteStorage = (event: StorageEvent) => {
			const suiteLogout =
				event.key === LOGOUT_MARKER_KEY && Boolean(event.newValue)
			const suiteSessionCleared =
				(event.key === SESSION_KEY || event.key === SHARED_SESSION_KEY) && !event.newValue

			if (!suiteLogout && !suiteSessionCleared) return

			clearSession()
			setSession(null)
			setProfile(null)
			router.replace('/auth/login')
		}

		window.addEventListener('storage', handleSuiteStorage)
		return () => window.removeEventListener('storage', handleSuiteStorage)
	}, [router])

	useEffect(() => {
		const storedTheme = window.localStorage.getItem('seowallet-dashboard-theme')
		if (storedTheme === 'dark' || storedTheme === 'light') {
			setTheme(storedTheme)
		}
	}, [])

	const user = useMemo(() => profile ?? session?.user ?? null, [profile, session])

	useEffect(() => {
		if (!user) return

		try {
			const raw = window.localStorage.getItem(userStorageKey(user))
			setRoleSetup(raw ? JSON.parse(raw) as RoleSetupRecord : {})
		} catch {
			setRoleSetup({})
		}

		try {
			const raw = window.localStorage.getItem(userProfileStorageKey(user))
			setProfileDraft(raw ? { ...emptyProfileDraft, ...(JSON.parse(raw) as Partial<ProfileDraft>) } : emptyProfileDraft)
		} catch {
			setProfileDraft(emptyProfileDraft)
		}

	}, [user])

	const showToast = (message: string, type: Toast['type'] = 'info') => {
		const id = Date.now()
		setToasts((items) => [...items, { id, message, type }])
		window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 2800)
	}

	useEffect(() => {
		if (!session?.accessToken) return

		walletApi
			.getWallet(session.accessToken)
			.then(setWallet)
			.catch((error) => {
				console.error('Failed to load wallet', error)
				showToast('Wallet service is unavailable. Credit actions are paused.', 'info')
				setWallet({ userId: '', balance: 0, transactions: [] })
			})
	}, [session?.accessToken])

	const openTool = (tool: Tool) => {
		setSelectedTool(tool)
		setToolRunState('idle')
		setToolQuery('')
		setToolResult(null)
		setScreen('keyword-tool')
	}

	const runSelectedTool = () => {
		if (!toolQuery.trim()) return
		if (!session?.accessToken) {
			showToast('Please sign in again before running tools.', 'info')
			return
		}
		if (selectedTool.credits > wallet.balance) {
			showToast(`Not enough credits for ${selectedTool.name}. Add credits first.`, 'info')
			setScreen('wallet')
			return
		}
		setToolRunState('loading')
		window.setTimeout(async () => {
			const nextResult = analyzeSeoTool(selectedTool, toolQuery)
			setToolResult(nextResult)
			setToolRunState('results')
			if (!nextResult.title.includes('needs valid input') && selectedTool.credits > 0) {
				try {
					const nextWallet = await walletApi.spend(
						{
							amount: selectedTool.credits,
							toolId: selectedTool.id,
							description: `${selectedTool.name} - ${toolQuery.trim().slice(0, 80)}`,
							idempotencyKey: createIdempotencyKey(`tool:${selectedTool.id}`),
						},
						session.accessToken,
					)
					setWallet(nextWallet)
					showToast(`${selectedTool.credits} credits used for ${selectedTool.name}`, 'debit')
				} catch (error) {
					if (error instanceof ApiError && error.status === 402) {
						showToast(`Not enough credits for ${selectedTool.name}. Add credits first.`, 'info')
						setScreen('wallet')
						return
					}
					console.error('Wallet spend failed', error)
					showToast('Tool completed, but credit spend failed. Please retry.', 'info')
				}
				return
			}
			showToast(`${selectedTool.name} completed`, 'info')
		}, 900)
	}

	const purchase = async (amount: number, name: string) => {
		if (!session?.accessToken) {
			showToast('Please sign in again before adding credits.', 'info')
			return
		}

		try {
			const nextWallet = await walletApi.grant(
				{
					amount,
					description: `${name} top-up`,
					reference: name,
					idempotencyKey: createIdempotencyKey(`topup:${name.toLowerCase()}`),
				},
				session.accessToken,
			)
			setWallet(nextWallet)
			showToast(`${amount.toLocaleString()} ${name} credits added`, 'credit')
		} catch (error) {
			console.error('Wallet grant failed', error)
			showToast('Could not add credits. Please try again.', 'info')
		}
	}

	const logout = () => {
		const idToken = session?.idToken
		clearSession()
		// Always go through Keycloak logout so the SSO session is invalidated for
		// all connected clients (hub included). Keycloak redirects to /auth/login
		// regardless of whether an active session exists.
		window.location.href = keycloakAuth.logoutUrl(idToken)
	}

	const navigate = (nextScreen: Screen) => {
		if (nextScreen !== 'keyword-tool') {
			setToolRunState('idle')
			setToolResult(null)
		}
		setAccountMenuOpen(false)
		setScreen(nextScreen)
	}

	const switchRole = (nextRole: Role) => {
		if (nextRole === role) return
		if (hasRoleSetup(nextRole, user, roleSetup)) {
			setRole(nextRole)
			setScreen('dashboard')
			return
		}

		setPendingRole(nextRole)
		setSetupDraft(roleSetup[nextRole] ?? emptyRoleSetupDraft)
	}

	const editRoleSetup = (nextRole: Role) => {
		setPendingRole(nextRole)
		setSetupDraft(roleSetup[nextRole] ?? emptyRoleSetupDraft)
	}

	const completeRoleSetup = () => {
		if (!pendingRole || !user) return

		const nextSetup = {
			...roleSetup,
			[pendingRole]: {
				...setupDraft,
				completedAt: new Date().toISOString(),
			},
		}

		setRoleSetup(nextSetup)
		window.localStorage.setItem(userStorageKey(user), JSON.stringify(nextSetup))
		setRole(pendingRole)
		setScreen('dashboard')
		setPendingRole(null)
		setSetupDraft(emptyRoleSetupDraft)
		showToast(`${pendingRole === 'business' ? 'Business' : 'SEO'} profile setup completed`, 'info')
	}

	const saveProfileDetails = () => {
		if (!user) return
		window.localStorage.setItem(userProfileStorageKey(user), JSON.stringify(profileDraft))
		showToast('Profile details saved', 'info')
	}

	const toggleTheme = () => {
		setTheme((current) => {
			const next = current === 'dark' ? 'light' : 'dark'
			window.localStorage.setItem('seowallet-dashboard-theme', next)
			return next
		})
	}

	if (loading) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-[var(--sw-bg)] text-[var(--sw-muted)]">
				<div className="flex items-center gap-3 text-sm">
					<Spinner size="md" />
					Loading dashboard...
				</div>
			</main>
		)
	}

	const screenContent = {
		dashboard: <DashboardScreen role={role} credits={wallet.balance} transactions={wallet.transactions} user={user} onNavigate={navigate} onOpenTool={openTool} />,
		tools: <ToolsScreen onOpenTool={openTool} />,
		'keyword-tool': <ToolDetailScreen tool={selectedTool} query={toolQuery} state={toolRunState} result={toolResult} onQueryChange={setToolQuery} onBack={() => navigate('tools')} onRun={runSelectedTool} />,
		marketplace: <MarketplaceScreen role={role} />,
		wallet: <WalletScreen credits={wallet.balance} transactions={wallet.transactions} onPurchase={purchase} />,
		profile: <ProfileScreen user={user} role={role} draft={profileDraft} roleSetup={roleSetup} onChange={setProfileDraft} onSave={saveProfileDetails} onEditRole={editRoleSetup} />,
	}[screen]

	return (
		<main className="min-h-screen bg-[var(--sw-bg)] font-sans text-[var(--sw-text)]" style={dashboardThemes[theme]}>
			<div className="flex h-dvh overflow-hidden">
				<Sidebar
					screen={screen}
					role={role}
					credits={wallet.balance}
					onNavigate={navigate}
					onSetRole={switchRole}
				/>
				<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
					<header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 lg:hidden">
						<button onClick={() => navigate('dashboard')} className="flex items-center gap-2 transition hover:opacity-80">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sw-accent-soft)] text-xs font-extrabold text-[var(--sw-accent)]">SW</div>
							<span className="text-sm font-extrabold">SEO Wallets</span>
						</button>
						<div className="flex items-center gap-2">
							<AccountMenu
								user={user}
								theme={theme}
								open={accountMenuOpen}
								onToggleOpen={() => setAccountMenuOpen((value) => !value)}
								onProfile={() => navigate('profile')}
								onToggleTheme={() => {
									toggleTheme()
									setAccountMenuOpen(false)
								}}
								onLogout={() => {
									setAccountMenuOpen(false)
									logout()
								}}
							/>
						</div>
					</header>
					<header className="hidden h-16 shrink-0 items-center justify-end border-b border-[var(--sw-border)] bg-[var(--sw-bg)] px-8 lg:flex">
						<AccountMenu
							user={user}
							theme={theme}
							open={accountMenuOpen}
							onToggleOpen={() => setAccountMenuOpen((value) => !value)}
							onProfile={() => navigate('profile')}
							onToggleTheme={() => {
								toggleTheme()
								setAccountMenuOpen(false)
							}}
							onLogout={() => {
								setAccountMenuOpen(false)
								logout()
							}}
						/>
					</header>
					<div className="flex gap-2 border-b border-[var(--sw-border)] bg-[var(--sw-sidebar)] p-3 lg:hidden">
						{(['dashboard', 'tools', 'marketplace', 'wallet'] as Screen[]).map((item) => (
							<button key={item} onClick={() => navigate(item)} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold capitalize ${screen === item || (item === 'tools' && screen === 'keyword-tool') ? 'bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]' : 'bg-[var(--sw-bg)] text-[var(--sw-muted)]'}`}>{item}</button>
						))}
					</div>
					<div className="flex gap-1 border-b border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-3 pb-3 lg:hidden">
						{[
							{ id: 'business' as const, label: 'Business' },
							{ id: 'seo' as const, label: 'SEO Pro' },
						].map((item) => (
							<button
								key={item.id}
								onClick={() => switchRole(item.id)}
								className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${role === item.id ? 'bg-[var(--sw-card)] text-[var(--sw-accent)]' : 'bg-[var(--sw-bg)] text-[var(--sw-muted)]'}`}
							>
								{item.label}
							</button>
						))}
					</div>
					<section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-9 lg:py-8">
						{screenContent}
					</section>
				</div>
			</div>
			{pendingRole ? (
				<RoleSetupModal
					role={pendingRole}
					draft={setupDraft}
					onChange={setSetupDraft}
					onCancel={() => {
						setPendingRole(null)
						setSetupDraft(emptyRoleSetupDraft)
					}}
					onSubmit={completeRoleSetup}
				/>
			) : null}
			<Toasts toasts={toasts} />
		</main>
	)
}
