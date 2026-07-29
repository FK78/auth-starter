<p align="center">
  <img src="./logo.svg" width="80" alt="auth-starter logo" />
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
- **In-memory rate limiting** - sliding window, per-route

## Endpoints

| Method | Route       | What it does        |
| ------ | ----------- | -------------------- |
| `POST` | `/register` | Create a user        |
| `POST` | `/login`    | Issue a token pair   |
| `POST` | `/refresh`  | Rotate tokens        |

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
#   PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
#   POSTGRES_PORT, HOST, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
```

Start the database:

```bash
docker compose up -d
```

Create tables (connect to Postgres and run the schema in `db/schema.sql`).

Start the server:

```bash
npm run dev
```

## Project Structure

```
auth-starter/
├── src/
│   ├── index.ts
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── token.service.ts
│   ├── queries/
│   │   ├── auth.queries.ts
│   │   └── token.queries.ts
│   ├── routes/
│   │   └── auth.router.ts
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
│   │   └── auth.ts
│   └── db/
│       └── db.ts
├── db/
│   └── schema.sql
├── compose.yml
└── tsconfig.json
```

## Requirements

- Node.js 26+ (uses native `node:crypto` Argon2 and the `--env-file` flag)
- Docker (for PostgreSQL)
- Two JWT secrets: one for access tokens, one for refresh tokens

## Using This as a Template

Click **Use this template** above, or:

```bash
npx tiged FK78/auth-starter my-new-project
```

Then rename the package, drop your own domain routes behind `authenticate`, and build the thing you actually meant to build.

## Credit

Extracted from [tudo](https://github.com/FK78/tudo), a todo API built as a solution to the [Todo List API](https://roadmap.sh/projects/todo-list-api) project on roadmap.sh.

## License

MIT