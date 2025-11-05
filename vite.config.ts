import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ✅ important for GitHub Pages project sites
  base: mode === 'production'
    ? '/vinodhkumar-saminathan-etl-linkedprofiles-demo-website/'
    : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
  },
}));
