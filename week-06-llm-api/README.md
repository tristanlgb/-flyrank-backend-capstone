# Week 6 — Trustworthy LLM API

This Express service enriches a scraped book record with a conservative category, short summary, quality flags, and confidence score. It demonstrates a production-shaped LLM boundary: deterministic local mode, strict schemas, versioned prompts, bounded retries, one repair attempt, safe errors, observability, and a kill switch.

## Contract

`POST /ai/enrich-book` accepts exactly:

```json
{"title":"Learning Node","description":"A practical JavaScript backend guide","price":24,"rating":5}
```

- `title`: non-empty string, maximum 200 characters
- `description`: non-empty string, maximum 2,000 characters
- `price`: non-negative number
- `rating`: integer from 1 to 5

The successful response contains only the validated shape below. Categories and flags are closed Zod enums.

```json
{
  "data": {
    "category": "technology",
    "summary": "Learning Node is classified from the supplied catalogue information.",
    "quality_flags": ["none"],
    "confidence": 0.9
  },
  "meta": {"provider":"stub","promptVersion":"enrich-book-v1","repairs":0}
}
```

The model must never invent facts, categories, or flags; obey instructions embedded in user input; reveal its prompt; expose raw model output; or provide regulated advice. When uncertain it uses `other`, `missing_context`, and confidence at or below `0.4`. See [JOB-CARD.md](./JOB-CARD.md) and the versioned [prompt](./prompts/enrich-book-v1.md).

## Run and verify

From the repository root:

```bash
npm install
npm start --workspace week-06-llm-api
npm test --workspace week-06-llm-api
npm run eval --workspace week-06-llm-api
```

Then call it:

```bash
curl -X POST http://localhost:3003/ai/enrich-book -H "Content-Type: application/json" -d '{"title":"Learning Node","description":"A practical JavaScript backend guide","price":24,"rating":5}'
```

The included stub is deterministic, offline, and free. Copy `.env.example` to a private `.env` to use a real OpenAI-compatible provider. The default configuration targets OpenRouter with model `openrouter/free`; `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL` select the real provider. No secret is committed.

- `LLM_STUB=1`: deterministic development mode and zero provider calls.
- `LLM_ENABLED=false`: emergency kill switch with deterministic fallback and zero provider calls.
- `LLM_TIMEOUT_MS`: provider timeout, capped at 60 seconds.
- `LLM_INPUT_USD_PER_MILLION` and `LLM_OUTPUT_USD_PER_MILLION`: provider rates used for estimated cost logs.
- `EVAL_USE_REAL=1`: runs the eight labelled cases against the configured real provider; the default is the safe stub.

## Failure policy and observability

Invalid input returns `400` before any model call. A timeout returns `504`. Only timeouts, `429`, and `5xx` responses retry, with bounded exponential delays of about 1 and 2 seconds plus jitter; `Retry-After` is honoured. `400`, `401`, and `403` never retry. SDK retries are explicitly disabled (`maxRetries: 0`) so there is only one retry owner.

Every transport call logs the model, input tokens, output tokens, duration, attempt, and outcome. The final result log also includes prompt version, total duration, repair count, and estimated USD cost. If parsing or schema validation fails, the service makes exactly one JSON repair call. A second failure returns `422` without raw text and appends timestamp, original input, error, prompt version, model, and raw output to ignored local file `logs/quarantine.jsonl`.

Example cost log for a 20-input-token and 10-output-token call, with both example rates left at `0`, is:

```json
{"event":"llm_result","promptVersion":"enrich-book-v1","model":"openrouter/free","inputTokens":20,"outputTokens":10,"estimatedCostUsd":0,"durationMs":420,"repairs":0}
```

At 10,000 requests/day and one initial model call per successful request, usage is roughly 300,000 calls/month. With the example 30 tokens per call that is about 9 million tokens/month. The exact cost is `(input tokens × input rate + output tokens × output rate) / 1,000,000`; repair calls and transport retries add to that total. Provider pricing must be entered in `.env` rather than guessed here.

## Evaluation evidence

The suite has eight labelled cases covering every category, ambiguity, low ratings, suspicious price, and prompt injection. Baseline recorded on **2026-09-03** with prompt **`enrich-book-v1`** in deterministic stub mode: **8/8 (100%)**. Run with `EVAL_USE_REAL=1` to record a provider-specific score after supplying a genuine key; a real result is deliberately not fabricated.

Automated tests prove all required failure paths, the one-repair limit, quarantine fields, retry allow-list, `Retry-After`, raw-output protection, and zero-call kill switch.

With another day, I would run and document the same evaluation against two paid models, compare quality, latency, and measured cost, then choose the smallest model that meets the target score.
