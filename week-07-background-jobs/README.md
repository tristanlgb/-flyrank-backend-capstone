# Week 7 — Background Jobs

An Express + Inngest implementation of accept fast, work in the background, report status.

## Run

Terminal 1: `npm start` (API on port 3004). Terminal 2: `npm run dev:inngest` (dashboard on port 8288).

| Surface | Purpose |
|---|---|
| `POST /reports` | validates `topic`, stores pending report, sends event, returns 202 |
| `GET /reports/:id` | pending/done/failed status; unknown IDs return 404 |
| `GET /reports` | status control panel |
| `say-hello` | five-second introductory job |
| `make-report` | 8-second sleep + build steps, two retries, concurrency limit 2 |
| `heartbeat` | every-minute status summary cron |

Proof flow: POST `{"topic":"cats"}` returns `202 {"id":"…","status":"pending"}` in under one second. The first poll is pending; after the Inngest function completes, the same GET returns done and its result. `{"topic":"fail"}` throws on all three attempts and is marked failed. Missing topic is a permanent client error, so it is rejected before an event; transient worker errors are retried. Daily 08:00 is `0 8 * * *`; Sunday 22:00 is `0 22 * * 0` (server timezone must be verified).

Jobs are idempotent by checking an already-done ID, because delivery systems may execute an event more than once. Capture the local dashboard after running the success, failure, and cron checkpoints; the repository does not claim a screenshot that was not produced.
