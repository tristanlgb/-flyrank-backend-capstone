# Weeks 6-7 local verification

Verified locally on 2026-09-03 with Node.js 24.

## Commands

```bash
npm run dev:w6-w7
npm run smoke:w6-w7
```

## Observed result

```text
PASS Week 6 structured LLM response
PASS Week 6 rejects invalid input
PASS background job pending -> done
PASS generated downloadable PDF
PASS visual workflow dynamically traverses YES edge
All Week 6-7 smoke checks passed.
```

Additional observed HTTP behavior:

- LLM health returned 200; an empty body returned 400 and named all four invalid fields.
- Background creation returned 202 immediately and the same ID later returned `done` with its result.
- Forced PDF creation returned 201; metadata returned 200; file download returned `application/pdf` with 70,239 bytes.
- A second non-forced report request returned 200 with the existing daily report ID.
- Empty workflow input returned 400; the valid two-node graph completed in execution order `start`, `support`.

The Inngest development server is shared by both apps and registers both `/api/inngest` URLs on port 8288. This avoids conflicting local workers.

## Postman

Import `postman/FlyRank-Weeks-6-7.postman_collection.json`. Its folders cover the LLM API, background reports, PDF reports, and visual workflow. Dynamic IDs are saved as collection variables for the polling and download requests.

VS Code was in Restricted Mode during verification, so its Postman extension was unavailable. The exported collection is ready to run after the user manually trusts the workspace; no workspace-security setting was changed automatically.
