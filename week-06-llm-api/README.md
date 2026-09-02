# Week 6 — Trustworthy LLM API

`POST /ai/enrich-book` enriches Week 5 records into closed Zod-validated JSON. Run `npm start` (port 3003), `npm test`, and `npm run eval`.

```bash
curl -X POST http://localhost:3003/ai/enrich-book -H "Content-Type: application/json" -d '{"title":"Learning Node","description":"A practical JavaScript backend guide","price":24,"rating":5}'
```

Stub output is deterministic and free. For OpenRouter/Ollama set `LLM_STUB=0` and the private `.env` values shown in `.env.example`. Invalid fields return 400 before any call. Provider timeout is capped at 60 seconds; only timeout, 429 and 5xx retry with jitter. Output is parsed and validated; one repair is allowed, then 422 plus quarantine. Raw text is never returned. Logs include prompt version, model, tokens, duration, and repair count. `LLM_ENABLED=false` is the deterministic kill switch.

The eight labelled cases cover every category, flags, ambiguity, and prompt injection. Baseline on 2026-09-02: **8/8** using stub mode and prompt `enrich-book-v1`. A real-provider score must be recorded only after supplying a real key; none is fabricated here.
