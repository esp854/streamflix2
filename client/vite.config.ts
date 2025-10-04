import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dns from 'dns'

// Fix for slow HMR on Windows
dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    headers: {
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      // Content Security Policy
      'Content-Security-Policy': 
        `default-src 'self'; ` +
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com; ` +
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
        `img-src 'self' data: https: https://image.tmdb.org https://i.pinimg.com https://www.google-analytics.com https://www.googletagmanager.com https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com; ` +
        `font-src 'self' https://fonts.gstatic.com data:; ` +
        `connect-src 'self' ws://localhost:5173 ws://127.0.0.1:5000 https://api.themoviedb.org https://image.tmdb.org https://www.paypal.com https://www.sandbox.paypal.com https://fonts.googleapis.com https://i.pinimg.com https://fonts.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://selfishzone.com https://*.selfishzone.com; ` +
        `media-src 'self' blob: https: https://selfishzone.com https://*.selfishzone.com; ` +
        `object-src 'none'; ` +
        `frame-src 'self' blob: https://zupload.co https://zupload.cc https://zupload.io https://*.zupload.co https://*.zupload.cc https://*.zupload.io https://selfishzone.com https://*.selfishzone.com;`
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
})