# QuickFix Client

React 19 + Vite 8 + Tailwind CSS 4 frontend for the QuickFix platform.

## Development

```bash
npm install
npm run dev          # starts Vite on http://localhost:5173
                     # proxies /api to http://localhost:5000
```

## Build

```bash
npm run build        # outputs static assets to dist/
npm run preview      # serves the production build locally
npm run lint         # runs ESLint
```

## Environment variables

See `.env.example`. All variables are optional:

- `VITE_API_URL` — base URL for API requests. Leave unset (`/api`) when the
  app is served behind a reverse proxy that forwards `/api` to the server.
  On Cloudflare Pages set it to the API origin, e.g. `https://api.quickfix.co.ls`.

## Deploying

The static `dist/` output is deployed via **Cloudflare Pages** (see the
repo's `wrangler.toml`, `public/_redirects` and `public/_headers`). Media
uploaded by users is never stored on the static host — it lives on the API
server and is served from `/uploads`. See the [repository README](../README.md)
for full deployment instructions.