<p align="center">
  <img src="./logo.svg" width="140" alt="auth-starter logo" />
</p>

<h1 align="center">auth-starter</h1>

<p align="center"><em>A JWT auth starter, so you don't have to relearn token rotation every time you start a project.</em></p>

---

Minimal, dependency-light authentication scaffold: access/refresh token rotation with family-based reuse detection, Argon2id password hashing, and per-route rate limiting. Express 5 + TypeScript + PostgreSQL, raw SQL, no ORM.

## Why

Because every new backend project needs the same JWT groundwork, and the interesting bugs live in the middleware, not in whatever domain object you're building this time round. This is that groundwork, decided once and reused every time.

## Tech Stack

- **Node.js** + **Express 5** + **TypeScript**
- **PostgreSQL** - via `pg`, raw SQL, no ORM
- **jsonwebtoken** - access + refresh token rotation with family-based reuse detection
- **Argon2id** (via `node:crypto`) - no extra hashing dependency
- **Zod** - request validation and startup environment validation
- **cors** - configurable via `ALLOWED_ORIGINS`, closed by default
- **pino** + **pino-http** - structured JSON logging with per-request IDs
- **In-memory rate limiting** - sliding window, per-route

## Endpoints

| Method | Route       | What it does          |
| ------ | ----------- | --------------------- |
| `POST` | `/register` | Create a user         |
| `POST` | `/login`    | Issue a token pair    |
| `POST` | `/refresh`  | Rotate tokens         |
| `GET`  | `/health`   | DB connectivity check |

<details>
<summary>Request/response examples</summary>

**`POST /register`**

```json
// Request
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "correct-horse-battery" }

// 201 Created
{ "accessToken": "eyJ...", "refreshToken": "b3xK..." }
```

**`POST /login`**

```json
// Request
{ "email": "ada@example.com", "password": "correct-horse-battery" }

// 200 OK
{ "accessToken": "eyJ...", "refreshToken": "b3xK..." }
```

**`POST /refresh`**

```json
// Request
{ "refreshToken": "b3xK..." }

// 200 OK
{ "accessToken": "eyJ...", "refreshToken": "n9Zp..." }
```

**`GET /health`**

```json
// 200 OK
{ "status": "ok" }

// 503 Service Unavailable
{ "error": "Service unavailable" }
```

Every error response (4xx/5xx) is shaped `{ "error": "<message>" }`.

</details>

Everything past this point is yours: mount your own routers behind the `authenticate` middleware and you're covered.

## Auth Flow

```
Register/Login → accessToken + refreshToken
  → Use accessToken in Authorization header on protected routes
  → accessToken expires → POST /refresh with refreshToken → new pair
```

Access tokens expire in 15 minutes. Refresh tokens expire in 7 days and rotate on each use. Reusing an old refresh token revokes the entire token family.

No token → `401 Unauthorized`. Invalid or reused refresh token → the whole family is revoked. Too many attempts → `429 Too Many Requests`.

## Rate Limiting

| Route             | Window | Max Requests | Key         |
| ------------------ | ------ | ------------- | ----------- |
| `POST /register`   | 1 min  | 5              | IP          |
| `POST /login`       | 1 min  | 5              | IP + email  |
| `POST /refresh`     | 1 min  | 10             | IP          |

Rate limit state is in-memory, which is fine for a single instance. If you ever run this behind more than one instance, swap in a shared store (Redis) before relying on it - in-memory limiters don't share state across processes.

## Logging

Structured JSON logs via `pino`, with `pino-http` attaching a per-request logger (`req.log`) and request ID to every request. `Authorization` and `Cookie` headers are redacted by default (`src/utils/logger.ts`).

Use `req.log` inside request handlers so log lines can be correlated back to the request that produced them; use the base `logger` export for anything outside a request (startup, background tasks).

## Getting Started

```bash
git clone https://github.com/FK78/auth-starter.git
cd auth-starter
npm install
```

Set up your environment:

```bash
cp .env.example .env
# Fill in your values:
#   PORT, HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
#   POSTGRES_PORT, ACCESS_TOKEN_SECRET
# Optional:
#   ALLOWED_ORIGINS - comma-separated list of origins allowed by CORS.
#   Leave unset to reject all cross-origin browser requests by default.
```

Environment variables are validated at startup with Zod (`src/config/env.ts`) - a missing or malformed value fails fast with a clear message instead of a cryptic error later.

Start the database:

```bash
docker compose up -d
```

Create tables (connect to Postgres and run the schema in `db/schema.sql`).

Start the server:

```bash
npm run dev
```

## Testing

Two tiers, run separately:

**Unit tests** (`npm test`) - fast, no Docker required. Mocks the DB layer (`vi.mock`) where needed; real Argon2 hashing and real JWT signing/verification run as-is, since faking those would be more work than just running them. Covers every middleware, service, and controller in isolation.

**Integration tests** (`npm run test:integration`) - zero mocks, hits a real throwaway Postgres instance. Covers what mocks structurally can't: real transactions, real rollback behaviour, and the actual refresh-token reuse-detection flow (register → rotate → reuse a spent token → confirm the whole family gets revoked).

```bash
npm run test:integration:db:up    # starts a disposable Postgres on port 55433
npm run test:integration          # runs *.integration.test.ts against it
npm run test:integration:db:down  # tears it down
```

The test database (`compose.test.yml`) is a separate Compose project from the dev one (`compose.yml`) - different name, different port, `tmpfs` storage so it never persists and never collides with your dev data.

## Project Structure

Test files (`*.test.ts` for unit tests, `*.integration.test.ts` for the real-DB
suite) are colocated next to the file they cover, not shown individually below.

```
auth-starter/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── health.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── health.service.ts
│   │   └── token.service.ts
│   ├── queries/
│   │   ├── auth.queries.ts
│   │   └── token.queries.ts
│   ├── routes/
│   │   ├── auth.router.ts
│   │   └── health.router.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validate.ts
│   ├── errors/
│   │   └── AppError.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── express.d.ts
│   │   └── tokens.ts
│   ├── utils/
│   │   ├── auth.ts
│   │   └── logger.ts
│   └── db/
│       ├── db.ts
│       └── testDb.ts
├── db/
│   └── schema.sql
├── compose.yml
├── compose.test.yml
├── vitest.config.ts
├── vitest.integration.config.ts
└── tsconfig.json
```

## Requirements

- Node.js 24+ (uses native `node:crypto` Argon2 and the `--env-file` flag)
- Docker (for PostgreSQL)
- One JWT secret, `ACCESS_TOKEN_SECRET` - refresh tokens are opaque random
  bytes, hashed before being stored in Postgres.

## Using This as a Template

Click **Use this template** above, or:

```bash
npx tiged FK78/auth-starter my-new-project
```

Then rename the package, drop your own domain routes behind `authenticate`, and build the thing you actually meant to build.

## License

MIT