---
name: Vercel deploy for Express + Vite apps
description: Pattern for deploying an existing Express-backend + Vite-frontend app to Vercel without touching package.json scripts.
---

For a Replit-style fullstack-js app (Express API + Vite-built SPA) that needs to deploy to Vercel, without being able to edit `package.json`:

**Why:** Vercel doesn't run a long-lived Node server for a plain Express app on the default deployment path; it expects serverless functions under `api/`. Also, per project conventions, `package.json` scripts can't be touched, so the Vercel-specific build must be configured entirely via `vercel.json`.

**How to apply:**
- Create a single catch-all serverless entry `api/[...path].ts` that builds the Express app once (lazily, memoized across invocations) and calls `registerRoutes(...)` from the existing `server/routes.ts`, then delegates `(req, res)` to the Express app. This avoids needing per-route Vercel functions or URL-rewrite tricks — Vercel's dynamic catch-all route naming (`[...path]`) alone makes every `/api/*` request hit this one function with the original `req.url` intact.
- `vercel.json` only needs: `buildCommand` (the frontend build command, e.g. `vite build`), `outputDirectory` (the Vite build output dir), and a SPA-fallback rewrite (`"/((?!api/).*)" -> "/index.html"`) for client-side routing.
- Register Express error-handling middleware *after* `registerRoutes(...)` resolves, not before — Express only lets error middleware catch errors from handlers registered earlier in the stack.
- This whole approach requires zero changes to `package.json` — safe under Replit's "never edit package.json" rule.
