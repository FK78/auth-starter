<p align="center">
  <img src="./logo.svg" alt="tudo logo" width="150" />
</p>

<h1 align="center">tudo</h1>

<p align="center">
  <em>A todo API with auth, because your tasks deserve security even if your passwords don't.</em>
</p>

<p align="center">
  RESTful API with JWT access/refresh token rotation, pagination, sorting, filtering, and the audacity to tell you you're unauthorized.
</p>

---

## Why?

Because todo apps are the "Hello World" of backend development. But this one has login, token rotation, and will actually judge you for not finishing your tasks.

## Tech Stack

- **Node.js** + **Express 5** + **TypeScript** - type-safe productivity guilt
- **PostgreSQL** - running in Docker, storing your procrastination
- **pg** - raw SQL, no ORM
- **jsonwebtoken** - access + refresh token rotation with family-based reuse detection
- **Argon2id** (via `node:crypto`) - because "password123" shouldn't be stored in plain text

## Endpoints

### Auth

| Method | Route | What it does |
|--------|-------|-------------|
| `POST` | `/register` | Join the productivity cult |
| `POST` | `/login` | Prove you're you |
| `POST` | `/refresh` | Rotate your tokens like a responsible adult |

### Todos (authenticated)

| Method | Route | What it does |
|--------|-------|-------------|
| `POST` | `/todos` | Add another thing you won't do |
| `GET` | `/todos` | Confront your backlog, paginated |
| `PUT` | `/todos/:id` | Pretend you're making progress |
| `DELETE` | `/todos/:id` | Acceptance is a stage of grief |

#### GET /todos query parameters

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `1` (max `100`) | Items per page |
| `sort` | `created_at` | Sort by `created_at` or `title` |
| `order` | `asc` | Sort direction: `asc` or `desc` |
| `title` | - | Filter by title (partial match) |
| `description` | - | Filter by description (partial match) |

## Auth Flow

```
Register/Login → Get accessToken + refreshToken
  → Use accessToken in Authorization header → Access your todos
  → When accessToken expires → POST /refresh with refreshToken → Get new pair
```

Access tokens expire in 15 minutes. Refresh tokens expire in 7 days and rotate on each use. Reuse of an old refresh token revokes the entire token family.

No token? `401 Unauthorized`. Not your todo? `403 Forbidden`. Simple rules.

## Response Examples

**Registration/Login:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Get Todos (paginated):**

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
| `200` | Here's your stuff |
| `201` | Created. You're welcome. |
| `204` | Deleted. Gone. Poof. |
| `400` | You sent garbage. Try again. |
| `401` | Who are you? Log in first. |
| `403` | Nice try. That's not yours. |
| `404` | Doesn't exist. Never did. (Maybe.) |
| `409` | Already exists. You're not that original. |
| `500` | Something broke. Not your fault. (Probably.) |

## Getting Started

```bash
git clone https://github.com/FK78/tudo.git
cd tudo
npm install
```

Set up your environment:

```bash
cp .env.example .env
# Fill in your values:
#   TUDO_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
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
tudo/
├── src/
│   ├── index.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── todoController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── todoService.ts
│   │   └── tokenService.ts
│   ├── queries/
│   │   ├── authQueries.ts
│   │   ├── todoQueries.ts
│   │   └── tokenQueries.ts
│   ├── routes/
│   │   ├── authRouter.ts
│   │   └── todoRouter.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── errors/
│   │   └── AppError.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── express.d.ts
│   │   ├── todos.ts
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

- Node.js 26+ (uses `node:crypto` Argon2 and `--env-file` flag)
- Docker (for PostgreSQL)
- Two JWT secrets: one for access tokens, one for refresh tokens

## Credit

Built as a solution to the [Todo List API](https://roadmap.sh/projects/todo-list-api) project on roadmap.sh.

## License

MIT - fork it, finish it, or don't. I'm not your todo list.
