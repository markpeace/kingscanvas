import { getChatModel } from "@/lib/ai/client"

export type RunResult = { output: string; mode: "langgraph" | "direct-fallback" }

export async function runGuarded(input: string): Promise<RunResult> {
  // Try dynamic import of LangGraph so we don't crash on incompatible runtimes.
  try {
    const { StateGraph, START, END } = (await import("@langchain/langgraph")) as typeof import("@langchain/langgraph")

    type SimpleState = { input: string; output?: string }

    async function node(state: SimpleState): Promise<SimpleState> {
      const model = getChatModel()
      const res = await model.invoke(state.input || "Say hello briefly.")
      const content =
        typeof (res as any) === "string"
          ? (res as any)
          : Array.isArray((res as any).content)
            ? (res as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
            : (res as any).content ?? ""
      return { ...state, output: String(content || "") }
    }

    const graph = new StateGraph<SimpleState>({
      channels: {
        input: { value: null },
        output: { value: null, default: () => "" }
      }
    })

    graph.addNode("node", node)
    graph.addEdge(START, "node")
    graph.addEdge("node", END)

    const compiled = graph.compile()

    const result = await compiled.invoke({ input })
    return { output: String(result.output ?? ""), mode: "langgraph" }
  } catch {
    // Fallback: direct model call (guaranteed to work in current template)
    const model = getChatModel()
    const res = await model.invoke(input || "Say hello briefly.")
    const content =
      typeof (res as any) === "string"
        ? (res as any)
        : Array.isArray((res as any).content)
          ? (res as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
          : (res as any).content ?? ""
    return { output: String(content || ""), mode: "direct-fallback" }
  }
}
