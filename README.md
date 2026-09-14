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
| Server | Node.js 22+, Express 5, MySQL 8 (mysql2) |
| Auth | JWT stored in httpOnly cookies (sameSite=lax, secure in prod) |
| Database | MySQL 8 with connection pooling |
| Deployment | Docker Compose, nginx reverse proxy, PM2 (alternative) |

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
| `LOG_FORMAT` | No | `combined` | Morgan log format |
| `RETURN_RESET_TOKEN` | No | `false` | Expose reset tokens in API (demo only) |

### Client (`client/.env`, build-time)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL (set if API is on a different origin) |
| `VITE_SHOW_DEMO` | `false` | Show demo quick-login buttons (dev: `true`, prod: `false`) |

### Docker Compose (`.env` at root)

See `.env.example` — covers MySQL credentials, `JWT_SECRET`, public
port, and client build args.

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
│   └── nginx.conf        production nginx config
│
├── server/            Express API
│   ├── config/           DB connection pool
│   ├── controllers/      route handlers
│   ├── middleware/        auth (JWT), rate limiting
│   ├── routes/           express Router definitions
│   └── utils/            helpers (notifications, profile resolvers)
│
├── database/
│   ├── schema.sql        full DDL (23 tables, indexes, constraints)
│   └── seed.sql          demo data for development
│
├── deploy/
│   ├── deploy.sh         Docker Compose launcher (Linux)
│   ├── deploy.ps1        Docker Compose launcher (Windows)
│   └── init-db.sh        MySQL initialiser (non-Docker)
│
├── docker-compose.yml
├── .env.example          compose environment template
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
- The password-reset API never reveals the reset token in production.
  Tokens must be delivered by email in a real deployment.

---

## License

ISC