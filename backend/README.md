# TrainBot Backend

Node.js + Express + TypeScript + Prisma backend for TrainBot.

## Quickstart (local dev)

```bash
# 1. Install deps
npm install

# 2. Start Postgres
docker compose up -d

# 3. Copy .env example and generate secrets
cp .env.example .env
# Then edit .env and replace JWT_*_SECRET with random strings (`openssl rand -base64 64`)

# 4. Apply migrations
npm run db:migrate

# 5. Run dev server
npm run dev
```

API at http://localhost:3000. Health check: http://localhost:3000/health

## Scripts

- `npm run dev` — dev server with hot reload
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled server
- `npm run typecheck` — TS check without emit
- `npm run lint` — ESLint
- `npm run test` — unit tests (Vitest)
- `npm run test:integration` — integration tests (spawns Postgres in Docker via testcontainers)
- `npm run db:migrate` — apply pending migrations (dev mode)
- `npm run db:reset` — drop + recreate DB (DESTRUCTIVE, dev only)
- `npm run db:studio` — Prisma Studio GUI at http://localhost:5555
- `npm run admin:cli -- create-tenant` — interactive tenant + admin teacher creation
- `npm run admin:cli -- list-tenants` — list all tenants

## Folder layout

```
src/
├── app.ts                  # Express app factory
├── index.ts                # entry point
├── config/                 # env validation
├── lib/                    # cross-cutting (logger, db, errors)
├── middleware/             # auth, validate, rateLimit, errorHandler
├── modules/
│   ├── auth/               # signup/login/refresh/logout
│   ├── classes/            # teacher CRUD on classes
│   └── students/           # teacher CRUD on students
└── services/               # password (bcrypt), token (JWT)

scripts/                    # admin CLI
prisma/                     # schema + migrations
tests/
├── unit/
└── integration/
```

## API endpoints (Phase 1A)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/api/v1` | None | API metadata |
| POST | `/api/v1/auth/teacher/signup` | None | Create tenant + admin teacher |
| POST | `/api/v1/auth/teacher/login` | None | Teacher login |
| POST | `/api/v1/auth/student/login` | None | Student login (classCode + username + password) |
| POST | `/api/v1/auth/refresh` | Refresh token | Rotate tokens |
| POST | `/api/v1/auth/logout` | Refresh token | Revoke refresh token |
| GET | `/api/v1/teacher/classes` | JWT teacher | List classes |
| POST | `/api/v1/teacher/classes` | JWT teacher | Create class (server-generated code) |
| GET | `/api/v1/teacher/classes/:id` | JWT teacher | Get class with students |
| PATCH | `/api/v1/teacher/classes/:id` | JWT teacher | Update name/description |
| DELETE | `/api/v1/teacher/classes/:id` | JWT teacher | Archive class |
| POST | `/api/v1/teacher/classes/:id/students` | JWT teacher | Add student |
| POST | `/api/v1/teacher/classes/:id/students/bulk` | JWT teacher | Bulk add students |
| POST | `/api/v1/teacher/students/:id/reset-password` | JWT teacher | Reset student password (revokes refresh tokens) |
| DELETE | `/api/v1/teacher/students/:id` | JWT teacher | Delete student |

## Errors

All errors follow [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807) JSON:

```json
{
  "type": "https://trainbot.ro/errors/validation_error",
  "title": "Validation failed",
  "status": 400,
  "detail": "...",
  "instance": "/api/v1/auth/teacher/signup",
  "fields": { "email": ["Invalid email"] }
}
```

## Tests

- **Unit tests** (Vitest): 9 tests covering password + token services
- **Integration tests** (Vitest + testcontainers + supertest): 11 tests covering full auth + classes flows with isolated PostgreSQL container
- Rate limiting is automatically skipped when `NODE_ENV=test`

## Out of scope (future phases)

- ML projects/labels/images sync (Phase 2)
- Assignments + submissions (Phase 2)
- LLM proxy (Phase 3)
- File uploads to DO Spaces (Phase 2)
- Production deployment + CI/CD (Plan 1D)
- iOS auth integration (Plan 1B)
- Web teacher dashboard (Plan 1C)
