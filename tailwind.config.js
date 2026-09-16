/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		spacing: {
  			'0': 'var(--space-0)',
  			'1': 'var(--space-1)',
  			'2': 'var(--space-2)',
  			'3': 'var(--space-3)',
  			'4': 'var(--space-4)',
  			'5': 'var(--space-5)',
  			'6': 'var(--space-6)',
  			'8': 'var(--space-8)',
  			'10': 'var(--space-10)',
  			'12': 'var(--space-12)',
  			'16': 'var(--space-16)',
  			'20': 'var(--space-20)',
  			'24': 'var(--space-24)'
  		},
  		gutter: 'var(--page-gutter)',
  		maxWidth: {
  			content: 'var(--content-max)',
  			'content-standard': 'var(--content-max-standard)',
  			'content-narrow': 'var(--content-max-narrow)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
  			popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
  			primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  			secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
  			muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
  			accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
  			destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
        clinical: { navy: '#063B82', teal: '#0F75D8', cyan: '#29E7FF', amber: '#A65A00', red: '#FC4421', green: '#2BBF8A' },
        tl: { blue: '#0F75D8', cyan: '#29E7FF', red: '#FC4421', navy: '#063B82', ice: '#D8EAF8', green: '#2BBF8A' },
  			chart: { '1': '#0F75D8', '2': '#2BBF8A', '3': '#29E7FF', '4': '#063B82', '5': '#FC4421' },
  			sidebar: { DEFAULT: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))', primary: 'hsl(var(--primary))', 'primary-foreground': 'hsl(var(--primary-foreground))', accent: 'hsl(var(--muted))', 'accent-foreground': 'hsl(var(--foreground))', border: 'hsl(var(--border))', ring: 'hsl(var(--ring))' }
  		},
  		fontFamily: {
  			heading: ['Saira', 'Arial', 'sans-serif'],
  			body: ['Inter', 'Arial', 'sans-serif'],
  			display: ['Russo One', 'Arial', 'sans-serif'],
  			mono: ['var(--font-mono)']
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}