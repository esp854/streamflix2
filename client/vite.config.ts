import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom middleware to add CSP headers
const cspMiddleware = () => {
  return {
    name: 'csp-middleware',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Add CSP header to allow Zupload domains
        res.setHeader(
          'Content-Security-Policy',
          `default-src 'self'; ` +
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://www.gstatic.com http://localhost:5173 http://127.0.0.1:5000 https://*.paypal.com:* https://*.paypalobjects.com https://*.braintreegateway.com https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com; ` +
          `script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://www.gstatic.com http://localhost:5173 http://127.0.0.1:5000 https://*.paypal.com:* https://*.paypalobjects.com https://*.braintreegateway.com https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com; ` +
          `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://translate.googleapis.com; ` +
          `img-src 'self' data: https: https://www.google-analytics.com https://www.googletagmanager.com https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com; ` +
          `font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; ` +
          `connect-src 'self' ws://localhost:5173 ws://127.0.0.1:5000 https://api.themoviedb.org https://image.tmdb.org https://www.paypal.com https://www.sandbox.paypal.com https://fonts.googleapis.com https://i.pinimg.com https://fonts.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com https://silent-basis.pro https://*.silent-basis.pro; ` +
          `frame-src 'self' https://odysee.com https://player.twitch.tv https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://zupload.co https://zupload.cc https://zupload.io https://*.zupload.co https://*.zupload.cc https://*.zupload.io https://www.paypal.com https://www.sandbox.paypal.com https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com; ` +
          `media-src 'self' blob: https: https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com https://silent-basis.pro https://*.silent-basis.pro; ` +
          `worker-src 'self' blob:; ` +
          `child-src 'self' blob: https://zupload.co https://zupload.cc https://zupload.io https://*.zupload.co https://*.zupload.cc https://*.zupload.io https://hilltopads.net https://*.hilltopads.net https://selfishzone.com https://*.selfishzone.com https://silent-basis.pro https://*.silent-basis.pro;`
        );
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    cspMiddleware()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  root: ".",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom', 'wouter'],
          utils: ['@/lib/utils', '@/lib/tmdb'],
          hooks: ['@/hooks/usePWA', '@/hooks/useAuthCheck']
        }
      }
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      overlay: false, // Désactive l'overlay d'erreur HMR
      port: parseInt(process.env.PORT || '5173', 10) // Correction du port HMR
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter'],
    exclude: ['chunk-IPDEAFVS']
  }
});