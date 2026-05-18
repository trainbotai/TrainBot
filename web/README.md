# TrainBot Web Dashboard

React + Vite teacher dashboard for TrainBot.

## Quickstart

```bash
# 1. Install
npm install

# 2. Copy env (defaults to localhost:3000)
cp .env.example .env

# 3. Start backend separately (see ../backend/README.md on phase-1a-backend-core)

# 4. Start dev server
npm run dev
```

App runs at http://localhost:5173

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build
- `npm run lint` — TypeScript check
- `npm test` — Vitest unit tests (7 tests)
- `npm run test:watch` — Vitest watch mode

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (matches iOS brand palette)
- TanStack Query v5 for server state
- Zustand for auth state (persists across reloads via localStorage)
- React Router v6
- Vitest + Testing Library

## Routes

- `/login` — teacher login
- `/signup` — create new tenant + admin teacher
- `/` — dashboard (list classes)
- `/classes/:id` — class detail with students table

## Out of scope (future phases)

- Refresh token auto-rotation on 401 (Plan 1D)
- httpOnly cookie auth (Plan 1D — production deploy)
- Charts / analytics (Plan 2)
- Assignment management (Plan 2)
