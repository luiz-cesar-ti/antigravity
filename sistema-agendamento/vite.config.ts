import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor: React core
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          // Vendor: Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase'
          }
          // Vendor: Charts (Recharts + D3)
          if (id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-')) {
            return 'vendor-charts'
          }
          // Vendor: PDF generation
          if (id.includes('node_modules/html2pdf') ||
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf'
          }
          // Vendor: UI utilities
          if (id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/framer-motion')) {
            return 'vendor-ui'
          }
          // App: Admin pages
          if (id.includes('/pages/admin/')) {
            return 'pages-admin'
          }
          // App: Teacher pages
          if (id.includes('/pages/BookingWizard') ||
            id.includes('/pages/TeacherBookings') ||
            id.includes('/pages/TeacherAbout') ||
            id.includes('/pages/RoomBookingV2')) {
            return 'pages-teacher'
          }
          // App: Auth pages
          if (id.includes('/pages/Login') ||
            id.includes('/pages/Register') ||
            id.includes('/pages/ForgotPassword') ||
            id.includes('/pages/UpdatePassword')) {
            return 'pages-auth'
          }
        }
      }
    }
  }
})
