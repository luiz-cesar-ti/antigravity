import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite de aviso para 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['lucide-react', 'recharts', 'clsx', 'tailwind-merge'],
          'pdf': ['html2pdf.js'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
})
