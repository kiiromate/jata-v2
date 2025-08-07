/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cool-gray': '#D3D7D9',
        'pure-white': '#FFFFFF',
        'soft-olive': '#A3BFFA',
        'jet-black': '#1C2526',
        'light-gray': '#E5E7EB',
        'charcoal-gray': '#4A4A4A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
