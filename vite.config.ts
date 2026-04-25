import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// כשמעלים ל-GitHub Pages, שנה את base לשם הריפוזיטורי
// למשל: base: '/cube-sim/'
// לפיתוח מקומי ול-Netlify/Vercel: base: '/'
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
