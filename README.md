# Payment Notification Service

A production-grade backend service that receives and processes Paystack payment webhooks, stores transaction records, sends email notifications, and exposes a JWT-protected dashboard with an SSR UI.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Fastify
- **Database:** PostgreSQL 18
- **ORM:** Drizzle ORM
- **Auth:** JWT with refresh token rotation
- **Email:** Resend
- **Validation:** Zod
- **Infrastructure:** Docker + Docker Compose

## Features

- Paystack webhook ingestion with HMAC-SHA512 signature verification
- Payment initialization and verification via Paystack API
- Idempotent transaction storage — duplicate webhooks are safely ignored
- Email notifications on successful payments via Resend
- Notification records stored with outbox pattern — no notification is silently lost
- JWT authentication with short-lived access tokens (15min) and rotating refresh tokens (7 days)
- Refresh token hashed before storage — protects against database compromise
- Stolen token detection — replayed refresh tokens immediately invalidate the session
- Protected dashboard route with pagination
- SSR dashboard UI built with EJS
- Input validation with Zod on all routes
- Structured logging with Pino on all controllers
- CORS and rate limiting on auth routes
- Health check endpoint for deployment monitoring
- Fully Dockerized with health checks and persistent volumes

## Project Structure

```
src/
  routes/         — URL registration
  controllers/    — HTTP request/response handling
  services/       — Business logic
  middleware/     — JWT authentication
  validators/     — Zod input validation schemas
  templates/      — Email HTML templates
  config/         — Centralised configuration
  db/             — Drizzle schema and connection
  types/          — TypeScript type declarations
views/
  login.ejs       — Admin login page
  dashboard.ejs   — Transactions dashboard
```

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 22+
- pnpm

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_URL=
PAYSTACK_SECRET_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
NODE_ENV=
RESEND_API_KEY=
TEST_EMAIL=
ALLOWED_ORIGIN=
```

Generate JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Running Locally

**Start the database:**

```bash
pnpm docker:up
```

**Run migrations:**

```bash
pnpm db:migrate
```

**Start the dev server:**

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

### Running with Docker

```bash
pnpm docker:up:build
```

### Creating an Admin Account

Registration is intentionally restricted to the API. Create your admin account once:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yourdomain.com", "password": "yourpassword"}'
```

Then visit `http://localhost:3000/login` to access the dashboard.

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register admin user | No |
| POST | `/api/auth/login` | Login and receive tokens | No |
| POST | `/api/auth/refresh` | Rotate refresh token | No |
| POST | `/api/auth/logout` | Logout and clear session | Yes |

### Webhook

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/webhook` | Receive Paystack webhook events | No (HMAC verified) |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/initialize` | Initialize a Paystack payment | No |
| GET | `/api/payments/verify/:reference` | Verify a payment by reference | No |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/transactions` | Get paginated transactions | Yes |

### UI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | Admin login page |
| GET | `/dashboard` | SSR transactions dashboard |
| GET | `/logout` | Clear session and redirect to login |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server and database health check |

### Pagination

```
GET /api/dashboard/transactions?page=1&limit=10
```

## Testing

### Testing the Webhook

1. Install ngrok and run `ngrok http 3000`
2. Copy the ngrok URL into your Paystack dashboard under Settings → API Keys & Webhooks → Test Webhook URL
3. Create a payment page on Paystack and complete a test payment
4. Confirm the transaction appears in your database and a notification email is sent

Test card details:

```
Card number: 4084 0840 8408 4081
Expiry: 01/99
CVV: 408
PIN: 0000
OTP: 123456
```

### Testing Payment Initialization

```bash
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "amount": 50000}'
```

Returns an `authorization_url` — open it in the browser to complete the payment.

### Verifying a Payment

```bash
curl http://localhost:3000/api/payments/verify/YOUR_REFERENCE
```

### Testing Auth with curl

**Register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Get transactions:**

```bash
curl -X GET "http://localhost:3000/api/dashboard/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Refresh token:**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  --cookie "refreshToken=YOUR_REFRESH_TOKEN"
```

**Logout:**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Scripts

### Database

```bash
pnpm db:generate   # generate migrations from schema changes
pnpm db:migrate    # apply migrations to database
pnpm db:studio     # open Drizzle Studio in browser
```

### Docker

```bash
pnpm docker:up          # start containers
pnpm docker:up:build    # start containers and rebuild images
pnpm docker:down        # stop containers
pnpm docker:down:v      # stop containers and wipe volumes
```

## Security Decisions

- **HMAC-SHA512** — Paystack webhook signature verified with `crypto.timingSafeEqual` to prevent timing attacks
- **Idempotency** — unique constraint on `paystack_reference` at the database level prevents duplicate transaction records
- **Refresh token hashing** — refresh tokens stored as SHA-256 hashes, raw tokens never persisted
- **Token rotation** — each refresh burns the old token and issues a new one
- **Stolen token detection** — replayed refresh tokens immediately null the session and force re-login
- **httpOnly cookies** — refresh tokens stored in httpOnly cookies, inaccessible to JavaScript
- **Rate limiting** — auth routes limited to 5 requests per minute to prevent brute force
- **CORS** — restricted to configured allowed origins
- **Input validation** — all routes validated with Zod before touching business logic

## Notes

- Amounts are stored in kobo (Paystack's smallest currency unit). Divide by 100 to get naira.
- Email notifications in development mode are sent to `TEST_EMAIL`. Verify a domain on Resend for production sends.
- Admin registration is API-only by design — the dashboard is not publicly accessible.