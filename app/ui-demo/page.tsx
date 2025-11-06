"use client"

import { useState, type ChangeEvent } from "react"
import { Mail, Loader2, Check } from "lucide-react"
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Input, Modal } from "@/components/ui"
import { useToast } from "@/lib/toast"
import type { Profile } from "@/lib/db/types"
import { obs } from "@/lib/obs"

export default function UIDemoPage() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [aiQ, setAiQ] = useState("Say hello briefly.")
  const [aiOut, setAiOut] = useState("")
  const [aiBusy, setAiBusy] = useState(false)
  const [aiStreamQ, setAiStreamQ] = useState("Stream a short hello.")
  const [aiStreamOut, setAiStreamOut] = useState("")
  const [aiStreamBusy, setAiStreamBusy] = useState(false)
  const [aiToolQ, setAiToolQ] = useState("Find profiles with name fragment 'Ada'.")
  const [aiToolOut, setAiToolOut] = useState("")
  const [aiToolBusy, setAiToolBusy] = useState(false)
  const [aiGraphQ, setAiGraphQ] = useState("Use the graph to say hello briefly.")
  const [aiGraphOut, setAiGraphOut] = useState("")
  const [aiGraphMode, setAiGraphMode] = useState("")
  const [aiGraphBusy, setAiGraphBusy] = useState(false)
  const { success, error: toastError, info } = useToast()

  async function fetchProfiles() {
    const res = await fetch("/api/profiles")
    const json = await res.json()
    if (!res.ok || !json.ok) {
      throw new Error(json.error || "request failed")
    }
    setProfiles(json.data || [])
    return json
  }

  return (
    <section className="py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">UI Primitives Demo</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-4 sm:mb-5">
        Quick visual tour of shared components. Try this on your phone in light and dark mode.
      </p>

      <div className="mb-4">
        <a href="/ui-demo/forms" className="text-sm underline text-blue-600 dark:text-blue-400">
          Open forms demo →
        </a>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI (OpenAI via /api/ai/ping)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              value={aiQ}
              onChange={(e) => setAiQ(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              placeholder="Ask something…"
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={aiBusy}
                onClick={async () => {
                  try {
                    setAiBusy(true)
                    setAiOut("")
                    obs.info("AI.Demo.Request", { where: "/ui-demo" })
                    const res = await fetch("/api/ai/ping", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ q: aiQ })
                    })
                    const json = await res.json()
                    if (!res.ok || !json.ok) throw new Error(json.error || "Request failed")
                    setAiOut(json.data.output || "")
                    success("AI response received")
                    obs.info("AI.Demo.Success", { chars: (json.data.output || "").length })
                  } catch (e: any) {
                    toastError("AI request failed", e?.message || "Unknown error")
                    obs.error("AI.Demo.Error", { message: e?.message || "Unknown error" })
                  } finally {
                    setAiBusy(false)
                  }
                }}
              >
                {aiBusy ? "Running…" : "Run AI"}
              </Button>
              <Button variant="subtle" onClick={() => setAiOut("")}>Clear</Button>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Uses <code>/api/ai/ping</code>. Ensure <code>OPENAI_API_KEY</code> is set.
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Response</label>
              <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3 text-sm">
{aiOut || "—"}
              </pre>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
            Open the Debug Panel (filter <code>channel=obs</code>) to see AI events.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Streaming (OpenAI)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              value={aiStreamQ}
              onChange={(e) => setAiStreamQ(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={aiStreamBusy}
                onClick={async () => {
                  try {
                    setAiStreamBusy(true)
                    setAiStreamOut("")
                    obs.info("AI.Stream.Request", { where: "/ui-demo" })
                    const res = await fetch("/api/ai/stream", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ q: aiStreamQ })
                    })
                    if (!res.ok || !res.body) throw new Error("No stream")
                    const reader = res.body.getReader()
                    const decoder = new TextDecoder()
                    let chars = 0
                    while (true) {
                      const { value, done } = await reader.read()
                      if (done) break
                      const text = decoder.decode(value)
                      chars += text.length
                      setAiStreamOut((prev) => prev + text)
                    }
                    obs.info("AI.Stream.Success", { chars })
                  } catch (e: any) {
                    toastError("Streaming failed", e?.message || "Unknown error")
                    obs.error("AI.Stream.Error", { message: e?.message || "Unknown error" })
                  } finally {
                    setAiStreamBusy(false)
                  }
                }}
              >
                {aiStreamBusy ? "Streaming…" : "Stream"}
              </Button>
              <Button variant="subtle" onClick={() => setAiStreamOut("")}>Clear</Button>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Response</label>
              <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3 text-sm">
{aiStreamOut || "—"}
              </pre>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
            Streams text via <code>/api/ai/stream</code>. Requires <code>OPENAI_API_KEY</code>.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Graph (flagged)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <textarea
              value={aiGraphQ}
              onChange={(e) => setAiGraphQ(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={aiGraphBusy}
                onClick={async () => {
                  try {
                    setAiGraphBusy(true)
                    setAiGraphOut("")
                    setAiGraphMode("")
                    const res = await fetch("/api/ai/graph?q=" + encodeURIComponent(aiGraphQ))
                    const json = await res.json()
                    if (!res.ok || !json.ok) throw new Error(json.error || "Request failed")
                    setAiGraphOut(json.data.output || "")
                    setAiGraphMode(json.data.mode || "")
                  } catch (e: any) {
                    setAiGraphOut(e?.message || "Unknown error")
                    setAiGraphMode("")
                  } finally {
                    setAiGraphBusy(false)
                  }
                }}
              >
                {aiGraphBusy ? "Running…" : "Run"}
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  setAiGraphOut("")
                  setAiGraphMode("")
                }}
              >
                Clear
              </Button>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Requires <code>AI_GRAPH_ENABLE=&quot;true&quot;</code>. The server will try LangGraph and fall back to direct if needed.
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Response</label>
              <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3 text-sm">
{aiGraphOut || "—"}
              </pre>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Mode: {aiGraphMode || "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Tools (Profiles search)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <textarea
              value={aiToolQ}
              onChange={(e) => setAiToolQ(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={aiToolBusy}
                onClick={async () => {
                  try {
                    setAiToolBusy(true)
                    setAiToolOut("")
                    const res = await fetch("/api/ai/tools", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ q: aiToolQ })
                    })
                    const json = await res.json()
                    if (!res.ok || !json.ok) throw new Error(json.error || "Request failed")
                    setAiToolOut(JSON.stringify(json.data, null, 2))
                  } catch (e: any) {
                    setAiToolOut(e?.message || "Unknown error")
                  } finally {
                    setAiToolBusy(false)
                  }
                }}
              >
                {aiToolBusy ? "Running…" : "Run"}
              </Button>
              <Button variant="subtle" onClick={() => setAiToolOut("")}>Clear</Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3 text-xs">
{aiToolOut || "—"}
            </pre>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
            Uses OpenAI tool-calling bound to a Mongo-backed <code>profiles_search</code> tool.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profiles (DB demo)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <Input
                label="Display name"
                placeholder="e.g. Ada Lovelace"
                value={profileName}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setProfileName(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/profiles", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ displayName: profileName.trim(), bio: "Created from /ui-demo" })
                      })
                      const json = await res.json()
                      if (!res.ok || !json.ok) {
                        throw new Error(json.error || "request failed")
                      }
                      setProfileName("")
                      await fetchProfiles()
                      success("Profile created", `${json.data.displayName} is now in MongoDB`)
                    } catch (err: any) {
                      toastError("Could not create profile", err?.message || "unknown error")
                    }
                  }}
                  disabled={!profileName.trim()}
                >
                  Create profile
                </Button>
                <Button
                  variant="subtle"
                  onClick={async () => {
                    try {
                      await fetchProfiles()
                      info("Profiles updated", "Fetched the latest 50 profiles.")
                    } catch (err: any) {
                      toastError("Could not load profiles", err?.message || "unknown error")
                    }
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              POST requires you to be signed in (Google). GET is public for demo.
            </div>

            <ul className="mt-2 grid gap-2">
              {profiles.map((profile) => (
                <li key={profile._id} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                  <div className="text-sm font-medium">{profile.displayName}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {profile.userId} · {new Date(profile.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
              {profiles.length === 0 ? (
                <li className="text-xs text-zinc-500 dark:text-zinc-400">No profiles fetched yet.</li>
              ) : null}
            </ul>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
            Uses /api/profiles (MongoDB). Check /api/db/health for connectivity.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toasts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => success("Saved", "Your changes were saved.")}>Success toast</Button>
            <Button variant="outline" onClick={() => toastError("Something went wrong", "Please try again.")}>Error toast</Button>
            <Button variant="subtle" onClick={() => info("Heads up", "This is an informational message.")}>Info toast</Button>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
            Toasts appear bottom-right. Swipe to dismiss on mobile or click the close button.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Button>Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="subtle">Subtle</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button disabled>Disabled</Button>
              <Button onClick={() => setLoading((value) => !value)}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {loading ? "Loading" : "Ready"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
            Focus one with keyboard to see the focus ring.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              startAdornment={<Mail size={16} />}
              hint="We’ll never spam you."
            />
            <Input label="Password" type="password" placeholder="********" error="" />
            <Input label="With end adornment" placeholder="Search…" endAdornment={<span className="text-xs">⌘K</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Opens from the right and traps focus.</p>
            <Modal
              open={open}
              onOpenChange={setOpen}
              trigger={<Button variant="subtle">Open Modal</Button>}
              title="Example Modal"
            >
              <div className="grid gap-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  This modal uses Radix Dialog under the hood and respects dark mode.
                </p>
                <Button onClick={() => setOpen(false)}>Close via Action</Button>
              </div>
            </Modal>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
