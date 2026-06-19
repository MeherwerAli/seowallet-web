export type ToolCategory = 'Overview' | 'On-page' | 'Research' | 'Technical' | 'Content' | 'Automation'

export type ToolId =
	| 'page-pro-analyzer'
	| 'image-optimization'
	| 'instant-position-checker'
	| 'rank-comparison'
	| 'search-intent-finder'
	| 'link-checker'
	| 'heading-optimization'
	| 'index-api-connector'
	| 'url-toolkit'
	| 'structured-data'
	| 'social-markup'
	| 'domain-inspector'
	| 'redirects-manager'
	| 'local-search-simulator'
	| 'serp-analysis'
	| 'ai-assistant'
	| 'word-counter'
	| 'serp-counter'
	| 'rendered-source'

export type SeoTool = {
	id: ToolId
	name: string
	credits: number
	category: ToolCategory
	short: string
	color: string
	desc: string
	inputLabel: string
	placeholder: string
	inputMode: 'text' | 'textarea'
	samples: string[]
	extensionOrigin: string
	webWorkflow: string
}

export type ToolMetric = {
	label: string
	value: string
	sub: string
	color?: string
}

export type ToolTable = {
	columns: string[]
	rows: string[][]
}

export type ToolAnalysisResult = {
	title: string
	summary: string
	metrics: ToolMetric[]
	findings: Array<{ title: string; detail: string; tone: 'good' | 'warn' | 'info' }>
	table?: ToolTable
	output?: string
}

const teal = '#00cfa3'
const blue = '#4d7fff'
const purple = '#a855f7'
const yellow = '#ffc84a'

export const seoTools: SeoTool[] = [
	{
		id: 'page-pro-analyzer',
		name: 'Page Pro Analyzer',
		credits: 4,
		category: 'On-page',
		short: 'PA',
		color: blue,
		desc: 'Audit titles, descriptions, headings, links, images and structured hints from pasted page HTML.',
		inputLabel: 'Page HTML or visible page text',
		placeholder: 'Paste rendered HTML, source HTML, or page copy...',
		inputMode: 'textarea',
		samples: ['<title>SEO Wallet</title><h1>SEO Tools</h1><meta name="description" content="Run SEO checks faster.">'],
		extensionOrigin: 'Page Pro Analyzer',
		webWorkflow: 'Paste page source or rendered HTML instead of reading the active Chrome tab.',
	},
	{
		id: 'image-optimization',
		name: 'Image Optimization',
		credits: 3,
		category: 'On-page',
		short: 'IO',
		color: blue,
		desc: 'Find missing alt text, oversized image hints, and weak image metadata in pasted HTML.',
		inputLabel: 'Image HTML',
		placeholder: '<img src="/hero.jpg" alt="SEO dashboard" width="1600" height="900">',
		inputMode: 'textarea',
		samples: ['<img src="/hero.jpg"><img src="/dashboard.webp" alt="SEO dashboard" width="1600" height="900">'],
		extensionOrigin: 'Image Optimization',
		webWorkflow: 'Paste markup from a page or CMS preview.',
	},
	{
		id: 'heading-optimization',
		name: 'Heading Optimization',
		credits: 2,
		category: 'On-page',
		short: 'HO',
		color: blue,
		desc: 'Review H1-H6 hierarchy, missing H1s, duplicate H1s and heading depth jumps.',
		inputLabel: 'Heading HTML',
		placeholder: '<h1>Main topic</h1><h2>Section</h2><h3>Detail</h3>',
		inputMode: 'textarea',
		samples: ['<h1>Technical SEO Audit</h1><h3>Crawlability</h3><h2>Indexing</h2>'],
		extensionOrigin: 'Heading Optimization',
		webWorkflow: 'Paste page source or selected article HTML.',
	},
	{
		id: 'link-checker',
		name: 'Link Checker',
		credits: 3,
		category: 'On-page',
		short: 'LC',
		color: blue,
		desc: 'Extract internal, external, nofollow, empty and JavaScript links from pasted HTML.',
		inputLabel: 'Link HTML',
		placeholder: '<a href="/pricing">Pricing</a><a rel="nofollow" href="https://example.com">Partner</a>',
		inputMode: 'textarea',
		samples: ['<a href="/blog">Blog</a><a href="https://beta.seowallet.com" rel="nofollow">SEO Debate</a><a href="#">Empty</a>'],
		extensionOrigin: 'Link Checker',
		webWorkflow: 'Paste a page fragment to classify links without Chrome page access.',
	},
	{
		id: 'url-toolkit',
		name: 'URL Toolkit',
		credits: 1,
		category: 'Technical',
		short: 'UT',
		color: teal,
		desc: 'Parse URL anatomy, query parameters, slug shape and canonical cleanup opportunities.',
		inputLabel: 'URL',
		placeholder: 'https://example.com/category/page?utm_source=x&id=10',
		inputMode: 'text',
		samples: ['https://seowallet.com/hub/events/?utm_source=newsletter&id=42'],
		extensionOrigin: 'URL Toolkit',
		webWorkflow: 'Analyze any pasted URL.',
	},
	{
		id: 'structured-data',
		name: 'Structured Data',
		credits: 3,
		category: 'Technical',
		short: 'SD',
		color: teal,
		desc: 'Detect JSON-LD blocks and summarize schema types from pasted HTML.',
		inputLabel: 'HTML with JSON-LD',
		placeholder: '<script type="application/ld+json">{ "@type": "Article" }</script>',
		inputMode: 'textarea',
		samples: ['<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"SEO guide"}</script>'],
		extensionOrigin: 'Structured Data',
		webWorkflow: 'Paste source snippets or schema markup.',
	},
	{
		id: 'social-markup',
		name: 'Social Markup',
		credits: 2,
		category: 'Technical',
		short: 'SM',
		color: teal,
		desc: 'Check Open Graph and Twitter Card tags for social sharing readiness.',
		inputLabel: 'Head HTML',
		placeholder: '<meta property="og:title" content="..."><meta name="twitter:card" content="summary_large_image">',
		inputMode: 'textarea',
		samples: ['<meta property="og:title" content="SEO Wallet"><meta property="og:image" content="/og.png"><meta name="twitter:card" content="summary_large_image">'],
		extensionOrigin: 'Social Markup',
		webWorkflow: 'Paste head tags from a page.',
	},
	{
		id: 'word-counter',
		name: 'Character & Word Counter',
		credits: 0,
		category: 'Content',
		short: 'WC',
		color: purple,
		desc: 'Count characters, words, sentences, paragraphs and estimated reading time.',
		inputLabel: 'Text',
		placeholder: 'Paste copy, title tags, meta descriptions or article text...',
		inputMode: 'textarea',
		samples: ['SEO Wallet brings extension-grade SEO utilities into one shared web workspace.'],
		extensionOrigin: 'Character & Word Counter',
		webWorkflow: 'Works directly on pasted text.',
	},
	{
		id: 'search-intent-finder',
		name: 'Search Intent Finder',
		credits: 4,
		category: 'Research',
		short: 'SI',
		color: purple,
		desc: 'Classify keyword intent and suggest the content format likely needed to rank.',
		inputLabel: 'Keyword list',
		placeholder: 'best seo tools\nhow to audit hreflang\nseo wallet pricing',
		inputMode: 'textarea',
		samples: ['best seo audit tool\nhow to fix broken links\nseo wallet pricing'],
		extensionOrigin: 'Search Intent Finder',
		webWorkflow: 'Classifies pasted keyword lists locally.',
	},
	{
		id: 'serp-counter',
		name: 'SERP Counter',
		credits: 1,
		category: 'Research',
		short: 'SC',
		color: purple,
		desc: 'Structure a pasted SERP/result list and count organic, local, video and paid-looking entries.',
		inputLabel: 'SERP text',
		placeholder: 'Paste copied search results or URLs, one per line...',
		inputMode: 'textarea',
		samples: ['Ad example.com/tools\nseowallet.com/hub/events\nyoutube.com/watch?v=123\nmaps.google.com/local'],
		extensionOrigin: 'SERP Counter',
		webWorkflow: 'Paste copied SERP text instead of reading Google result DOM.',
	},
	{
		id: 'domain-inspector',
		name: 'Domain Inspector',
		credits: 2,
		category: 'Technical',
		short: 'DI',
		color: teal,
		desc: 'Break down host, subdomain, protocol and domain hygiene checks from a URL.',
		inputLabel: 'Domain or URL',
		placeholder: 'https://www.example.co.uk/path',
		inputMode: 'text',
		samples: ['https://www.seowallet.com/hub/'],
		extensionOrigin: 'Domain Inspector',
		webWorkflow: 'Runs URL/domain parsing in the browser.',
	},
	{
		id: 'redirects-manager',
		name: 'Redirects Manager',
		credits: 3,
		category: 'Technical',
		short: 'RM',
		color: teal,
		desc: 'Validate redirect mapping CSV lines and spot loops, missing sources and malformed targets.',
		inputLabel: 'Redirect pairs',
		placeholder: '/old,/new\nhttps://example.com/a,https://example.com/b',
		inputMode: 'textarea',
		samples: ['/old-page,/new-page\n/a,/b\n/b,/a'],
		extensionOrigin: 'Redirects Manager',
		webWorkflow: 'Paste CSV-style redirect mappings.',
	},
	{
		id: 'instant-position-checker',
		name: 'Instant Position Checker',
		credits: 4,
		category: 'Research',
		short: 'IP',
		color: yellow,
		desc: 'Prepare a rank-check request and estimate intent signals before a SERP provider is connected.',
		inputLabel: 'Keyword and domain',
		placeholder: 'seo tools | seowallet.com',
		inputMode: 'text',
		samples: ['seo tools | seowallet.com'],
		extensionOrigin: 'Instant Position Checker',
		webWorkflow: 'Captures keyword/domain input for upcoming SERP API execution.',
	},
	{
		id: 'rank-comparison',
		name: 'Rank Comparison',
		credits: 5,
		category: 'Research',
		short: 'RC',
		color: yellow,
		desc: 'Compare multiple domains against a keyword list and prepare tracking rows.',
		inputLabel: 'Keywords and domains',
		placeholder: 'seo tools\nseowallet.com, seodebate.com, ahrefs.com',
		inputMode: 'textarea',
		samples: ['seo audit tools\nseowallet.com, seodebate.com, semrush.com'],
		extensionOrigin: 'Rank Comparison',
		webWorkflow: 'Creates comparison structure from pasted inputs.',
	},
	{
		id: 'serp-analysis',
		name: 'SERP Analysis',
		credits: 6,
		category: 'Research',
		short: 'SA',
		color: yellow,
		desc: 'Summarize pasted SERP competitors, result types and ranking page patterns.',
		inputLabel: 'SERP URLs or copied result text',
		placeholder: 'Paste ranking URLs or copied SERP text...',
		inputMode: 'textarea',
		samples: ['https://ahrefs.com/blog/seo-tools/\nhttps://backlinko.com/seo-tools\nPeople also ask: What is the best SEO tool?'],
		extensionOrigin: 'SERP Analysis',
		webWorkflow: 'Paste SERP results until live provider integration is connected.',
	},
	{
		id: 'local-search-simulator',
		name: 'Local Search Simulator',
		credits: 2,
		category: 'Research',
		short: 'LS',
		color: yellow,
		desc: 'Build localized Google search URLs by query, country and city.',
		inputLabel: 'Query and location',
		placeholder: 'seo agency | Dubai, AE',
		inputMode: 'text',
		samples: ['seo agency | Dubai, AE'],
		extensionOrigin: 'Local Search Simulator',
		webWorkflow: 'Generates localized search links from text input.',
	},
	{
		id: 'index-api-connector',
		name: 'IndexAPI Connector',
		credits: 5,
		category: 'Automation',
		short: 'IA',
		color: teal,
		desc: 'Prepare URL submission payloads for Google Indexing API or IndexNow integrations.',
		inputLabel: 'URLs',
		placeholder: 'https://example.com/new-page\nhttps://example.com/updated-page',
		inputMode: 'textarea',
		samples: ['https://seowallet.com/hub/events/\nhttps://seowallet.com/dashboard'],
		extensionOrigin: 'IndexAPI Connector',
		webWorkflow: 'Validates URL batches before backend credential integration.',
	},
	{
		id: 'ai-assistant',
		name: 'AI Assistant',
		credits: 8,
		category: 'Content',
		short: 'AI',
		color: purple,
		desc: 'Turn an SEO task prompt into a structured checklist, brief, or next-action plan.',
		inputLabel: 'SEO task',
		placeholder: 'Create an SEO audit checklist for a B2B SaaS landing page...',
		inputMode: 'textarea',
		samples: ['Create a technical SEO checklist for a 500-page SaaS website.'],
		extensionOrigin: 'AI Assistant',
		webWorkflow: 'Provides a deterministic brief template until model execution is wired.',
	},
	{
		id: 'rendered-source',
		name: 'View Rendered Source',
		credits: 1,
		category: 'Technical',
		short: 'RS',
		color: blue,
		desc: 'Inspect pasted rendered HTML with counts for scripts, links, headings and meta tags.',
		inputLabel: 'Rendered HTML',
		placeholder: '<html><head>...</head><body>...</body></html>',
		inputMode: 'textarea',
		samples: ['<html><head><title>SEO Wallet</title></head><body><h1>Dashboard</h1><script src="/app.js"></script></body></html>'],
		extensionOrigin: 'View Rendered Source',
		webWorkflow: 'Paste rendered source from browser devtools.',
	},
]

const stripTags = (value: string) => value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
const words = (value: string) => stripTags(value).trim().split(/\s+/).filter(Boolean)
const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
const matches = (value: string, pattern: RegExp) => Array.from(value.matchAll(pattern))

function parseUrl(value: string) {
	const trimmed = value.trim()
	const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
	const params = Array.from(url.searchParams.entries())
	const hostParts = url.hostname.split('.')
	return { url, params, hostParts }
}

function classifyIntent(keyword: string) {
	const text = keyword.toLowerCase()
	if (/\b(best|top|vs|review|alternative|pricing|price|tool|software|service|agency)\b/.test(text)) return 'Commercial'
	if (/\b(buy|hire|order|coupon|near me|quote)\b/.test(text)) return 'Transactional'
	if (/\b(how|what|why|guide|learn|tutorial|fix|example)\b/.test(text)) return 'Informational'
	return 'Navigational'
}

export function analyzeSeoTool(tool: SeoTool, input: string): ToolAnalysisResult {
	const text = input.trim()
	const wordCount = words(text).length
	const html = text

	if (tool.id === 'url-toolkit' || tool.id === 'domain-inspector') {
		try {
			const { url, params, hostParts } = parseUrl(text)
			const canonical = `${url.origin}${url.pathname}`.replace(/\/$/, '') || url.origin
			const hasTracking = params.some(([key]) => /^(utm_|fbclid|gclid|msclkid)/i.test(key))
			return {
				title: `URL report for ${url.hostname}`,
				summary: hasTracking ? 'Tracking parameters detected. Use a clean canonical URL for SEO signals.' : 'URL anatomy looks clean for basic SEO handling.',
				metrics: [
					{ label: 'Protocol', value: url.protocol.replace(':', '').toUpperCase(), sub: 'scheme', color: teal },
					{ label: 'Host parts', value: String(hostParts.length), sub: url.hostname, color: blue },
					{ label: 'Parameters', value: String(params.length), sub: params.length ? 'query values' : 'none', color: params.length ? yellow : teal },
					{ label: 'Slug depth', value: String(url.pathname.split('/').filter(Boolean).length), sub: url.pathname || '/', color: purple },
				],
				findings: [
					{ title: 'Canonical candidate', detail: canonical, tone: 'info' },
					{ title: hasTracking ? 'Tracking cleanup needed' : 'No tracking parameters', detail: hasTracking ? 'Remove analytics parameters from canonical/internal links.' : 'No common tracking parameters were found.', tone: hasTracking ? 'warn' : 'good' },
				],
				table: params.length ? { columns: ['Parameter', 'Value'], rows: params.map(([key, value]) => [key, value || '-']) } : undefined,
			}
		} catch {
			return invalidResult(tool, 'Enter a valid domain or URL.')
		}
	}

	if (tool.id === 'word-counter') {
		const sentenceCount = (text.match(/[.!?]+(\s|$)/g) || []).length || (text ? 1 : 0)
		const paragraphCount = text.split(/\n\s*\n/).filter((item) => item.trim()).length || (text ? 1 : 0)
		return {
			title: 'Copy length report',
			summary: wordCount > 0 ? 'Text is ready for length review.' : 'Paste copy to count words and characters.',
			metrics: [
				{ label: 'Words', value: String(wordCount), sub: 'tokens', color: teal },
				{ label: 'Characters', value: String(text.length), sub: 'including spaces', color: blue },
				{ label: 'Sentences', value: String(sentenceCount), sub: 'estimated', color: purple },
				{ label: 'Reading time', value: `${Math.max(1, Math.ceil(wordCount / 220))}m`, sub: 'at 220 wpm', color: yellow },
			],
			findings: [
				{ title: 'Paragraphs', detail: `${paragraphCount} paragraph${paragraphCount === 1 ? '' : 's'} detected.`, tone: 'info' },
				{ title: 'Meta description fit', detail: text.length <= 160 ? 'This fits within a typical meta description length.' : 'This is longer than a typical meta description.', tone: text.length <= 160 ? 'good' : 'warn' },
			],
		}
	}

	if (tool.id === 'heading-optimization') {
		const headingMatches = matches(html, /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)
		const rows = headingMatches.map((match) => [`H${match[1]}`, stripTags(match[2]).replace(/\s+/g, ' ').trim()])
		const h1Count = rows.filter(([level]) => level === 'H1').length
		const jumps = rows.some(([level], index) => index > 0 && Number(level[1]) - Number(rows[index - 1][0][1]) > 1)
		return {
			title: 'Heading hierarchy report',
			summary: `${rows.length} headings found. ${h1Count === 1 && !jumps ? 'Hierarchy looks healthy.' : 'Review hierarchy warnings.'}`,
			metrics: [
				{ label: 'Headings', value: String(rows.length), sub: 'H1-H6', color: blue },
				{ label: 'H1 count', value: String(h1Count), sub: h1Count === 1 ? 'ideal' : 'needs review', color: h1Count === 1 ? teal : yellow },
				{ label: 'Depth jumps', value: jumps ? 'Yes' : 'No', sub: 'sequence check', color: jumps ? yellow : teal },
				{ label: 'Words', value: String(wordCount), sub: 'visible copy', color: purple },
			],
			findings: [
				{ title: h1Count ? 'H1 present' : 'Missing H1', detail: h1Count ? `${h1Count} H1 heading${h1Count === 1 ? '' : 's'} found.` : 'Add one descriptive H1.', tone: h1Count === 1 ? 'good' : 'warn' },
				{ title: jumps ? 'Heading jump detected' : 'Heading order', detail: jumps ? 'Avoid jumping from H1 to H3/H4 without intermediate sections.' : 'No major depth jumps detected.', tone: jumps ? 'warn' : 'good' },
			],
			table: rows.length ? { columns: ['Level', 'Text'], rows } : undefined,
		}
	}

	if (tool.id === 'image-optimization') {
		const imageMatches = matches(html, /<img\b([^>]*)>/gi)
		const rows = imageMatches.map((match, index) => {
			const attrs = match[1]
			const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1] || '-'
			const alt = attrs.match(/\balt=["']([^"']*)["']/i)?.[1] ?? ''
			const width = attrs.match(/\bwidth=["']?([^"'\s>]+)["']?/i)?.[1] || '-'
			const height = attrs.match(/\bheight=["']?([^"'\s>]+)["']?/i)?.[1] || '-'
			return [`#${index + 1}`, src, alt || 'Missing', `${width} x ${height}`]
		})
		const missingAlt = rows.filter((row) => row[2] === 'Missing').length
		return {
			title: 'Image optimization report',
			summary: `${rows.length} image tags found. ${missingAlt ? `${missingAlt} need alt text.` : 'Alt text coverage is present.'}`,
			metrics: [
				{ label: 'Images', value: String(rows.length), sub: 'tags', color: blue },
				{ label: 'Missing alt', value: String(missingAlt), sub: 'accessibility', color: missingAlt ? yellow : teal },
				{ label: 'With dimensions', value: String(rows.filter((row) => row[3] !== '- x -').length), sub: 'layout stability', color: teal },
				{ label: 'Copy words', value: String(wordCount), sub: 'around markup', color: purple },
			],
			findings: [
				{ title: missingAlt ? 'Alt text needed' : 'Alt text present', detail: missingAlt ? 'Add concise descriptive alt text for content images.' : 'All detected images include alt attributes.', tone: missingAlt ? 'warn' : 'good' },
			],
			table: rows.length ? { columns: ['#', 'Source', 'Alt', 'Dimensions'], rows } : undefined,
		}
	}

	if (tool.id === 'link-checker') {
		const linkMatches = matches(html, /<a\b([^>]*)>([\s\S]*?)<\/a>/gi)
		const rows = linkMatches.map((match) => {
			const attrs = match[1]
			const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1] || ''
			const rel = attrs.match(/\brel=["']([^"']+)["']/i)?.[1] || ''
			const label = stripTags(match[2]).replace(/\s+/g, ' ').trim() || '-'
			const type = /^https?:\/\//i.test(href) ? 'External' : href.startsWith('/') ? 'Internal' : href ? 'Other' : 'Missing'
			return [href || 'Missing', label, type, /nofollow/i.test(rel) ? 'Nofollow' : 'Follow']
		})
		const external = rows.filter((row) => row[2] === 'External').length
		const missing = rows.filter((row) => row[0] === 'Missing' || row[0] === '#').length
		return {
			title: 'Link checker report',
			summary: `${rows.length} links extracted with ${external} external links.`,
			metrics: [
				{ label: 'Links', value: String(rows.length), sub: 'anchors', color: blue },
				{ label: 'External', value: String(external), sub: 'outbound', color: purple },
				{ label: 'Nofollow', value: String(rows.filter((row) => row[3] === 'Nofollow').length), sub: 'rel attribute', color: yellow },
				{ label: 'Empty', value: String(missing), sub: 'href issues', color: missing ? yellow : teal },
			],
			findings: [
				{ title: missing ? 'Empty links found' : 'Href coverage', detail: missing ? 'Replace # or missing href values before publishing.' : 'Detected anchors include href values.', tone: missing ? 'warn' : 'good' },
			],
			table: rows.length ? { columns: ['Href', 'Anchor text', 'Type', 'Follow'], rows } : undefined,
		}
	}

	if (tool.id === 'structured-data') {
		const blocks = matches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
		const rows = blocks.map((match, index) => {
			try {
				const parsed = JSON.parse(match[1].trim())
				return [`#${index + 1}`, Array.isArray(parsed) ? 'Array' : parsed['@type'] || 'Unknown', 'Valid JSON']
			} catch {
				return [`#${index + 1}`, 'Unknown', 'Invalid JSON']
			}
		})
		const invalid = rows.filter((row) => row[2] === 'Invalid JSON').length
		return {
			title: 'Structured data report',
			summary: `${rows.length} JSON-LD block${rows.length === 1 ? '' : 's'} detected.`,
			metrics: [
				{ label: 'JSON-LD', value: String(rows.length), sub: 'blocks', color: blue },
				{ label: 'Invalid', value: String(invalid), sub: 'parse errors', color: invalid ? yellow : teal },
				{ label: 'Schema types', value: String(new Set(rows.map((row) => row[1])).size), sub: 'unique', color: purple },
				{ label: 'HTML size', value: `${Math.ceil(html.length / 1024)}KB`, sub: 'input', color: teal },
			],
			findings: [
				{ title: rows.length ? 'Schema detected' : 'No schema detected', detail: rows.length ? 'Validate required properties for each schema type before publishing.' : 'Add JSON-LD for eligible page types.', tone: rows.length ? 'good' : 'warn' },
			],
			table: rows.length ? { columns: ['Block', 'Type', 'Status'], rows } : undefined,
		}
	}

	if (tool.id === 'social-markup') {
		const og = matches(html, /<meta[^>]+property=["']og:([^"']+)["'][^>]*>/gi)
		const twitter = matches(html, /<meta[^>]+name=["']twitter:([^"']+)["'][^>]*>/gi)
		const required = ['title', 'description', 'image', 'url']
		const ogNames = og.map((match) => match[1].toLowerCase())
		const missing = required.filter((item) => !ogNames.includes(item))
		return {
			title: 'Social markup report',
			summary: missing.length ? `Missing ${missing.join(', ')} Open Graph tags.` : 'Core Open Graph tags are present.',
			metrics: [
				{ label: 'OG tags', value: String(og.length), sub: 'Open Graph', color: blue },
				{ label: 'Twitter tags', value: String(twitter.length), sub: 'cards', color: purple },
				{ label: 'Missing core', value: String(missing.length), sub: 'OG fields', color: missing.length ? yellow : teal },
				{ label: 'HTML size', value: `${Math.ceil(html.length / 1024)}KB`, sub: 'input', color: teal },
			],
			findings: [
				{ title: missing.length ? 'Core OG gaps' : 'Social sharing ready', detail: missing.length ? `Add og:${missing.join(', og:')}.` : 'Core social metadata exists.', tone: missing.length ? 'warn' : 'good' },
			],
		}
	}

	if (tool.id === 'search-intent-finder') {
		const rows = lines(text).map((keyword) => {
			const intent = classifyIntent(keyword)
			const format = intent === 'Commercial' ? 'Comparison/list page' : intent === 'Transactional' ? 'Landing page' : intent === 'Informational' ? 'Guide/how-to' : 'Brand/category page'
			return [keyword, intent, format]
		})
		return {
			title: 'Search intent report',
			summary: `${rows.length} keywords classified by intent.`,
			metrics: [
				{ label: 'Keywords', value: String(rows.length), sub: 'submitted', color: blue },
				{ label: 'Commercial', value: String(rows.filter((row) => row[1] === 'Commercial').length), sub: 'comparison intent', color: purple },
				{ label: 'Informational', value: String(rows.filter((row) => row[1] === 'Informational').length), sub: 'learning intent', color: teal },
				{ label: 'Transactional', value: String(rows.filter((row) => row[1] === 'Transactional').length), sub: 'buying intent', color: yellow },
			],
			findings: [{ title: 'Content planning', detail: 'Group pages by intent before assigning templates or CTAs.', tone: 'info' }],
			table: rows.length ? { columns: ['Keyword', 'Intent', 'Recommended format'], rows } : undefined,
		}
	}

	if (tool.id === 'redirects-manager') {
		const pairs = lines(text).map((line) => line.split(',').map((part) => part.trim()))
		const rows = pairs.map(([source = '', target = '']) => {
			const reverseExists = pairs.some(([otherSource, otherTarget]) => otherSource === target && otherTarget === source)
			return [source || 'Missing', target || 'Missing', reverseExists ? 'Loop risk' : 'OK']
		})
		const issues = rows.filter((row) => row[0] === 'Missing' || row[1] === 'Missing' || row[2] === 'Loop risk').length
		return {
			title: 'Redirect mapping report',
			summary: issues ? `${issues} redirect rows need review.` : 'Redirect rows look structurally valid.',
			metrics: [
				{ label: 'Rules', value: String(rows.length), sub: 'pairs', color: blue },
				{ label: 'Issues', value: String(issues), sub: 'warnings', color: issues ? yellow : teal },
				{ label: 'Loops', value: String(rows.filter((row) => row[2] === 'Loop risk').length), sub: 'reverse pairs', color: yellow },
				{ label: 'Ready', value: String(rows.length - issues), sub: 'clean rows', color: teal },
			],
			findings: [{ title: issues ? 'Review warnings' : 'Mappings ready', detail: 'Use absolute URLs for cross-domain migrations and relative paths for same-domain moves.', tone: issues ? 'warn' : 'good' }],
			table: rows.length ? { columns: ['Source', 'Target', 'Status'], rows } : undefined,
		}
	}

	if (tool.id === 'local-search-simulator') {
		const [query = '', location = ''] = text.split('|').map((part) => part.trim())
		const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}${location ? `&near=${encodeURIComponent(location)}` : ''}`
		return {
			title: 'Local search simulation',
			summary: 'Localized search URL prepared.',
			metrics: [
				{ label: 'Query', value: query ? 'Set' : 'Missing', sub: query || 'none', color: query ? teal : yellow },
				{ label: 'Location', value: location ? 'Set' : 'Global', sub: location || 'not provided', color: blue },
				{ label: 'Parameters', value: location ? '2' : '1', sub: 'Google URL', color: purple },
				{ label: 'Credits', value: '2', sub: 'per simulation', color: yellow },
			],
			findings: [{ title: 'Search URL', detail: searchUrl, tone: 'info' }],
			output: searchUrl,
		}
	}

	const rows = lines(text)
	return {
		title: `${tool.name} workspace`,
		summary: `${tool.extensionOrigin} has been mapped into the web app. Provider-backed execution can be connected behind this workflow.`,
		metrics: [
			{ label: 'Input lines', value: String(rows.length || (text ? 1 : 0)), sub: 'submitted', color: blue },
			{ label: 'Words', value: String(wordCount), sub: 'input text', color: teal },
			{ label: 'Workflow', value: 'Ready', sub: 'web shell', color: purple },
			{ label: 'Credits', value: String(tool.credits), sub: 'per run', color: yellow },
		],
		findings: [
			{ title: 'Extension parity path', detail: tool.webWorkflow, tone: 'info' },
			{ title: 'Next integration', detail: 'Connect this screen to the backend job/API that replaces Chrome runtime messaging for web users.', tone: 'info' },
		],
		table: rows.length ? { columns: ['Input', 'Status'], rows: rows.slice(0, 8).map((row) => [row, 'Queued']) } : undefined,
	}
}

function invalidResult(tool: SeoTool, message: string): ToolAnalysisResult {
	return {
		title: `${tool.name} needs valid input`,
		summary: message,
		metrics: [
			{ label: 'Status', value: 'Invalid', sub: 'input', color: yellow },
			{ label: 'Credits', value: '0', sub: 'not charged', color: teal },
			{ label: 'Tool', value: tool.short, sub: tool.category, color: blue },
			{ label: 'Origin', value: 'Ext', sub: tool.extensionOrigin, color: purple },
		],
		findings: [{ title: 'Input error', detail: message, tone: 'warn' }],
	}
}
