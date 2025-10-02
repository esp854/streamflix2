import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { createServer as createViteServer, createLogger } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import type { ViteDevServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom middleware to add CSP headers
const cspMiddleware = () => {
  return {
    name: 'csp-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Add CSP header to allow Zupload domains
        res.setHeader(
          'Content-Security-Policy',
          `default-src 'self'; ` +
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com https://www.gstatic.com http://localhost:5173 http://127.0.0.1:5000 https://*.paypal.com:* https://*.paypalobjects.com https://*.braintreegateway.com blob:; ` +
          `script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com https://www.gstatic.com http://localhost:5173 http://127.0.0.1:5000 https://*.paypal.com:* https://*.paypalobjects.com https://*.braintreegateway.com blob:; ` +
          `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://translate.googleapis.com; ` +
          `img-src 'self' data: https: https://www.google-analytics.com https://www.googletagmanager.com; ` +
          `font-src 'self' data: https://fonts.gstatic.com; ` +
          `connect-src 'self' https://api.themoviedb.org https://image.tmdb.org https://www.paypal.com https://www.sandbox.paypal.com https://fonts.googleapis.com https://i.pinimg.com https://fonts.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com; ` +
          `frame-src 'self' https://odysee.com https://player.twitch.tv https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://zupload.cc https://zupload.co https://zupload.io https://*.zupload.cc https://*.zupload.co https://*.zupload.io https://www.paypal.com https://www.sandbox.paypal.com; ` +
          `media-src 'self' blob: https:; ` +
          `worker-src 'self' blob:; ` +
          `child-src 'self' blob: https://zupload.cc https://zupload.co https://zupload.io https://*.zupload.cc https://*.zupload.co https://*.zupload.io;`
        );
        next();
      });
    }
  };
};

const viteConfig = {
  plugins: [
    react(),
    cspMiddleware(),
    // runtimeErrorOverlay(), // Temporairement désactivé pour résoudre l'erreur DOM
  ],
  optimizeDeps: {
    exclude: ['chunk-IPDEAFVS']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../client/src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  root: path.resolve(__dirname, "../client"),
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      overlay: false, // Désactive l'overlay d'erreur HMR
      port: parseInt(process.env.PORT || '5000', 10)
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
};

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Vite setup is only available in development mode");
  }

  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
