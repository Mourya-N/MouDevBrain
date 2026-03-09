/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                dark: {
                    900: '#030014', // Deep Midnight Plum/Navy
                    800: '#09091f',
                    700: '#0f0f29',
                    card: 'rgba(3, 0, 20, 0.4)',
                },
                neon: {
                    purple: '#a855f7', // Brighter fuchsia/purple
                    blue: '#3b82f6',
                    cyan: '#22d3ee', // Brighter cyan
                    emerald: '#34d399',
                    amber: '#fbbf24',
                    rose: '#fb7185',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)',
                'premium-noise': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.85\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')",
                'premium-grid': "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
            },
            boxShadow: {
                'glass-premium': 'inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.03), 0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                'glass-card-hover': 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 8px 32px 0 rgba(168, 85, 247, 0.15)',
                'neon-purple': '0 0 15px rgba(168, 85, 247, 0.5)',
                'neon-cyan': '0 0 15px rgba(34, 211, 238, 0.5)',
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}