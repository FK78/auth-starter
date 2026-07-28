<p align="center">
  <img src="./logo.svg" alt="tudo logo" width="150" />
</p>

<h1 align="center">tudo</h1>

<p align="center">
  A secure, production-ready todo API with full authentication and token management.
</p>

<p align="center">
  RESTful API · JWT access/refresh token rotation · Rate limiting · Pagination · Filtering & sorting
</p>

---

## Overview

tudo is a RESTful todo API built with Express 5 and TypeScript. It implements JWT-based authentication with refresh token rotation and family-based reuse detection, per-route rate limiting, and paginated/filterable todo management with per-user ownership enforcement.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 26+ |
| Framework | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL (via Docker) |
| DB Driver | pg (raw SQL, no ORM) |
| Auth | JWT access + refresh tokens with rotation |
| Hashing | Argon2id (native `node:crypto`) |
| Rate Limiting | In-memory sliding window |

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive token pair |
| `POST` | `/refresh` | Rotate tokens using a valid refresh token |

### Todos (requires authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/todos` | Create a new todo |
| `GET` | `/todos` | List todos with pagination, sorting, and filtering |
| `PUT` | `/todos/:id` | Update a todo by ID |
| `DELETE` | `/todos/:id` | Delete a todo by ID |

#### Query Parameters for `GET /todos`

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `1` (max `100`) | Items per page |
| `sort` | `created_at` | Sort field: `created_at` or `title` |
| `order` | `asc` | Sort direction: `asc` or `desc` |
| `title` | - | Filter by title (partial match) |
| `description` | - | Filter by description (partial match) |

## Authentication Flow

```
Register/Login → accessToken + refreshToken
  → accessToken in Authorization header → Access protected routes
  → On expiry → POST /refresh with refreshToken → New token pair
```

- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days** and rotate on each use
- Reuse of a previously rotated refresh token revokes the entire token family

## Rate Limiting

All routes are protected with an in-memory sliding window rate limiter:

| Route | Window | Max Requests | Key |
|-------|--------|-------------|-----|
| `POST /register` | 1 min | 5 | IP |
| `POST /login` | 1 min | 5 | IP + email |
| `POST /refresh` | 1 min | 10 | IP |
| Todo routes | 1 hour | 100 | User ID (fallback: IP) |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` (on 429).

## Response Format

**Authentication response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Paginated todo list:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Buy groceries",
      "description": "Buy milk, eggs, and bread"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `204` | Resource deleted |
| `400` | Invalid request body or parameters |
| `401` | Missing or invalid authentication |
| `403` | Forbidden - resource belongs to another user |
| `404` | Resource not found |
| `409` | Conflict - resource already exists |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

## Getting Started

### Prerequisites

- Node.js 26+ (uses native `node:crypto` Argon2 and `--env-file` flag)
- Docker (for PostgreSQL)

### Installation

```bash
git clone https://github.com/FK78/tudo.git
cd tudo
npm install
```

### Configuration

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `TUDO_PORT` | Server port |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `POSTGRES_PORT` | Database port |
| `HOST` | Database host |
| `ACCESS_TOKEN_SECRET` | JWT signing secret for access tokens |
| `REFRESH_TOKEN_SECRET` | JWT signing secret for refresh tokens |

### Running

```bash
# Start PostgreSQL
docker compose up -d

# Apply schema (connect to Postgres and run db/schema.sql)

# Start development server
npm run dev
```

## Project Structure

```
src/
├── index.ts                 # Application entry point
├── controllers/             # Request handlers
├── services/                # Business logic
├── queries/                 # Database queries
├── routes/                  # Route definitions
├── middleware/              # Auth, validation, rate limiting, error handling
├── errors/                  # Custom error classes
├── types/                   # TypeScript type definitions
├── utils/                   # Shared utilities
└── db/                      # Database connection
```

## Credit

Built as a solution to the [Todo List API](https://roadmap.sh/projects/todo-list-api) project on roadmap.sh.

## License

MIT
