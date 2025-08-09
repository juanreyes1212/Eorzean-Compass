import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  prefix: "",
  theme: {
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
          // Deep ocean blues for primary navigation
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Primary compass blue
          600: '#0284c7',
          700: '#0369a1', // Deep sea blue
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        earth: {
          // Earthy browns for land/terrain
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094', // Warm earth tone
          600: '#a18072',
          700: '#977669', // Rich earth brown
          800: '#846358',
          900: '#43302b',
          950: '#362117',
        },
        gold: {
          // Compass gold accents
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
          // Silver compass accents
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Compass silver
          600: '#475569',
          700: '#334155', // Deep silver
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Override default shadcn colors with compass theme
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0369a1", // Deep compass blue
          foreground: "#f0f9ff",
        },
        secondary: {
          DEFAULT: "#977669", // Rich earth brown
          foreground: "#fdf8f6",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#334155", // Deep silver
          foreground: "#cbd5e1",
        },
        accent: {
          DEFAULT: "#f59e0b", // Compass gold
          foreground: "#451a03",
        },
        popover: {
          DEFAULT: "#0c4a6e", // Deep ocean blue
          foreground: "#e0f2fe",
        },
        card: {
          DEFAULT: "#075985", // Deep sea blue
          foreground: "#bae6fd",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "compass-spin": "compass-spin 2s linear infinite",
      },
      backgroundImage: {
        'compass-gradient': 'linear-gradient(135deg, #0369a1 0%, #075985 50%, #0c4a6e 100%)',
        'earth-gradient': 'linear-gradient(135deg, #977669 0%, #846358 50%, #43302b 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
