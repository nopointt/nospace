/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bronze: {
                    400: '#D4C5A9',
                    500: '#B5A48B', // Primary Bronze
                    600: '#8E7F68',
                    900: '#2A251E',
                },
                slate: {
                    900: '#1A1C1E', // Deep Slate Base
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                display: ['Archivo Black', 'sans-serif'],
            },
            boxShadow: {
                'bronze-glow': '0 0 15px rgba(181, 164, 139, 0.4)',
                'emerald-glow': '0 0 10px rgba(118, 196, 77, 0.6)',
                'indigo-glow': '0 0 10px rgba(99, 102, 241, 0.6)',
            }
        },
    },
    plugins: [],
}
