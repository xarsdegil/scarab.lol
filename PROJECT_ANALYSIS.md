# Project Analysis & Architecture

## Overview
Scarab Regex is split into a lightweight Express proxy in `backend/` and a Vite + React UI in `frontend/`. The backend shields the Poe.ninja Economy API from browser CORS limits, normalises the payload, and exposes a single `/api/scarabs` endpoint. The frontend consumes this endpoint, filters the scarabs by chaos price, generates a combined regex string from lookup data (`src/regexMap.ts`), and renders the dashboard that includes selection controls, regex output, and a responsive card grid.

## Key Technologies
- **Backend:** Node.js 22+, Express 4, CORS middleware. No database; state is ephemeral and driven by Poe.ninja responses.
- **Frontend:** React 19 with TypeScript, Vite build tool, TanStack React Query for data fetching/caching, custom CSS for styling. Clipboard API powers the Copy Regex button.
- **Data Source:** Poe.ninja Economy Exchange API (league `Keepers`, type `Scarab`), proxied to avoid exposing the Poe.ninja key or facing rate/CORS issues.

## Backend Flow (`backend/src/server.js`)
1. `express()` server listens on `PORT` (default 4000) with CORS configured via `ALLOWED_ORIGIN` env var.
2. `GET /healthz` returns `{ status: 'ok' }` for uptime checks.
3. `GET /api/scarabs` forwards `league`/`type` params to Poe.ninja, validates the upstream result, normalises icon URLs, trade volume, chaos/divine values, and sparkline data, then caches the response for 60 seconds via `Cache-Control`.
4. Errors bubble up with HTTP 5xx codes so the frontend can display retry actions.

## Frontend Flow (`frontend/src`)
1. `useScarabPrices` uses React Query to poll `/api/scarabs` every 5 minutes, sorts results by `chaosValue`, and hands them to `App`.
2. `App.tsx` keeps local state for price range, checkbox selections, and clipboard status. Scarabs are filtered on the client to match the chosen chaos range.
3. Regex generation: `regexMap.ts` loads `src/data/scarabRegex.json`, maps Poe.ninja `detailsId` to regex snippets, and joins enabled entries with pattern1|pattern2. A hard limit of 300 characters warns the user before the regex grows too long.
4. UI: the price inputs and card grid sit in responsive CSS panels; the footer exposes contact email + social handle via `VITE_CONTACT_*` env vars.

## Configuration & Env Vars
- **Backend:** `PORT`, `ALLOWED_ORIGIN`.
- **Frontend:** `VITE_API_URL` (defaults to `http://localhost:4000` when running locally), `VITE_CONTACT_EMAIL`, `VITE_CONTACT_SOCIAL_LABEL`, `VITE_CONTACT_SOCIAL_URL`.
- **Regex data:** maintained in `frontend/src/data/scarabRegex.json`; shared types live in `frontend/src/types.ts`.

## Local Development Workflow
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```
The frontend dev server proxies API calls to `VITE_API_URL`. Run both apps simultaneously to mirror production behaviour.

## Deployment Notes
- Containerise the backend (Express + fetch) and host on a free Node-friendly platform (Render, Railway, Fly). Ensure `ALLOWED_ORIGIN` matches the deployed frontend domain.
- Build the frontend with `npm run build` and deploy the `frontend/dist/` assets to a static host (Vercel, Netlify, GitHub Pages). Set `VITE_API_URL` to the deployed backend URL during the build step.
- Because React Query already caches data and the backend sets short cache headers, no additional stateful infrastructure is required.

### Google Cloud Run quick start
1. From the `backend/` directory run `gcloud builds submit --tag gcr.io/<project-id>/scarab-regex-backend`.
2. Deploy with `gcloud run deploy scarab-regex-backend --image gcr.io/<project-id>/scarab-regex-backend --platform managed --allow-unauthenticated`.
3. Set environment variables (`PORT` is provided by Cloud Run, add `ALLOWED_ORIGIN`) via `gcloud run services update` or the console.
4. Point `VITE_API_URL` to the Cloud Run service URL when building the frontend.
