<p align="center">
  <img src="./logo.svg" alt="tudo logo" width="150" />
</p>

<h1 align="center">tudo</h1>

<p align="center">
  <em>A todo API with auth, because your tasks deserve security even if your passwords don't.</em>
</p>

<p align="center">
  RESTful API with JWT authentication, pagination, and the audacity to tell you you're unauthorized.
</p>

---

## Why?

Because todo apps are the "Hello World" of backend development. But this one has login, tokens, and will actually judge you for not finishing your tasks.

## Tech Stack

- **Node.js** + **Express 5** + **TypeScript** — type-safe productivity guilt
- **PostgreSQL** — running in Docker, storing your procrastination
- **pg** — raw SQL, still no ORM
- **JWT** — so strangers can't see your embarrassing task list
- **bcrypt** — because "password123" shouldn't be stored in plain text

## Endpoints

### Auth

| Method | Route | What it does |
|--------|-------|-------------|
| `POST` | `/register` | Join the productivity cult |
| `POST` | `/login` | Prove you're you |

### Todos (authenticated)

| Method | Route | What it does |
|--------|-------|-------------|
| `POST` | `/todos` | Add another thing you won't do |
| `GET` | `/todos?page=1&limit=10` | Confront your backlog, paginated |
| `PUT` | `/todos/:id` | Pretend you're making progress |
| `DELETE` | `/todos/:id` | Acceptance is a stage of grief |

## Auth Flow

```
Register/Login → Get token → Send token in Authorization header → Access your todos
```

No token? `401 Unauthorized`. Not your todo? `403 Forbidden`. Simple rules.

## Response Examples

**Registration/Login:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Get Todos (paginated):**
```json
{
  "data": [
    {
      "id": 1,
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
# Fill in your Postgres credentials and JWT secret
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
doit/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── authRouter.ts
│   │   └── todosRouter.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── todosController.ts
│   ├── queries/
│   │   ├── userQueries.ts
│   │   └── todoQueries.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   └── validate.ts
│   └── db/
│       └── db.ts
├── db/
│   └── schema.sql
├── compose.yml
└── tsconfig.json
```

## Requirements

- Node.js 18+
- Docker (for PostgreSQL)
- A JWT secret (longer than your attention span)

## Credit

Built as a solution to the [Todo List API](https://roadmap.sh/projects/todo-list-api) project on roadmap.sh.

## License

MIT — fork it, finish it, or don't. I'm not your todo list.
