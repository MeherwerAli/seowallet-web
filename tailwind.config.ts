import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				brand: {
					50: '#f0f4ff',
					100: '#e0eaff',
					500: '#4f6ef7',
					600: '#3d5ce8',
					700: '#2c4ad4',
					900: '#1a2d8f',
				},
			},
			fontFamily: {
				sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [],
}

export default config
