# Completion Status — Weeks 1–5

## Verified in this environment

- Node.js/Express workspace installs with zero reported npm vulnerabilities.
- ESLint passes across all source and test files.
- 21 automated tests pass across Weeks 1–5.
- Week 2 full CRUD statuses and validation are covered by API tests.
- Week 3 SQLite uses SQL, preserves the Week 2 contract, and passes a real
  close/reopen persistence test.
- Week 4 authentication routes and reusable bearer middleware pass with an
  injected provider double.
- Week 5 follows pagination, caches politely, validates raw and normalized data,
  and writes separate data, error, and run reports. A live run collected 60
  valid product pages; a second run used 63 cached responses; and an injected
  404 proved that one broken page does not stop the other records.

## Requires student/account or machine access

- **Week 1:** replace or reconcile the transparent foundations exercise if the
  exact official Week 1 brief is supplied later.
- **Week 2:** complete curl output and Swagger UI evidence are stored with the
  assignment (generated locally from the running API).
- **Week 3 PostgreSQL:** install Docker Desktop, run `docker compose up --build`,
  create rows, restart app and database containers, and record persistence.
- **Week 3 database viewer:** capture the requested SQLite/Postgres viewer image.
- **Week 4 Supabase:** add personal project values to the ignored `.env`, run a
  real signup/login/profile/logout cycle, and capture authenticated Swagger UI.

These boundaries are not hidden or represented as completed evidence.
