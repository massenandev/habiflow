# Habiflow

Habiflow is a full-stack mobile habit tracker for iOS and Android. Users create personalized habits, mark them done or undone, view recent progress and streaks, review habit history, switch themes, schedule local reminders, and export printable habit trackers as PDFs.

## Tech Stack

- **Monorepo:** pnpm workspaces
- **Backend:** NestJS, TypeScript, DDD/Clean Architecture, Prisma
- **Database:** PostgreSQL
- **Frontend:** Expo, React Native, TypeScript
- **Local services:** Docker Compose
- **Testing:** Vitest
- **API docs:** Swagger at `http://127.0.0.1:3001/docs`

## Project Structure

```txt
apps/
  api/       NestJS API, Prisma schema, backend tests
  mobile/    Expo React Native app, mobile tests
docker-compose.yml
pnpm-workspace.yaml
```

The backend and frontend are separated. The mobile app talks to the API over REST, while reminders and PDF sharing stay on-device because those are mobile-platform responsibilities.

## Getting Started

```sh
pnpm install
docker compose up --build -d
pnpm dev:mobile
```

Local URLs:

- API: `http://127.0.0.1:3001`
- Swagger: `http://127.0.0.1:3001/docs`
- Swagger JSON: `http://127.0.0.1:3001/docs-json`
- PostgreSQL host port: `5433`

Docker runs PostgreSQL and the API. The API runs `prisma db push` on startup so the local database schema matches `apps/api/prisma/schema.prisma`.

## Main Flows

- **Create habit:** mobile app collects optional emoji, name, color, streak goal, completions per day, and reminder count/times, then calls `POST /habits`.
- **Dashboard:** mobile app calls `GET /habits` with `deviceId`, `from`, and `to`, then renders `My Habits`.
- **Toggle done/undone:** tapping today’s indicator calls `POST /habits/:habitId/toggle`.
- **Edit/archive/delete:** edit screen calls `PATCH`, archive, or delete endpoints.
- **History/streaks:** API returns completion history and calculates streaks from persisted completions.
- **PDF export:** mobile app generates and shares a printable tracker locally.

## Commands

```sh
pnpm test
pnpm test:api
pnpm test:mobile
pnpm --filter @habiflow/api build
pnpm --filter @habiflow/mobile exec tsc --noEmit
docker compose ps
```

More details:

- Backend README: `apps/api/README.md`
- Frontend README: `apps/mobile/README.md`
