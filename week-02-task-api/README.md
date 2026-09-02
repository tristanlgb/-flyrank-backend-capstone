# Week 2 — In-memory Task CRUD API

Express API for full task CRUD. Data intentionally lives only in memory. The
API includes validation, correct HTTP statuses, JSON errors, Swagger UI,
search/filter/stats/reset extras, and automated tests.

```bash
npm install
npm start -w week-02-task-api
```

Open <http://localhost:3000/docs> for Swagger UI.

| Method | Path | Success | Errors |
| --- | --- | --- | --- |
| GET | `/`, `/health` | 200 | — |
| GET | `/tasks`, `/tasks/:id` | 200 | 404 unknown ID |
| POST | `/tasks` | 201 | 400 invalid title |
| PUT | `/tasks/:id` | 200 | 400 invalid body, 404 unknown ID |
| DELETE | `/tasks/:id` | 204 | 404 unknown ID |
| GET | `/stats` | 200 | — |
| POST | `/reset` | 200 | — |

```bash
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
```

The result begins with `HTTP/1.1 201 Created`. Run
`npm test -w week-02-task-api` for the complete CRUD check.

## Mortality experiment

Created tasks disappear when Node restarts because the array exists only in
process memory. Week 3 replaces this store behind the same routes with a
persistent database.

## Screenshot evidence

Run the server, execute the CRUD cycle in `/docs`, and capture the browser
before portal submission. This personal execution evidence is not fabricated.
