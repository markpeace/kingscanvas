"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/ui/cn"

type Variant = "success" | "error" | "info"

export type ToastOptions = {
  title?: string
  description?: string
  variant?: Variant
  durationMs?: number
}

type ToastItem = {
  id: string
  title?: string
  description?: string
  variant: Variant
  open: boolean
  durationMs: number
}

type ToastContextValue = {
  toast: (opts: ToastOptions) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const push = React.useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2)
    const item: ToastItem = {
      id,
      title: opts.title,
      description: opts.description,
      variant: opts.variant ?? "info",
      open: true,
      durationMs: Math.max(1500, opts.durationMs ?? 3000)
    }
    setItems((prev) => [...prev, item])
    return id
  }, [])

  const ctx = React.useMemo<ToastContextValue>(() => ({
    toast: push,
    success: (title: string, description?: string) => push({ title, description, variant: "success" }),
    error: (title: string, description?: string) => push({ title, description, variant: "error" }),
    info: (title: string, description?: string) => push({ title, description, variant: "info" })
  }), [push])

  function onOpenChange(id: string, open: boolean) {
    if (!open) {
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 150)
    } else {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, open } : t)))
    }
  }

  return (
    <ToastContext.Provider value={ctx}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {items.map((t) => (
          <ToastPrimitives.Root
            key={t.id}
            open={t.open}
            onOpenChange={(o) => onOpenChange(t.id, o)}
            duration={t.durationMs}
            className={cn(
              "group pointer-events-auto relative grid w-[90vw] sm:w-[400px] grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border p-3 shadow-lg transition-all",
              "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top",
              t.variant === "success" && "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100",
              t.variant === "error" && "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-100",
              t.variant === "info" && "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            )}
          >
            <div className="pt-0.5">
              {t.variant === "success" && <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
              {t.variant === "error" && <TriangleAlert className="h-5 w-5" aria-hidden="true" />}
              {t.variant === "info" && <Info className="h-5 w-5" aria-hidden="true" />}
            </div>
            <div className="grid gap-1">
              {t.title ? (
                <ToastPrimitives.Title className="text-sm font-semibold">
                  {t.title}
                </ToastPrimitives.Title>
              ) : null}
              {t.description ? (
                <ToastPrimitives.Description className="text-xs opacity-90">
                  {t.description}
                </ToastPrimitives.Description>
              ) : null}
            </div>
            <ToastPrimitives.Close
              className="rounded-md border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </ToastPrimitives.Close>
          </ToastPrimitives.Root>
        ))}
        <ToastPrimitives.Viewport
          className={cn(
            "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 outline-none pointer-events-none"
          )}
        />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToastContext must be used inside <ToastProvider>")
  return ctx
}
