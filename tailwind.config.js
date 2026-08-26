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
  		height: {
  			'app-header': 'var(--app-header-height)',
  			'app-nav': 'var(--app-nav-height)'
  		},
  		zIndex: {
  			base: 'var(--z-base)',
  			sticky: 'var(--z-sticky)',
  			dropdown: 'var(--z-dropdown)',
  			nav: 'var(--z-nav)',
  			overlay: 'var(--z-overlay)',
  			modal: 'var(--z-modal)',
  			toast: 'var(--z-toast)'
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
        clinical: { navy: '#15131A', teal: '#765AB0', amber: '#A65A00', red: '#FC4421', green: '#277A52' },
        tl: { salmon: '#FF9567', red: '#FC4421', purple: '#765AB0', navy: '#15131A', lavender: '#DCD2EE', mint: '#BFE4D0' },
  			chart: { '1': 'hsl(73 100% 36%)', '2': 'hsl(142 71% 45%)', '3': 'hsl(38 92% 50%)', '4': 'hsl(280 65% 60%)', '5': 'hsl(340 75% 55%)' },
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