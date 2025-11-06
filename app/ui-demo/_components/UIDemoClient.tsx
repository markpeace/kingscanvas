"use client"

import { useState } from "react"
import { Mail, Loader2, Check } from "lucide-react"
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter, Modal } from "@/components/ui"
import { useToast } from "@/lib/toast"

export default function UIDemoClient() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { success, error, info } = useToast()

  return (
    <section className="py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">UI Primitives Demo</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-4 sm:mb-5">
        Quick visual tour of shared components. Try this on your phone in light and dark mode.
      </p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Toasts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => success("Saved", "Your changes were saved.")}>Success toast</Button>
            <Button variant="outline" onClick={() => error("Something went wrong", "Please try again.")}>Error toast</Button>
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
              <Button onClick={() => setLoading((v) => !v)}>
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
