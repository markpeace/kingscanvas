import DebugPanel from "@/components/debug/DebugPanel"
import { CoreKnowledgeDevPanel } from "@/components/luminaries/CoreKnowledgeDevPanel"
import { CoreKnowledgeSummaryCard } from "@/components/luminaries/CoreKnowledgeSummaryCard"

export const metadata = {
  title: "Temp Luminary"
}

export default function TempLuminaryPage() {
  return (
    <div className="p-6 space-y-4">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Luminary workspace</p>
        <h1 className="text-2xl font-semibold">Temp Luminary</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Preview of Core Knowledge visibility.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <CoreKnowledgeSummaryCard luminaryId="temp" />
        <CoreKnowledgeDevPanel luminaryId="temp" />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Core Knowledge remains read only. Data shown here is derived from the same document used in prompts.
      </p>

      <DebugPanel />
    </div>
  )
}
