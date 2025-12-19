# AI Environment Variables (LangChain + OpenAI)

**Required**
- `OPENAI_API_KEY`

**Model selection**
- `LLM` — fast model identifier (defaults to `gpt-4o-mini` when unset)
- `LLM_HEAVY` — quality model identifier (falls back to `LLM`/default when unset)

**Optional**
- `OPENAI_BASE_URL` — for Azure / compatible gateways
- `AI_GRAPH_ENABLE` — set "true" to enable `/api/ai/graph`

**Tracing (optional)**
- `LANGCHAIN_TRACING_V2`
- `LANGSMITH_API_KEY`
- `LANGCHAIN_PROJECT`

**Endpoints**
- `/api/ai/ping` — basic chat (accepts `{ mode: "fast" | "quality" }` via query/body)
- `/api/ai/stream` — streaming chat (accepts `{ mode: "fast" | "quality" }` to pick the model)
- `/api/ai/tools` — function calling (e.g., profiles search; accepts `{ mode: "fast" | "quality" }` to pick the model)
- `/api/ai/graph` — guarded by `AI_GRAPH_ENABLE="true"` (accepts `mode` query param for model selection)

The `/ui-demo` page contains cards to exercise these endpoints.
