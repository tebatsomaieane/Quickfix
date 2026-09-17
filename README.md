# QuickFix — Service Marketplace Platform

QuickFix connects customers with verified local service providers. Customers
post requests, providers send competing offers, and the platform tracks the
entire lifecycle through jobs, messaging, reviews, and complaints.

| Role | Capabilities |
|------|-------------|
| **Customer** | Post service requests, evaluate offers, manage jobs, review providers |
| **Provider** | Offer on open requests, manage profile, services & availability |
| **Business Owner** | Create a business, manage products, advertisements & promotions |
| **Admin** | User management, complaint resolution, verification review |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | React 19, Vite 8, Tailwind CSS 4, Axios, React Router v7 |
| Server | Node.js 22+, Express 5, MySQL 8 (mysql2), Multer (media uploads) |
| Auth | JWT stored in httpOnly cookies (sameSite=lax, secure in prod) |
| Database | MySQL 8 with connection pooling |
| Deployment | Cloudflare Pages (frontend), Docker Compose / PM2 (API + DB) |

---

## Quick Start — Docker

```bash
git clone <repo-url> quickfix && cd quickfix

# Create your environment file (MUST set JWT_SECRET).
cp .env.example .env
#   Then open .env and replace JWT_SECRET with a real value.
#   Generate one:  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Build and start all services
docker compose up -d --build

# Open the app
open http://localhost      # client (nginx)
# API: http://localhost/api/health
```

Docker Compose starts three services: **client** (nginx), **server** (Node),
and **MySQL**. The database is auto-initialised from `database/schema.sql`
and seeded with `database/seed.sql`.

> **Seed data** is intentionally minimal: the only pre-created account is the
> **administrator**. Everyone else (customers, providers, business owners)
> registers themselves through the public sign-up page, so every person on
> the marketplace is a real, registered Basotho user.

### Initial Admin Account

| Field | Value |
|-------|-------|
| Email | `admin@quickfix.co.ls` |
| Phone | `+266 5779 9537` |
| Password | **(see seed.sql — change immediately after first login)** |

Log in with the admin account, then change the password from **Settings**.

### Useful Commands

```bash
docker compose ps                   # service status
docker compose logs -f server       # follow API logs
docker compose down                 # stop (data persists in the volume)
docker compose down -v              # stop + wipe the database volume
```

---

## Quick Start — Local Development

### Prerequisites

- Node.js 22+
- MySQL 8 running locally (or a Docker MySQL container)
- npm

### Server

```bash
cd server
cp .env.example .env                # edit with your MySQL credentials
npm install
# Initialise the database:
#   mysql -u root -p < ../database/schema.sql
#   mysql -u root -p quickfix < ../database/seed.sql
npm run dev                          # starts on http://localhost:5000
```

### Client

```bash
cd client
npm install
npm run dev                          # starts on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000` automatically.

---

## Deployment — Cloudflare Pages (frontend) + External API

Cloudflare Pages is a **static host with no persistent disk**, so it serves
only the React app. The API (and all uploaded media) must live on a separate
server that has durable storage (see the Docker Compose / PM2 sections).

Because the app and the API are on **different origins**, the session cookie
must be sent cross-site. Set these on the **API server** (e.g. in `.env`):

```bash
CLIENT_ORIGIN=https://quickfix.pages.dev,https://your-custom-domain
COOKIE_SAMESITE=none          # browsers require this for cross-site cookies
PUBLIC_API_URL=https://api.your-domain    # used for uploaded-media URLs
PUBLIC_APP_URL=https://quickfix.pages.dev # password-reset email links
```

Pick where the API runs:

**Self-hosted (Docker Compose)** — the compose `client` container (nginx) acts
as the API ingress and proxies both `/api/` and `/uploads/` to the Node server.
Point your API domain at that host behind TLS:

```bash
cp .env.example .env                # full values, incl. JWT_SECRET
docker compose up -d --build        # db + server + nginx ingress on :80
```

**Railway (no server to manage)** — see *Deploy the API (Railway)* below.

### Deploy the API (Railway)

The repo ships `server/Dockerfile` and `server/railway.json`, so the API builds
with no extra configuration. Railway also provides the MySQL database and a free
`*.up.railway.app` subdomain.

1. **railway.app → New Project → Deploy from GitHub repo → `Quickfix`.**
2. Open the service → **Settings → Source → Root Directory** = `server`.
3. **New → Database → MySQL** to add the database.
4. Service → **Variables → Raw Editor**, add:
   ```
   NODE_ENV=production
   JWT_SECRET=<48-char random hex>
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   CLIENT_ORIGIN=https://quickfix.pages.dev
   COOKIE_SAMESITE=none
   PUBLIC_API_URL=https://<your-service>.up.railway.app
   PUBLIC_APP_URL=https://quickfix.pages.dev
   ```
5. **Settings → Networking → Generate Domain** → that
   `https://<name>.up.railway.app` URL is your `VITE_API_URL`.
6. Add a **Volume** mounted at `/app/uploads` so uploaded media survives deploys.
7. Load the schema once (from the repo root, with the Railway CLI and a local
   MySQL client) — or paste `database/schema.sql` into the MySQL service's
   *Data → Query* tab:
   ```bash
   railway link      # select the project + service
   railway run sh -c 'mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql'
   railway run sh -c 'mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/seed.sql'
   ```
8. Set `VITE_API_URL` to that domain and redeploy the client.

> Free tiers that "sleep" (Render, Koyeb) provide Postgres rather than MySQL and
> no free persistent disk, so Railway's Hobby plan (~$5/mo) is the
> least-friction option for this stack.

### Deploy the client (GitHub Actions — recommended)

`.github/workflows/deploy.yml` builds `client/` and publishes `client/dist`
to the `quickfix` Pages project on every push to `main`. Pull requests run
lint + build only.

One-time setup:

1. Create an API token in **Cloudflare dashboard → My Profile → API Tokens**
   with the *Cloudflare Pages: Edit* permission, and copy the **Account ID**
   from the dashboard sidebar.
2. In GitHub → **Settings → Secrets and variables → Actions**:
   - *Secrets*: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - *Variables*: `VITE_API_URL` = `https://api.your-domain`
     (optional `CF_PAGES_PROJECT`, defaults to `quickfix`)
3. Push to `main` (or run the workflow manually). The first run creates the
   Pages project if it does not exist.
4. Add your custom domain under **Pages → quickfix → Custom domains**.

### Deploy the client (Cloudflare Git integration — alternative)

Instead of Actions, you can let Cloudflare build from GitHub directly:
**Workers & Pages → Create → Pages → Connect to Git**, pick this repository,
then set framework preset **Vite**, build command
`npm --prefix client ci && npm --prefix client run build`, output directory
`client/dist`, and environment variable `VITE_API_URL`.

Use **one** automatic deployment path. If Cloudflare's Git integration is
enabled, remove/disable the push trigger in `.github/workflows/deploy.yml`
so each push does not deploy twice.

### Deploy the client (local one-off)

```bash
cd client
npm ci
VITE_API_URL=https://api.your-domain npm run build   # or set it in client/.env
npx wrangler login                                   # once
npm run deploy                                       # deploys dist/
```

The repo ships `wrangler.toml`, `client/public/_redirects` (SPA fallback),
`client/public/_headers` (security headers) and `.nvmrc` already configured.

---

## Media Uploads

All photos and videos are **uploaded by real users** and stored on the API
server's disk (persisted with a Docker volume / server filesystem):

- `POST /api/uploads` — upload one image or video (multipart field `file`,
  max 50 MB, authenticated). Returns `{ url, filename, size, mimeType, kind }`.
- Uploaded files are served from `/uploads/...`, and reference URLs use
  `PUBLIC_API_URL` when set (important behind a proxy/CDN).
- Request attachments are persisted in `request_attachments` and shown to
  both the customer and offering providers.

There is **no stock photography anywhere** in the app. Until a user uploads
their own photo, the UI shows a branded gradient or their initials instead.

---

## Quick Start — PM2 (Standalone)

For traditional Linux/VPS deployment without Docker:

```bash
# 1. Initialise the MySQL database
chmod +x deploy/init-db.sh
./deploy/init-db.sh                  # or --without-seed

# 2. Install server dependencies and start with PM2
cd server
cp .env.example .env                 # edit with real values
npm ci --omit=dev
npm i -g pm2
pm2 start ecosystem.config.js --env production
pm2 save

# 3. Build and serve the client
cd ../client
npm ci
npm run build
# Serve dist/ with nginx or any static file server.
```

See `deploy/deploy.sh` (or `deploy.ps1` on Windows) for the Docker workflow.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | — | Long random string for signing JWTs (min 32 chars) |
| `DB_HOST` | No | `localhost` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | No | — | MySQL user |
| `DB_PASSWORD` | No | — | MySQL password |
| `DB_NAME` | No | `quickfix` | MySQL database name |
| `PORT` | No | `5000` | API server listen port |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated CORS origins |
| `COOKIE_SAMESITE` | No | `lax` | Session cookie SameSite; use `none` when the frontend is on another origin |
| `LOG_FORMAT` | No | `combined` | Morgan log format |
| `PUBLIC_API_URL` | No | derived from request | Absolute base used when building uploaded-file URLs |
| `PUBLIC_APP_URL` | No | `CLIENT_ORIGIN` | Frontend origin used in password-reset email links |

### Client (`client/.env`, build-time)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL (set if API is on a different origin, e.g. Cloudflare Pages) |

### Docker Compose (`.env` at root)

See `.env.example` — covers MySQL credentials, `JWT_SECRET`, public
port, `COOKIE_SAMESITE`, public URLs, and client build args.

---

## Project Structure

```
quickfix/
├── client/            React frontend
│   ├── src/
│   │   ├── components/   shared UI components
│   │   ├── context/      React Context providers
│   │   ├── pages/        route pages (public, customer, provider, business, admin)
│   │   ├── services/     API client and service functions
│   │   └── layouts/      layout shells (public, dashboard)
│   └── nginx.conf        production nginx config (Docker)
│
├── server/            Express API
│   ├── config/           DB connection pool
│   ├── controllers/      route handlers
│   ├── middleware/        auth (JWT), rate limiting
│   ├── routes/           express Router definitions
│   ├── uploads/          user-uploaded media (runtime, git-ignored)
│   ├── utils/            helpers (notifications, profile resolvers)
│   ├── Dockerfile        production image (build context: server/)
│   └── railway.json      Railway service config
│
├── database/
│   ├── schema.sql        full DDL (23 tables, indexes, constraints)
│   └── seed.sql          minimal production seed (admin + catalogue)
│
├── deploy/
│   ├── deploy.sh         Docker Compose launcher (Linux)
│   ├── deploy.ps1        Docker Compose launcher (Windows)
│   └── init-db.sh        MySQL initialiser (non-Docker)
│
├── .github/workflows/
│   └── deploy.yml        CI: build + deploy client to Cloudflare Pages
│
├── docker-compose.yml
├── wrangler.toml           Cloudflare Pages configuration
├── .nvmrc                  Node version for Cloudflare / CI builds
├── .env.example            compose environment template
└── README.md
```

---

## API Overview

All API routes are prefixed with `/api`. Responses follow the format:

```json
{ "success": true, "data": {}, "message": "..." }
```

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account (CUSTOMER/PROVIDER/BUSINESS_OWNER) |
| POST | `/api/auth/login` | — | Login (sets httpOnly session cookie + token in body) |
| GET | `/api/auth/me` | ✔ | Current user profile |
| PATCH | `/api/auth/profile` | ✔ | Update own profile |
| POST | `/api/auth/logout` | — | Clear session |
| POST | `/api/auth/change-password` | ✔ | Change password (requires current password) |
| POST | `/api/auth/forgot-password` | — | Request password reset token |
| POST | `/api/auth/reset-password` | — | Reset password with token |

### Services & Categories (public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List active categories |
| GET | `/api/categories/:id` | Category with its services |
| GET | `/api/services` | List/search services |
| GET | `/api/services/:id` | Service details |

### Providers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/providers` | — | Public provider directory (search/filter) |
| GET | `/api/providers/:id` | — | Provider profile, services, reviews |
| GET | `/api/providers/me` | ✔ PROVIDER | Own full profile |
| PATCH | `/api/providers/me` | ✔ PROVIDER | Update own profile |
| PUT | `/api/providers/me/services` | ✔ PROVIDER | Replace offered services |
| PUT | `/api/providers/me/availability` | ✔ PROVIDER | Replace availability schedule |

### Service Requests
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/provider/requests` | ✔ PROVIDER | Browse open requests to bid on |
| GET | `/api/provider/requests/:id` | ✔ PROVIDER | Request detail + own existing offer |
| GET | `/api/requests` | ✔ CUSTOMER | Own requests with offer counts |
| POST | `/api/requests` | ✔ CUSTOMER | Post a new service request |
| GET | `/api/requests/:id` | ✔ CUSTOMER | Request detail + offers + jobs |
| POST | `/api/requests/:id/cancel` | ✔ CUSTOMER | Cancel open request (notifies providers) |

### Offers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/offers/my` | ✔ PROVIDER | Own offers |
| POST | `/api/offers` | ✔ PROVIDER | Submit offer on a request |
| PUT | `/api/offers/:id` | ✔ PROVIDER | Edit own pending offer |
| POST | `/api/offers/:id/withdraw` | ✔ PROVIDER | Withdraw own pending offer |
| POST | `/api/offers/:id/accept` | ✔ CUSTOMER | Accept offer → creates job |

### Jobs
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/jobs/my` | ✔ | Jobs where user is customer or provider |
| GET | `/api/jobs/:id` | ✔ | Job detail |
| POST | `/api/jobs/:id/start` | ✔ PROVIDER | Start an assigned job |
| POST | `/api/jobs/:id/complete` | ✔ PROVIDER | Mark job complete |

### Messaging & Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/conversations/my` | ✔ | Conversations with unread counts |
| POST | `/api/conversations` | ✔ | Create/find conversation for a request |
| POST | `/api/conversations/:id/messages` | ✔ | Send message |
| GET | `/api/notifications/my` | ✔ | Notifications + unread count |
| POST | `/api/notifications/read` | ✔ | Mark all as read |

### Reviews & Complaints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reviews` | ✔ CUSTOMER | Submit review on completed job |
| POST | `/api/reviews/:id/respond` | ✔ PROVIDER | Respond to review |
| POST | `/api/complaints` | ✔ | File complaint |
| GET | `/api/complaints/my` | ✔ | Own complaints |

### Marketplace (mostly public)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/market/promotions` | — | Active promotions |
| GET | `/api/market/advertisements` | — | Active advertisements |
| GET | `/api/market/overview` | — | Trust statistics |
| GET | `/api/market/summary` | ✔ | Dashboard counts |

### Business Owner
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/business/profile` | ✔ | Own business profile |
| PUT | `/api/business/profile` | ✔ | Update business profile |
| CRUD | `/api/business/products` | ✔ | Product management |
| CRUD | `/api/business/advertisements` | ✔ | Advertisement management |
| CRUD | `/api/business/promotions` | ✔ | Promotion management |
| GET | `/api/business/analytics` | ✔ | Business statistics |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/stats` | ✔ ADMIN | Platform statistics |
| GET | `/api/admin/users` | ✔ ADMIN | User management |
| PATCH | `/api/admin/users/:id` | ✔ ADMIN | Toggle active/role |
| PATCH | `/api/admin/complaints/:id` | ✔ ADMIN | Update complaint |
| PATCH | `/api/admin/verification/:id` | ✔ ADMIN | Approve/reject provider |
| PATCH | `/api/admin/businesses/:id` | ✔ ADMIN | Business verification |
| GET | `/api/admin/advertisements` | ✔ ADMIN | All advertisements |
| PATCH | `/api/admin/advertisements/:id` | ✔ ADMIN | Approve/reject/pause |
| GET | `/api/admin/promotions` | ✔ ADMIN | All promotions |
| PATCH | `/api/admin/promotions/:id` | ✔ ADMIN | Approve/reject/pause |

### Health Check
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server status + timestamp |
| GET | `/` | Service name + uptime |

### Media Uploads
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/uploads` | ✔ | Upload one image/video (multipart `file`, max 50 MB) |
| GET | `/uploads/*` | — | Static hosting of uploaded media |

---

## Security Notes

- **JWT_SECRET** must be a random string (≥ 32 characters). The server
  refuses to start with a missing or placeholder secret.
- Passwords are hashed with bcrypt (10 rounds).
- The session is an **httpOnly cookie** (`sameSite=lax`, `secure` in
  production). This provides CSRF protection for most browser flows.
- Rate limiting is applied to authentication endpoints (in-memory
  sliding window; exempt on loopback in dev).
- Helmet adds security headers (HSTS, nosniff, X-Frame-Options, etc.).
- Business advertisements and promotions default to **PENDING** status;
  only admins may approve them for public visibility.
- Password-reset tokens are hashed in storage and never leaked through the
  API; they are delivered by email in a real deployment.

---

## Contact

For support or business enquiries:
- Phone / WhatsApp: **+266 5779 9537**
- Email: support@quickfix.co.ls
- Location: Maseru, Lesotho

---

## License

ISC