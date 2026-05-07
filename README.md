# WorkWithCare

WorkWithCare is a full-stack Team Task Manager with authentication, role-based access, project planning, and task tracking.

## Features

- Email/password authentication with JWT
- Admin and Member roles
- Project creation with member assignments
- Task creation, assignment, and status updates
- Dashboard insights for overdue work and progress

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Express + Prisma
- **Database:** SQLite (local) — swapable with PostgreSQL for Railway

## Getting Started (Local)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update the values as needed.

### 3) Run database migrations

```bash
npm run migrate --prefix server
```

### 4) Start the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

## Admin Access

If you set `ADMIN_INVITE_CODE` in `server/.env`, users selecting the Admin role during signup must provide that code.

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/tasks/:taskId`
- `GET /api/tasks?assigned=me`

## Deployment Notes (Railway)

- Provision a PostgreSQL database and update `DATABASE_URL`.
- Run Prisma migrations on deploy: `npx prisma migrate deploy`.
- Set `CLIENT_URL` to the deployed frontend URL.

## Scripts

- `npm run dev` — run client + server
- `npm run build` — build the client
- `npm run start` — start the API server
