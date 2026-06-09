import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
	{ error, className = '', ...rest },
	ref,
) {
	return (
		<textarea
			ref={ref}
			rows={3}
			className={[
				'block w-full resize-none rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
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

export default Textarea
