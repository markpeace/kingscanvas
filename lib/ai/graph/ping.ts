import { getChatModel } from "@/lib/ai/client"
// NOTE: LangGraph implementation temporarily disabled due to runtime error ("t$ is not a function") in current env/version.
// We'll reintroduce a LangGraph-based pipeline in a later PR when we add multi-node graphs.

export async function runPing(input: string) {
  const model = getChatModel()
  const res = await model.invoke(input || "Say hello briefly.")
  const content =
    typeof (res as any) === "string"
      ? (res as any)
      : Array.isArray((res as any).content)
        ? (res as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
        : (res as any).content ?? ""
  return String(content || "")
}

export default runPing
