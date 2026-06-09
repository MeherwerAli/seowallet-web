import Spinner from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	loading?: boolean
	fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500 disabled:bg-brand-500/50',
	secondary:
		'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400 disabled:opacity-50',
	ghost: 'text-brand-500 hover:bg-brand-50 focus-visible:ring-brand-500 disabled:opacity-50',
}

export default function Button({
	variant = 'primary',
	loading = false,
	fullWidth = false,
	children,
	disabled,
	className = '',
	...rest
}: ButtonProps) {
	return (
		<button
			disabled={disabled || loading}
			className={[
				'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
				'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				variantClasses[variant],
				fullWidth ? 'w-full' : '',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			{...rest}
		>
			{loading && <Spinner size="sm" />}
			{children}
		</button>
	)
}
