/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: '#3a3a3a',
        background: '#0E0E0E',
        foreground: '#ffffff',
        card: '#1a1a1a',
        'card-foreground': '#ffffff',
        popover: 'oklch(1 0 0)',
        'popover-foreground': 'oklch(0.145 0 0)',
        primary: '#ffffff',
        'primary-foreground': '#0E0E0E',
        secondary: '#2a2a2a',
        'secondary-foreground': '#ffffff',
        muted: '#2a2a2a',
        'muted-foreground': '#a0a0a0',
        accent: '#2a2a2a',
        'accent-foreground': '#ffffff',
        destructive: '#d4183d',
        'destructive-foreground': '#ffffff',
        input: '#2a2a2a',
        'input-background': '#2a2a2a',
        'switch-background': '#cbced4',
      },
    },
  },
  plugins: [],
}