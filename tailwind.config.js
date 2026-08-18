/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
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
        clinical: { navy: '#1E293B', teal: '#FF4528', amber: '#F59E0B', red: '#DC2626', green: '#22C55E' },
        tl: { salmon: '#FFA07A', red: '#FF4528', purple: '#766AA3', navy: '#141820', lavender: '#A78BFA', mint: '#34D399' },
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