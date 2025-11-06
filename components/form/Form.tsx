"use client"
import * as React from "react"
import { FormProvider, useFormContext } from "react-hook-form"
import { cn } from "@/lib/ui/cn"

export { FormProvider as Form }

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1", className)} {...props} />
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />
}

export function FormControl({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

export function FormMessage({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null
  return <p role="alert" className={cn("text-xs text-red-600 dark:text-red-400", className)}>{children}</p>
}

export function useZodErrorFor(name: string) {
  const { formState: { errors } } = useFormContext()
  const err = (errors as any)?.[name]
  if (!err) return ""
  return err?.message || err?.root?.message || ""
}
