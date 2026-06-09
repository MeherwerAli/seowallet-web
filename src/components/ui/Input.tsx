import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ error, className = '', ...rest },
	ref,
) {
	return (
		<input
			ref={ref}
			className={[
				'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
				'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0',
				'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
				error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			{...rest}
		/>
	)
})

export default Input
