# Scarab Price Dashboard

This app shows poe.ninja exchange values for Scarabs using React, Vite, and React Query. A tiny Express proxy (see `../backend`) is required because poe.ninja does not send `Access-Control-Allow-Origin` headers.

## Development

1. Install dependencies
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Copy the sample environment file and adjust it if the proxy runs somewhere else.
   ```bash
   cd frontend
   cp .env.example .env
   ```
3. Start the proxy backend
   ```bash
   cd backend
   npm run dev
   ```
4. In another terminal, start the Vite dev server
   ```bash
   cd frontend
   npm run dev
   ```

The frontend reads the proxy URL from `VITE_API_URL`. By default it assumes `http://localhost:4000` when running on `localhost`.

## Production build

```bash
cd frontend
npm run build
```

Serve the generated `frontend/dist` folder with any static server and point `VITE_API_URL` to the deployed proxy host. The proxy exposes a single `GET /api/scarabs` route that forwards the JSON from poe.ninja and can be hosted anywhere that supports Node.js.