# PLAN — Epoch 0013: AI Integration (LangChain + LangGraph + OpenAI)

## Context
Add a minimal-but-real AI foundation that works out-of-the-box and is easy to extend:
- LangChain for model/tool abstractions
- LangGraph for graph-style orchestration
- OpenAI as the default provider (configurable via env)
- A demo endpoint + UI card so we can verify on device

## Environment Variables (configure on Vercel now)
- `OPENAI_API_KEY` — required
- `OPENAI_MODEL` — optional, default `gpt-4o-mini` (or any chat-capable model)
- `OPENAI_BASE_URL` — optional override (e.g., Azure/OpenAI-compatible gateways)
- `AI_ENABLE` — optional, "true" to enable UI demo (defaults to enabled in dev)
- Optional tracing (disabled by default):
  - `LANGCHAIN_TRACING_V2`, `LANGSMITH_API_KEY`, `LANGCHAIN_PROJECT`

## Objectives
- Add deps: `langchain`, `@langchain/core`, `@langchain/openai`, `@langchain/langgraph`
- Create AI client helpers and a tiny LangGraph (single-node “echo/transform”)
- Add `/api/ai/ping` route that runs the graph with a prompt
- Add a UI card on `/ui-demo` to call the API and display the response
- Document how to switch models / base URL and where to place `docs/llms*.txt`

## Deliverables
- `lib/ai/client.ts` — OpenAI Chat wrapper via LangChain
- `lib/ai/graph/ping.ts` — minimal LangGraph with state + single node
- `app/api/ai/ping/route.ts` — server route to execute the graph
- `/ui-demo` card — textbox + “Run AI” button rendering the result
- README section + `/docs/ENV/ai.md` with env setup and troubleshooting

## Proposed PR sequence
1) PR 1 — Plan & Status (this PR)
2) PR 2 — Dependencies + AI client + graph + `/api/ai/ping`
3) PR 3 — UI demo card on `/ui-demo` + toasts + Debug Panel emit
4) PR 4 — Docs (README + /docs/ENV/ai.md) and request upload of `docs/llms.txt` & `docs/llms-full.txt`
5) PR 5 — Verify & Close

## Acceptance Criteria
- With `OPENAI_API_KEY` set, `/api/ai/ping?q=hello` returns a model-generated response
- The `/ui-demo` AI card shows round-trip success with loading/error states
- Model + base URL can be changed via env; works in Vercel Preview/Prod
- Docs explain configuration and where to place `docs/llms*.txt`

## Out of Scope
- Tool use, multi-agent graphs, vector stores — future epochs
- Prompt secrets in repo — use env variables only

## Notes
- We will later request you to upload:
  - `/docs/llms.txt` (quick reference)
  - `/docs/llms-full.txt` (detailed guide)
