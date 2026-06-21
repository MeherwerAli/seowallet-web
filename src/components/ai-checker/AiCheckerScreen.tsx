'use client'

import { useMemo, useState } from 'react'

import {
	ApiError,
	aiDetectionApi,
	type AiDetectionResult,
	type AiDetectionScan,
	type AiDetectionSentence,
} from '@/lib/api-client'

type Props = {
	accessToken?: string
	credits: number
	onNeedCredits: () => void
}

type Mode = 'text' | 'url'

const scanTypes = [
	{ id: 'ai', label: 'AI', enabled: true },
	{ id: 'plagiarism', label: 'Plagiarism', enabled: false },
	{ id: 'readability', label: 'Readability', enabled: false },
	{ id: 'fact', label: 'Fact', enabled: false },
]

export default function AiCheckerScreen({ accessToken, credits, onNeedCredits }: Props) {
	const [mode, setMode] = useState<Mode>('text')
	const [text, setText] = useState('')
	const [url, setUrl] = useState('')
	const [highlight, setHighlight] = useState(true)
	const [selectedTypes, setSelectedTypes] = useState<string[]>(['ai'])
	const [scan, setScan] = useState<AiDetectionScan | null>(null)
	const [history, setHistory] = useState<AiDetectionScan[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const wordCount = useMemo(() => countWords(text), [text])
	const estimatedCredits = Math.max(1, Math.ceil(Math.max(wordCount, 1) / 100)) * selectedTypes
		.reduce((sum, item) => sum + (item === 'plagiarism' || item === 'fact' ? 1 : item === 'ai' ? 1 : 0), 0)
	const canScan = mode === 'text' ? text.trim().length > 0 : url.trim().length > 0

	const runScan = async () => {
		if (!accessToken) {
			setError('Sign in again before scanning.')
			return
		}
		if (mode === 'text' && estimatedCredits > credits) {
			onNeedCredits()
			return
		}

		setLoading(true)
		setError('')
		try {
			const payload = {
				model: 'turbo',
				scan_types: selectedTypes,
				highlight,
				idempotency_key: createIdempotencyKey('ai-detection'),
			}
			const nextScan = mode === 'text'
				? await aiDetectionApi.scan({ ...payload, text }, accessToken)
				: await aiDetectionApi.scanUrl({ ...payload, url }, accessToken)
			setScan(nextScan)
			setHistory((items) => [nextScan, ...items.filter((item) => item.scan_id !== nextScan.scan_id)].slice(0, 8))
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Scan failed.')
		} finally {
			setLoading(false)
		}
	}

	const loadHistory = async () => {
		if (!accessToken) return
		setLoading(true)
		setError('')
		try {
			const data = await aiDetectionApi.listScans(accessToken, 8, 0)
			setHistory(data.scans)
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Could not load scan history.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-extrabold text-[var(--sw-text)]">AI Checker</h1>
					<div className="mt-2 flex flex-wrap gap-2">
						<Badge>Turbo</Badge>
						<Badge tone="muted">{credits.toLocaleString()} credits</Badge>
						{mode === 'text' ? <Badge tone="muted">{wordCount.toLocaleString()} words</Badge> : null}
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={loadHistory} disabled={loading}>History</Button>
					<Button onClick={runScan} disabled={!canScan || loading}>
						{loading ? 'Scanning' : `Scan - ${estimatedCredits} credits`}
					</Button>
				</div>
			</div>

			{error ? (
				<div className="rounded-xl border border-[#f8717140] bg-[#f8717114] px-4 py-3 text-sm font-bold text-[#f87171]">
					{error}
				</div>
			) : null}

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="space-y-4">
					<Card>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div className="flex rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] p-1">
								{(['text', 'url'] as Mode[]).map((item) => (
									<button
										key={item}
										onClick={() => setMode(item)}
										className={`rounded-[9px] px-3 py-2 text-sm font-bold capitalize ${mode === item ? 'bg-[var(--sw-card)] text-[var(--sw-accent)] shadow' : 'text-[var(--sw-muted)]'}`}
									>
										{item}
									</button>
								))}
							</div>
							<label className="flex items-center gap-2 text-sm font-bold text-[var(--sw-soft)]">
								<input type="checkbox" checked={highlight} onChange={(event) => setHighlight(event.target.checked)} />
								Highlight
							</label>
						</div>

						{mode === 'text' ? (
							<textarea
								value={text}
								onChange={(event) => setText(event.target.value)}
								rows={14}
								placeholder="Paste content to scan"
								className="min-h-[360px] w-full resize-y rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm leading-6 text-[var(--sw-text)] outline-none placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
							/>
						) : (
							<input
								value={url}
								onChange={(event) => setUrl(event.target.value)}
								placeholder="https://example.com/article"
								className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-4 py-3 text-sm text-[var(--sw-text)] outline-none placeholder:text-[var(--sw-placeholder)] focus:border-[var(--sw-accent)]"
							/>
						)}
					</Card>

					<Card>
						<div className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Checks</div>
						<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
							{scanTypes.map((item) => {
								const checked = selectedTypes.includes(item.id)
								return (
									<button
										key={item.id}
										disabled={!item.enabled}
										title={item.enabled ? item.label : 'Backend module not enabled yet'}
										onClick={() => {
											if (!item.enabled) return
											setSelectedTypes((types) => checked ? types.filter((type) => type !== item.id) : [...types, item.id])
										}}
										className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${checked ? 'border-[var(--sw-accent-border)] bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]' : 'border-[var(--sw-border)] bg-[var(--sw-sidebar)] text-[var(--sw-soft)]'} disabled:cursor-not-allowed disabled:opacity-45`}
									>
										{item.label}
									</button>
								)
							})}
						</div>
					</Card>

					{scan?.result?.sentences?.length ? <SentenceHighlights sentences={scan.result.sentences} /> : null}
				</div>

				<div className="space-y-4">
					<ResultPanel result={scan?.result ?? null} scan={scan} />
					<HistoryPanel scans={history} onSelect={setScan} />
				</div>
			</div>
		</div>
	)
}

function ResultPanel({ result, scan }: { result: AiDetectionResult | null; scan: AiDetectionScan | null }) {
	if (!result || !scan) {
		return (
			<Card className="min-h-[280px]">
				<div className="text-sm font-bold text-[var(--sw-text)]">Result</div>
				<div className="mt-12 text-center text-sm text-[var(--sw-muted)]">No scan selected.</div>
			</Card>
		)
	}

	const score = Math.round(result.ai_score * 100)
	const classification = result.document_classification || result.label.toUpperCase()
	const probabilities = result.class_probabilities || {}

	return (
		<Card className="space-y-5">
			<div className="flex items-center justify-between gap-4">
				<div>
					<div className="text-xs font-bold uppercase tracking-wide text-[var(--sw-muted)]">Result</div>
					<div className="mt-1 text-xl font-extrabold text-[var(--sw-text)]">{formatClassification(classification)}</div>
					<div className="mt-1 text-xs font-bold text-[var(--sw-muted)]">{result.confidence_category || result.confidence} confidence</div>
				</div>
				<div
					className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
					style={{ background: `conic-gradient(#f87171 ${score * 3.6}deg, var(--sw-border) 0deg)` }}
				>
					<div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--sw-card)] text-xl font-extrabold text-[var(--sw-text)]">
						{score}%
					</div>
				</div>
			</div>

			<div className="space-y-3">
				<ProbabilityBar label="Human" value={probabilities.human ?? (1 - result.ai_score)} tone="#00cfa3" />
				<ProbabilityBar label="Mixed" value={probabilities.mixed ?? 0} tone="#ffc84a" />
				<ProbabilityBar label="AI" value={probabilities.ai ?? result.ai_score} tone="#f87171" />
			</div>

			<div className="grid grid-cols-2 gap-3 text-sm">
				<Metric label="Words" value={scan.word_count.toLocaleString()} />
				<Metric label="Credits" value={scan.credits_spent.toLocaleString()} />
				<Metric label="Model" value={scan.model_version || 'turbo'} />
				<Metric label="Subclass" value={formatSubclass(result.subclass)} />
			</div>
		</Card>
	)
}

function SentenceHighlights({ sentences }: { sentences: AiDetectionSentence[] }) {
	return (
		<Card>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-base font-extrabold text-[var(--sw-text)]">Highlights</h2>
				<Badge tone="muted">{sentences.length} sentences</Badge>
			</div>
			<div className="space-y-2">
				{sentences.map((sentence) => (
					<p key={sentence.idx} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${sentenceTone(sentence.shade)}`}>
						{sentence.text}
					</p>
				))}
			</div>
		</Card>
	)
}

function HistoryPanel({ scans, onSelect }: { scans: AiDetectionScan[]; onSelect: (scan: AiDetectionScan) => void }) {
	return (
		<Card>
			<div className="mb-3 flex items-center justify-between">
				<h2 className="text-base font-extrabold text-[var(--sw-text)]">Recent Scans</h2>
				<Badge tone="muted">{scans.length}</Badge>
			</div>
			<div className="space-y-2">
				{scans.length ? scans.map((item) => (
					<button key={item.scan_id} onClick={() => onSelect(item)} className="w-full rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] px-3 py-3 text-left transition hover:border-[var(--sw-accent-border)]">
						<div className="flex items-center justify-between gap-3">
							<span className="truncate text-sm font-bold text-[var(--sw-text)]">{item.result?.document_classification || item.status}</span>
							<span className="text-xs font-bold text-[var(--sw-accent)]">{item.result ? `${Math.round(item.result.ai_score * 100)}%` : '-'}</span>
						</div>
						<div className="mt-1 text-xs text-[var(--sw-muted)]">{new Date(item.created_at).toLocaleString()}</div>
					</button>
				)) : (
					<div className="py-8 text-center text-sm text-[var(--sw-muted)]">No scans loaded.</div>
				)}
			</div>
		</Card>
	)
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
	return <div className={`rounded-2xl border border-[var(--sw-border)] bg-[var(--sw-card)] p-5 ${className}`}>{children}</div>
}

function Button({ children, onClick, disabled = false, variant = 'primary' }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' }) {
	const classes = variant === 'primary'
		? 'bg-[var(--sw-accent)] text-[var(--sw-accent-contrast)]'
		: 'border border-[var(--sw-border)] bg-[var(--sw-card)] text-[var(--sw-text)]'
	return <button onClick={onClick} disabled={disabled} className={`rounded-[10px] px-4 py-2.5 text-sm font-bold transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}>{children}</button>
}

function Badge({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'muted' }) {
	const classes = tone === 'green'
		? 'bg-[var(--sw-accent-soft)] text-[var(--sw-accent)]'
		: 'bg-[var(--sw-muted-soft)] text-[var(--sw-soft)]'
	return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{children}</span>
}

function ProbabilityBar({ label, value, tone }: { label: string; value: number; tone: string }) {
	const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
	return (
		<div>
			<div className="mb-1 flex items-center justify-between text-xs font-bold text-[var(--sw-muted)]">
				<span>{label}</span>
				<span>{pct}%</span>
			</div>
			<div className="h-2 rounded-full bg-[var(--sw-border)]">
				<div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tone }} />
			</div>
		</div>
	)
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-[var(--sw-border)] bg-[var(--sw-sidebar)] p-3">
			<div className="text-[11px] font-bold uppercase tracking-wide text-[var(--sw-muted)]">{label}</div>
			<div className="mt-1 truncate text-sm font-extrabold text-[var(--sw-text)]">{value}</div>
		</div>
	)
}

function sentenceTone(shade: AiDetectionSentence['shade']) {
	if (shade === 'red') return 'border-[#f8717140] bg-[#f8717118] text-[var(--sw-text)]'
	if (shade === 'orange') return 'border-[#fb923c40] bg-[#fb923c18] text-[var(--sw-text)]'
	if (shade === 'yellow') return 'border-[#ffc84a40] bg-[#ffc84a18] text-[var(--sw-text)]'
	return 'border-[#00cfa340] bg-[#00cfa314] text-[var(--sw-text)]'
}

function countWords(value: string) {
	return value.trim().match(/\S+/g)?.length ?? 0
}

function createIdempotencyKey(prefix: string) {
	const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2)
	return `${prefix}:${Date.now()}:${random}`
}

function formatClassification(value: string) {
	return value.toLowerCase().replaceAll('_', ' ')
}

function formatSubclass(value?: string | null) {
	return value ? value.replaceAll('_', ' ') : '-'
}
