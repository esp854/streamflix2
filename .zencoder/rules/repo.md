# Repo Summary

- name: streamkji-replit-agent
- stack: Vite + React (client), Express (backend), TypeScript (client/server), TailwindCSS
- paths
  - client: client/src
  - server: server (TypeScript) and backend (Express JS mock APIs)
  - shared: shared (types/schema)
- dev scripts
  - server: npm run dev
  - client: npm run dev:client
  - both: npm run dev:both
  - build: npm run build

## Aliases / Imports
- @ → client/src
- @shared → shared
- @assets → attached_assets

## Known Issues / Fixes Applied
- vite.config.ts: replaced import.meta.dirname with ESM-compatible __dirname computed via fileURLToPath to avoid path resolution errors.
- backend/admin routes: added in-memory episodes CRUD and wired endpoints used by admin dashboard UI.
- backend/server: added /api/csrf-token endpoint and enabled CORS with credentials for local dev.

## API Endpoints (mock)
- /api/admin/users, /api/admin/content, /api/admin/analytics, /api/admin/security-logs
- /api/admin/episodes (POST), /api/admin/episodes/:contentId (GET), /api/admin/episodes/:episodeId (PUT/DELETE)
- /api/auth/login, /api/auth/register, /api/auth/me
- /api/subscription/current, /api/subscription/create-free

## Notes
- Data is in-memory for backend/routes/* mocks; restart resets state.
- Ensure `npm install` is run at project root; client proxies /api → http://localhost:5000.

## Test Configuration
- targetFramework: Playwright