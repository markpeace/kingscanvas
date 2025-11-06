import * as React from "react"

import { cn } from "@/lib/ui/cn"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
  wrapperClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      startAdornment,
      endAdornment,
      wrapperClassName,
      className,
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined

    return (
      <div className={cn("grid gap-1.5", wrapperClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            {label}
          </label>
        ) : null}

        <div
          className={cn(
            "flex items-center rounded-md border bg-white transition-colors focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:bg-zinc-950 dark:focus-within:ring-offset-zinc-950",
            error
              ? "border-rose-500 focus-within:ring-rose-500"
              : "border-zinc-300 dark:border-zinc-700"
          )}
        >
          {startAdornment ? (
            <span className="pl-3 pr-2 text-sm text-zinc-500 dark:text-zinc-400">
              {startAdornment}
            </span>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-zinc-50",
              startAdornment ? "pl-0" : undefined,
              endAdornment ? "pr-0" : undefined,
              className
            )}
            {...props}
          />

          {endAdornment ? (
            <span className="pl-2 pr-3 text-sm text-zinc-500 dark:text-zinc-400">
              {endAdornment}
            </span>
          ) : null}
        </div>

        {error ? (
          <p
            id={errorId}
            className="text-sm text-rose-600 dark:text-rose-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {hint ? (
          <p
            id={hintId}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"
