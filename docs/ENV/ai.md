# AI Environment Variables (LangChain + OpenAI)

**Required**
- `OPENAI_API_KEY`

**Models**
- `LLM` — optional fast model identifier (defaults to `gpt-4o-mini` when unset)
- `LLM_HEAVY` — optional higher-quality model used when `mode: "quality"` is requested (falls back to `LLM`)

**Optional**
- `OPENAI_BASE_URL` — for Azure / compatible gateways
- `AI_GRAPH_ENABLE` — set "true" to enable `/api/ai/graph`

**Tracing (optional)**
- `LANGCHAIN_TRACING_V2`
- `LANGSMITH_API_KEY`
- `LANGCHAIN_PROJECT`

**Endpoints**
- `/api/ai/ping` — basic chat
- `/api/ai/stream` — streaming chat
- `/api/ai/tools` — function calling (e.g., profiles search)
- `/api/ai/graph` — guarded by `AI_GRAPH_ENABLE="true"`

**Mode selection**
- Send `{ mode: "fast" | "quality" }` in POST bodies for `/api/ai/stream` and `/api/ai/tools` to toggle between `LLM` (fast/default) and `LLM_HEAVY` (quality). Missing or unknown values default to fast.

The `/ui-demo` page contains cards to exercise these endpoints.
