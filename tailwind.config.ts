import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        brand: {
          50: '#e6f5f5',
          100: '#b3e0e1',
          200: '#80cbcd',
          300: '#4db6b9',
          400: '#26a5a8',
          500: '#0D7377',
          600: '#0b6163',
          700: '#094e50',
          800: '#073c3d',
          900: '#052a2b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'var(--font-heading-ar)', 'sans-serif'],
        body: ['var(--font-body)', 'var(--font-body-ar)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        card: '16px',
        modal: '24px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
        medium: '0 4px 6px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.1)',
        large: '0 8px 16px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
