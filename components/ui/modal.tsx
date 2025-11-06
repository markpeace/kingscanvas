"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { ReactNode } from "react"
import { cn } from "@/lib/ui/cn"

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  className
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 h-full w-[92vw] max-w-md overflow-auto",
            "bg-white dark:bg-zinc-900 shadow-xl border-l border-zinc-200 dark:border-zinc-800 p-4",
            className
          )}
        >
          {title ? (
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              <Dialog.Close className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Close
              </Dialog.Close>
            </div>
          ) : (
            <div className="mb-2 flex justify-end">
              <Dialog.Close className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Close
              </Dialog.Close>
            </div>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
