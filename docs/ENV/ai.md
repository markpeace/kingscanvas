# AI Environment Variables (LangChain + OpenAI)

**Required**
- `OPENAI_API_KEY`

**Optional**
- `LLM` — defaults to `gpt-4.2-mini`
- `NEXT_PUBLIC_LLM` — optional client-visible override (defaults to `LLM` or `gpt-4.2-mini`)
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

The `/ui-demo` page contains cards to exercise these endpoints.
