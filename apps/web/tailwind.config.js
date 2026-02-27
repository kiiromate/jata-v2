/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
        jata: {
          // Foundational (Dark Mode)
          'deep-carbon': '#0B0B0C',
          'iron-charcoal': '#121315',
          'graphite-mist': '#2A2B2E',
          'silver-ash': '#E8E8E8',
          'fog-white': '#B7B7B7',
          'muted-cyan': '#7F8A8E',
          
          // Accents
          'lumen-lime': '#C5FF3E',
          'aural-orange': '#FF8736',
          'cobalt-signal': '#2271FF',
          'rust-neutral': '#B45A3D',
          
          // Light Mode
          'light-bg': '#FFFFFF',
          'light-surface': '#F5F6F7',
          'light-text': '#101010',
          'light-text-secondary': '#5A5A5A',
          'light-border': '#E2E2E2',
          
          // Semantic mappings
          'text-primary': '#E8E8E8',
          'text-secondary': '#B7B7B7',
          'text-muted': '#7F8A8E',
        },
  			// Custom brand colors (Keeping for backward compatibility during migration)
  			'pure-white': '#ffffff',
  			'jet-black': '#0a0a0a',
  			'charcoal-gray': '#2a2a2a',
  			'soft-olive': '#8fbc8f',
  			
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
        headline: ['Inter', 'Satoshi', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        data: ['Space Grotesk', 'monospace'],
  			sans: [
  				'Inter',
  				'sans-serif'
  			],
  			mono: [
  				'Martian Mono',
  				'monospace'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			'jata-xs': '8px',
  			'jata-sm': '16px',
  			'jata-md': '24px',
  			'jata-lg': '32px',
  			'jata-xl': '48px',
  			'jata-2xl': '64px',
  			'xs': '0.5rem',   // 8px
  			'sm': '1rem',     // 16px
  			'md': '1.5rem',   // 24px
  			'lg': '2rem',     // 32px
  			'xl': '3rem',     // 48px
  		},
  		height: {
  			'app-header': '48px',
  			'sidebar-collapsed': '60px',
  			'sidebar-expanded': '240px',
  		},
  		transitionDuration: {
  			'sidebar': '200ms',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
