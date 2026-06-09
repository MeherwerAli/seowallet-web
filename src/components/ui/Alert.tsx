type AlertVariant = 'error' | 'success' | 'info'

interface AlertProps {
	variant?: AlertVariant
	message: string
}

const variantClasses: Record<AlertVariant, string> = {
	error: 'bg-red-50 border-red-200 text-red-700',
	success: 'bg-green-50 border-green-200 text-green-700',
	info: 'bg-brand-50 border-brand-100 text-brand-700',
}

export default function Alert({ variant = 'error', message }: AlertProps) {
	return (
		<div className={`rounded-lg border px-4 py-3 text-sm ${variantClasses[variant]}`}>{message}</div>
	)
}
