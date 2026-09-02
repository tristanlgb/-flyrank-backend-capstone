# Week 4 — Supabase Authentication API

Express API with signup, login, logout, public routes, reusable bearer-token
middleware, protected profile/dashboard routes, and Swagger bearer auth.

## Setup

For an immediate local run, no credentials are required:

```bash
npm start
```

The console will state `provider: local-development`. This mode hashes
passwords, creates bearer tokens, and keeps users/sessions only in memory; they
disappear when Node restarts. It exists for development and does not count as
evidence of a real Supabase integration.

For the assignment's real Supabase mode:

1. Create a Supabase project and enable email/password authentication.
2. Copy `.env.example` to `.env`.
3. Add your own project URL and **anon/publishable** key. Never use or commit a
   service-role key.
4. Start the API. The console must state `provider: supabase`:

```bash
npm start -w week-04-auth-api
```

Open <http://localhost:3002/docs>, sign up/login, copy the access token, click
**Authorize**, and paste the token to test the protected routes.

| Method | Path | Auth | Expected success |
| --- | --- | --- | --- |
| POST | `/auth/signup` | No | 201 |
| POST | `/auth/login` | No | 200 + access/refresh token |
| POST | `/auth/logout` | Bearer JWT | 204 |
| GET | `/public/info` | No | 200 |
| GET | `/protected/profile` | Bearer JWT | 200 |
| GET | `/protected/dashboard` | Bearer JWT | 200 |

Missing/invalid input returns 400; invalid credentials or tokens return 401.
The reusable middleware verifies tokens with `supabase.auth.getUser(token)`.

## Verification boundary

Automated tests use an injected fake provider to verify routing, statuses, and
middleware without external accounts. A real Supabase signup/login/logout run
and Swagger screenshot require the student's project credentials and must be
performed before claiming full remote integration.
