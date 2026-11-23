# Dexa WFH Attendance Portal

A small full stack app for employee WFH attendance and HR monitoring. The repository contains three independently run projects:

- `react-ui` — React and Vite web app for sign-in, photo-backed attendance, and admin screens.
- `nest-login` — NestJS API for authentication and admin-managed employee accounts.
- `nest-attendance-core` — NestJS API for attendance submissions and admin monitoring. Attendance photos are stored in MinIO/S3.

The APIs use separate MySQL databases. The attendance API verifies the login API's JWT using the same `JWT_SECRET`.
Employee accounts are created and managed by admins through the user management API; the seed creates the initial admin.

## Requirements

Node.js, pnpm, and Docker Compose.

## Run locally

From the repository root, start MySQL and MinIO:

```sh
docker compose up -d
```

In separate terminals, prepare each API. Copy each `.env.example` to `.env`; use the same long random `JWT_SECRET` in both API env files.

```sh
cd nest-login
pnpm install
pnpm run prisma:migrate
pnpm run db:seed
pnpm run start:dev
```

```sh
cd nest-attendance-core
pnpm install
pnpm run prisma:migrate
pnpm run start:dev
```

Then run the frontend in another terminal. Copy `react-ui/.env.example` to `react-ui/.env` first.

```sh
cd react-ui
pnpm install
pnpm run dev
```

Open the Vite URL shown in the terminal (typically `http://localhost:5173`). The APIs run at `http://localhost:3300/api` and `http://localhost:4400/api`; MinIO's console is at `http://localhost:9001`.

The seed creates `admin@example.com`, `adit@example.com`, and `laura@example.com`, all with password `Password123!` by default. Set `SEED_USER_PASSWORD` before seeding to use a different password.

## Project commands

Run commands from the corresponding project directory. Both APIs provide `build`, `lint`, `test`, and `test:e2e` scripts; the login API also provides `db:seed`. See each `package.json` for the full script list.
