# Week 7 — Background Jobs

Planned Express and Inngest implementation of the fast-door pattern:
`POST /reports` returns `202`, an Inngest function performs the slow work, and
`GET /reports/:id` exposes eventual status and results.

The implementation will demonstrate retries, validation, cron execution,
idempotency, and observable runs in the Inngest dashboard.
