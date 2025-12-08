/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['-apple-system', 'SF Pro Text', 'Inter', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif'],
        'display': ['-apple-system', 'SF Pro Display', 'Inter', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif'],
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'bold': '700',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
