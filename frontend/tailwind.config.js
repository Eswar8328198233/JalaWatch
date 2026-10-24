/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f2faf7',
          100: '#e1f6ee',
          200: '#c3eddc',
          300: '#97dfc4',
          400: '#64c9a6',
          500: '#3db18a',
          600: '#2c9170',
          700: '#25745b',
          800: '#215d4a',
          900: '#1d4d3e',
        },
        aqua: {
          50: '#f0fdff',
          100: '#dbfbfe',
          200: '#baf5fc',
          300: '#84eaf8',
          400: '#42d4f0',
          500: '#17b8db',
          600: '#0e94b8',
          700: '#117594',
          800: '#165e77',
          900: '#174f64',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(13, 148, 136, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 36px -4px rgba(15, 118, 110, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
