"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { useEffect, useMemo, useRef, useState } from "react"
import { ObjectInspector } from "react-inspector"
import { debugSink } from "./sink"

type Entry = {
  ts?: string
  label?: string
  level?: string
  channel?: string
  payload?: any
  [key: string]: any
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Entry[]>([])
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState<string>("")
  const [channel, setChannel] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return debugSink.subscribe((list) => setItems(list as Entry[]))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [items])

  const facets = useMemo(() => {
    const levels = new Set<string>()
    const channels = new Set<string>()
    items.forEach((e) => {
      if (e.level) levels.add(String(e.level))
      if (e.channel) channels.add(String(e.channel))
    })
    return {
      levels: Array.from(levels).sort(),
      channels: Array.from(channels).sort()
    }
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((e) => {
      if (level && String(e.level) !== level) return false
      if (channel && String(e.channel) !== channel) return false
      if (!q) return true
      try {
        const hay = JSON.stringify(e).toLowerCase()
        return hay.includes(q)
      } catch {
        return true
      }
    })
  }, [items, query, level, channel])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open debug panel"
        className="fixed bottom-4 right-4 rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 shadow hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/90 dark:hover:bg-zinc-800"
        style={{ zIndex: 50 }}
      >
        Debug
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" style={{ zIndex: 60 }} />
        <Dialog.Content
          className="fixed right-0 top-0 h-full w-[92vw] max-w-md bg-white p-3 overflow-auto shadow-xl border-l border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
          style={{ zIndex: 70 }}
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <Dialog.Title className="font-semibold">Debug Panel</Dialog.Title>
            <div className="flex items-center gap-2">
              <button
                className="text-sm underline text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                onClick={() => debugSink.clear()}
                title="Clear all entries"
              >
                Clear
              </button>
              <Dialog.Close
                className="rounded border px-2 py-1 hover:bg-zinc-50 border-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                Close
              </Dialog.Close>
            </div>
          </div>

          <div className="grid gap-2 mb-3">
            <input
              placeholder="Filter by text (searches entire entry)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
            />
            <div className="flex gap-2">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded border px-2 py-1 text-sm bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                aria-label="Filter by level"
              >
                <option value="">All levels</option>
                {Array.from(new Set(items.map(i => i.level).filter(Boolean))).sort().map((lv) => (
                  <option key={String(lv)} value={String(lv)}>{String(lv)}</option>
                ))}
              </select>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded border px-2 py-1 text-sm bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                aria-label="Filter by channel"
              >
                <option value="">All channels</option>
                {Array.from(new Set(items.map(i => i.channel).filter(Boolean))).sort().map((ch) => (
                  <option key={String(ch)} value={String(ch)}>{String(ch)}</option>
                ))}
              </select>
              {Boolean(level || channel || query) ? (
                <button
                  className="rounded border px-2 py-1 text-sm hover:bg-zinc-50 border-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  onClick={() => { setQuery(""); setLevel(""); setChannel(""); }}
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No matching entries. Adjust filters or clear them.
            </p>
          ) : null}

          <div className="space-y-2">
            {filtered.map((e, i) => (
              <EntryCard key={i} entry={e} />
            ))}
            <div ref={bottomRef} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function EntryCard({ entry }: { entry: Entry }) {
  const [showPayload, setShowPayload] = useState(false)
  const [showRest, setShowRest] = useState(false)
  const [raw, setRaw] = useState(false)

  const { ts, label, level, channel, payload, ...rest } = entry

  return (
    <div className="rounded border p-2 border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <strong>{label ?? "(no label)"}</strong>{" "}
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {ts ? new Date(ts).toLocaleTimeString() : ""}
            {level ? ` · ${level}` : ""}
            {channel ? ` · ${channel}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs rounded-full border px-2 py-[2px] hover:bg-zinc-50 border-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onClick={() => setRaw((v) => !v)}
            aria-label="Toggle raw JSON"
            title="Toggle raw JSON"
          >
            JSON
          </button>
        </div>
      </div>

      {payload !== undefined ? (
        <section className="mt-1">
          <Disclosure open={showPayload} onToggle={() => setShowPayload((v) => !v)} label="Payload" />
          <Collapsible open={showPayload}>
            <div className="rounded border p-2 mt-1 border-zinc-200 dark:border-zinc-700">
              {raw ? (
                <pre className="text-xs whitespace-pre-wrap break-words m-0 text-zinc-800 dark:text-zinc-100">
                  {safeStringify(payload)}
                </pre>
              ) : (
                <ObjectInspector data={payload} />
              )}
            </div>
          </Collapsible>
        </section>
      ) : null}

      {Object.keys(rest).length ? (
        <section className="mt-1">
          <Disclosure open={showRest} onToggle={() => setShowRest((v) => !v)} label="More" />
          <Collapsible open={showRest}>
            <div className="rounded border p-2 mt-1 border-zinc-200 dark:border-zinc-700">
              {raw ? (
                <pre className="text-xs whitespace-pre-wrap break-words m-0 text-zinc-800 dark:text-zinc-100">
                  {safeStringify(rest)}
                </pre>
              ) : (
                <ObjectInspector data={rest} />
              )}
            </div>
          </Collapsible>
        </section>
      ) : null}
    </div>
  )
}

function Disclosure({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
      aria-expanded={open}
      aria-controls={`${label.toLowerCase()}-content`}
    >
      <span className="inline-block w-3 text-center">{open ? "▾" : "▸"}</span>
      <span>{label}</span>
    </button>
  )
}

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`transition-all duration-150 ease-out ${open ? "opacity-100 max-h-[999px]" : "opacity-0 max-h-0 overflow-hidden"}`}>
      {children}
    </div>
  )
}

function safeStringify(v: any) {
  try { return JSON.stringify(v, null, 2) } catch { return String(v) }
}
