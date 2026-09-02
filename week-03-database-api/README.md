# Week 3 — Persistent Task API: SQLite + PostgreSQL

The Week 2 routes and service contract remain unchanged while the storage
implementation moves behind repository adapters. SQLite is the zero-setup
default; Docker Compose runs the same service against PostgreSQL.

## SQLite

```bash
copy week-03-database-api\.env.example week-03-database-api\.env
npm start -w week-03-database-api
```

SQLite was chosen because it provides real SQL persistence in one local file
without a database server. The default file is `week-03-database-api/data/tasks.db`
and is ignored by Git. The schema and three seed tasks are created automatically
only when the table is empty.

Example query used in a database viewer:

```sql
SELECT id, title, done FROM tasks ORDER BY id;
```

Create a task, stop Node, restart it, and repeat `GET /tasks`: the row remains.
Editing the SQLite row in a viewer is immediately visible through the API.

## PostgreSQL in Docker

```bash
cd week-03-database-api
docker compose up --build
```

This starts app + database together. The connection string comes from the
environment, the committed `.env.example` contains no real secret, and the
Postgres volume preserves rows across app and container restarts. The routes
and `TaskService` do not change; only the repository selected by `DB_DRIVER`
changes.

## Evidence boundaries

Automated SQLite contract tests are included. Docker persistence and the
database-viewer screenshot require Docker Desktop/manual execution on the
student's machine and must not be claimed until performed.
