# Week 7 — Visual AI Workflow

A React Flow editor backed by an Express/Inngest runner. Each editable decision node becomes a named Inngest step; the AI is constrained to `YES` or `NO`, and that label selects the next edge dynamically.

From this folder, run `npm run dev`, then `npm run dev:inngest` in another terminal. To run every Week 6-7 project together, use `npm run dev:w6-w7` from the repository root; its single Inngest server registers both job applications. Open the frontend at http://localhost:3006 and dashboard at http://localhost:8288. The API runs on port 3007. Without `OPENAI_API_KEY`, a deterministic local classifier makes the complete demo free; configure `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL` for a real compatible provider.

Implemented polish: active-node highlighting, execution logs and history, local save/load, JSON export, responsive node styling, error status, and two automatic Inngest retries. The starter graph asks whether text is a support request and branches to Support or Sales.
