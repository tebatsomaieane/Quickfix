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
- `VITE_SHOW_DEMO` — set `true` to show the demo-account quick-login buttons.
  Defaults to `true` in development and `false` in production builds.

## Deploying

The static `dist/` output is served by nginx (or any static host). The nginx
config at the repository root forwards `/api` to the Node server. See the
[repository README](../README.md) for full deployment instructions.