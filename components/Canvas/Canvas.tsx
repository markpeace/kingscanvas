import { IntentionRow } from "@/components/Canvas/IntentionRow"
import { mockIntentions } from "@/data/mockIntentions"

export default function Canvas() {
  return (
    <main className="px-8 py-8">
      {mockIntentions.map(intention => (
        <IntentionRow key={intention.id} intention={intention} />
      ))}
    </main>
  )
}
