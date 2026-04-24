import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      display: ['var(--font-cinzel)', 'Georgia', 'serif'],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Eorzean Compass Theme Colors
        compass: {
          // Deep ocean teal-navy for primary navigation
          50: '#edfafe',
          100: '#d0f3fb',
          200: '#a5e8f7',
          300: '#67d6f0',
          400: '#22bce0',
          500: '#0d9fc5', // Ocean teal
          600: '#0d7ea0', // Deep teal
          700: '#0a5f7a', // Abyss teal
          800: '#084358', // Deep ocean
          900: '#062d3d', // Abyssal
          950: '#031b26', // Midnight ocean
        },
        earth: {
          // Seafoam / coral tones for RNG vector
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f5e0',
          300: '#5ee8ca',
          400: '#2dd0af',
          500: '#14b49a', // Seafoam
          600: '#0e9280',
          700: '#107265',
          800: '#125b52',
          900: '#124a44',
          950: '#062c29',
        },
        gold: {
          // Warm bioluminescent gold accents
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Compass gold
          600: '#d97706',
          700: '#b45309', // Deep gold
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        silver: {
          // Pearl seafoam neutrals
          50: '#f0fafa',
          100: '#ddf3f4',
          200: '#bce8ea',
          300: '#8dd6d9',
          400: '#57bcc1',
          500: '#3aa0a6', // Seafoam pearl
          600: '#2e7e84',
          700: '#29666b',
          800: '#275358',
          900: '#244549',
          950: '#132b2e',
        },
        // Override default shadcn colors with compass theme
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0d7ea0", // Deep ocean teal
          foreground: "#edfafe",
        },
        secondary: {
          DEFAULT: "#14b49a", // Seafoam
          foreground: "#f0fdf9",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#275358", // Deep silver-teal
          foreground: "#bce8ea",
        },
        accent: {
          DEFAULT: "#f59e0b", // Compass gold
          foreground: "#451a03",
        },
        popover: {
          DEFAULT: "#062d3d", // Abyssal ocean
          foreground: "#d0f3fb",
        },
        card: {
          DEFAULT: "#084358", // Deep ocean
          foreground: "#a5e8f7",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "compass-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "wave-drift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "compass-spin": "compass-spin 2s linear infinite",
        "wave-drift": "wave-drift 8s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
      },
      backgroundImage: {
        'compass-gradient': 'linear-gradient(135deg, #0d7ea0 0%, #0a5f7a 50%, #062d3d 100%)',
        'ocean-gradient': 'linear-gradient(180deg, #062d3d 0%, #031b26 100%)',
        'earth-gradient': 'linear-gradient(135deg, #14b49a 0%, #0e9280 50%, #124a44 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        'abyss-gradient': 'linear-gradient(180deg, #031b26 0%, #020d15 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
