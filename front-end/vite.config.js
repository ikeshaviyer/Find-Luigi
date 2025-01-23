import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures proper relative paths for deployment
  build: {
    outDir: 'dist', // Output directory for build
    rollupOptions: {
      // Customize Rollup options here if needed
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
})
