# FlyRank Backend AI Engineering — Weeks 1–7

Node.js and Express implementations for the first seven Backend AI Engineering
weeks. Each folder is independently runnable and documented.

| Week | Project | Main proof |
| --- | --- | --- |
| 1 | [Backend foundations](week-01-foundations/README.md) | Node/Express request-response loop and health endpoint |
| 2 | [In-memory Task API](week-02-task-api/README.md) | Full CRUD, validation, status codes, Swagger UI |
| 3 | [Persistent Task API](week-03-database-api/README.md) | SQLite and PostgreSQL repositories behind one service contract |
| 4 | [Supabase Auth API](week-04-auth-api/README.md) | Signup/login/logout, JWT guard, protected routes, Swagger bearer auth |
| 5 | [Polite book scraper](week-05-scraper/README.md) | robots check, identified/rate-limited requests, schema-validated JSON |
| 6 | [Trustworthy LLM API](week-06-llm-api/README.md) | Structured output, validation, repair, retries, evals and kill switch |
| 7 | [Visual AI workflow](week-07-ai-workflow/README.md) | React Flow decision graph executed with Inngest |
| 7 | [Background jobs](week-07-background-jobs/README.md) | Fast 202 response, polling, retries and cron |
| 7 | [PDF report generator](week-07-report-generator/README.md) | SQLite aggregation, stored PDFs and download links |

## Quick start

```bash
git clone https://github.com/tristanlgb/-flyrank-backend-capstone.git
cd -flyrank-backend-capstone
npm install
npm test
```

Node.js 20+ is required. Read each week's README for its start command and any
environment variables.

To run every Week 6–7 service and both Inngest applications together:

```bash
npm run dev:w6-w7
# in another terminal
npm run smoke:w6-w7
```

Import [the Postman collection](postman/FlyRank-Weeks-6-7.postman_collection.json) for organized manual requests. See the [local verification evidence](docs/evidence/WEEKS-6-7-LOCAL-VERIFICATION.md) for the last complete run.

## Running from VS Code

Open the repository root (`flyrank-backend-capstone`), not an individual week
folder. Then use **Terminal → Run Task** and choose a named task.
`Ctrl+Shift+B` runs the default **Project: Verify everything** task. The Week 5
scraper finishing and returning to the prompt is expected: it is a batch job,
not a server. A line such as `valid=60 failed_pages=0` means it succeeded.

See [Completion Status](COMPLETION-STATUS.md) for the exact automated results
and the account/device-dependent checks that remain manual.

## Transparency

Weeks 2–5 follow the assignment text supplied by the student. The exact Week 1
brief was not supplied and could not be found publicly, so Week 1 is explicitly
presented as a reasonable Node/HTTP foundations exercise, not as a claim of
exact brief compliance. AI assistance helped scaffold, review, and test the
code. The student remains responsible for explaining it, running the required
manual demonstrations, and submitting account-dependent evidence.
