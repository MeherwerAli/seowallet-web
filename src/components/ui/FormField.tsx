interface FormFieldProps {
	label: string
	htmlFor?: string
	error?: string
	hint?: string
	required?: boolean
	children: React.ReactNode
}

export default function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<label
				htmlFor={htmlFor}
				className="text-sm font-medium text-gray-700"
			>
				{label}
				{required && <span className="ml-0.5 text-red-500">*</span>}
			</label>
			{children}
			{error && <p className="text-xs text-red-500">{error}</p>}
			{hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
		</div>
	)
}
