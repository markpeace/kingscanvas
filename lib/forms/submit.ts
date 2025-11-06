"use client"
import { type FieldValues, type UseFormReturn } from "react-hook-form"

type Runner<TValues> = (values: TValues) => Promise<void>

export async function withSubmit<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  run: Runner<TValues>,
  opts?: { onSuccess?: () => void; onError?: (e: unknown) => void }
) {
  try {
    await run(form.getValues())
    opts?.onSuccess?.()
  } catch (e) {
    opts?.onError?.(e)
    throw e
  } finally {
    form.clearErrors()
  }
}
