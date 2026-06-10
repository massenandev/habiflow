# Habiflow API

The Habiflow API is a NestJS backend that owns habit persistence, completion state, history, validation, and streak calculation. It uses PostgreSQL through Prisma and exposes a REST API consumed by the Expo mobile app.

## Tech Stack

- NestJS 10
- TypeScript
- Prisma Client
- PostgreSQL
- Swagger / OpenAPI
- Vitest
- Docker Compose for local runtime

## Architecture

The API follows DDD and Clean Architecture boundaries:

```txt
src/
  domain/          Entities, value validation, domain errors, streak service
  application/     Use-case service and repository ports
  infrastructure/  Prisma service and Prisma repository implementation
  presentation/    Controllers, DTOs, HTTP error filter
  main.ts          Nest bootstrap and Swagger setup
prisma/
  schema.prisma    PostgreSQL data model
test/
  *.test.ts        Unit tests and test repository double
```

The runtime repository is Prisma-backed. `test/in-memory-habit.repository.ts` is only a unit-test double and is not used by the application module.

## Getting Started

From the repository root:

```sh
pnpm install
docker compose up --build -d
```

API URLs:

- API base: `http://127.0.0.1:3001`
- Health: `http://127.0.0.1:3001/health`
- Swagger UI: `http://127.0.0.1:3001/docs`
- OpenAPI JSON: `http://127.0.0.1:3001/docs-json`

Useful commands:

```sh
pnpm --filter @habiflow/api dev
pnpm --filter @habiflow/api build
pnpm --filter @habiflow/api test
pnpm --filter @habiflow/api db:generate
pnpm --filter @habiflow/api db:push
```

## Database

Docker provides PostgreSQL:

- Container host: `postgres:5432`
- Local machine port: `5433`
- Database: `habiflow`
- User: `habiflow`
- Password: `habiflow`

The Prisma schema lives at `apps/api/prisma/schema.prisma`. The Docker API startup command runs:

```sh
prisma db push && node dist/main.js
```

This keeps local development simple by syncing the database directly from the Prisma schema.

## REST API

Core endpoints:

- `GET /health`
- `GET /habits?deviceId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /habits`
- `PATCH /habits/:habitId`
- `POST /habits/:habitId/archive`
- `DELETE /habits/:habitId`
- `POST /habits/:habitId/toggle`
- `GET /habits/:habitId/history?deviceId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /habits/:habitId/streak?deviceId=...`

Swagger has full request-body and query-parameter examples at `/docs`.

## Main Backend Flows

- **Create habit:** validate DTO, construct domain `Habit`, persist through `HabitRepository`.
- **List dashboard habits:** load active habits for a device, load completions for the visible date range, calculate streaks.
- **Toggle today:** find the habit, enforce `deviceId` ownership, create or delete today’s completion.
- **Archive/delete:** enforce ownership, then update status or delete habit and completions.
- **History/streaks:** query persisted completions and calculate current/best streaks from domain rules.

## Testing

```sh
pnpm --filter @habiflow/api test
```

Current tests cover:

- Habit validation
- Reminder validation
- Archive behavior
- Daily and weekly streak calculation
- Create/list/toggle/archive use cases
- Device ownership checks
