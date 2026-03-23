import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary blue (tech-forward brand)
        blue: {
          50: '#F0F7FF',
          100: '#E6F0FF',
          200: '#D0E3FF',
          300: '#A8D0FF',
          400: '#7BB9FF',
          500: '#4A9FFF',
          600: '#0066CC', // primary
          700: '#0052A3',
          800: '#004499',
          900: '#003366',
        },
        // Semantic colors
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          600: '#00AA44',
          700: '#0A8A38',
          800: '#065F31',
          900: '#042E1B',
        },
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          600: '#CC0000',
          700: '#A40000',
          800: '#7F0000',
          900: '#5A0000',
        },
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          600: '#FF9900',
          700: '#DD7B00',
          800: '#BB6100',
          900: '#884700',
        },
        // Neutral grays
        gray: {
          50: '#F9FAFB',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#CCCCCC',
          400: '#999999',
          500: '#666666',
          600: '#555555',
          700: '#333333',
          800: '#222222',
          900: '#111111',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '14': '3.5rem',
        '18': '4.5rem',
      },
      fontSize: {
        '2xs': '11px',
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      lineHeight: {
        relaxed: '1.5',
        loose: '1.75',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      opacity: {
        5: '0.05',
        10: '0.1',
      },
      transitionDuration: {
        400: '400ms',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
