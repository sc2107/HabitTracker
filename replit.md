# Habit Tracker

A mobile-first full-stack habit tracking web app. Users register, log daily habits, track streaks, view 30-day history, and see a progress dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session (cookie auth)
- DB: PostgreSQL + Drizzle ORM
- Auth: bcryptjs password hashing + express-session
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, wouter routing
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema: users.ts, habits.ts, habitEntries.ts
- `artifacts/api-server/src/routes/` — auth.ts, habits.ts, tracking.ts, dashboard.ts
- `artifacts/api-server/src/lib/habitUtils.ts` — streak calculation logic
- `artifacts/habit-tracker/src/` — React frontend

## Architecture decisions

- Cookie-based sessions (express-session) instead of JWT — simpler, no client-side token management
- bcryptjs (pure JS) instead of native bcrypt — avoids native build script issues in Replit
- Streak computed at query time from habit_entries — no denormalized streak column to keep in sync
- Unique constraint on (habit_id, completed_date) enforces one entry per habit per day at DB level
- Toggle completion: if entry exists → delete it (uncomplete), else insert it

## Product

- **Today tab**: All habits as cards, tap to toggle today's completion, streak badge per habit, FAB to add habits
- **History tab**: Select a habit, view a 30-day dot grid of completed days
- **Dashboard tab**: Completion ratio today, weekly count, per-habit streaks, weekly bar chart
- **Auth**: Register (name/email/password min 8 chars), Login, Logout — generic error messages

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` before touching backend or frontend
- `pnpm --filter @workspace/db run push` to apply DB schema changes in dev
- SESSION_SECRET must be set in environment secrets for sessions to work
- Streak logic: computed by walking backwards from today — see `habitUtils.ts`
