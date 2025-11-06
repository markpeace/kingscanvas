"use client"

import { useToastContext } from "./ToastProvider"

export function useToast() {
  const { toast, success, error, info } = useToastContext()
  return { toast, success, error, info }
}
