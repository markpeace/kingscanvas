"use client"

import toast from "react-hot-toast"

type ToastHandler = (title: string, description?: string) => string

function formatMessage(title: string, description?: string) {
  return description ? `${title}\n${description}` : title
}

export function useToast() {
  const base: ToastHandler = (title, description) => toast(formatMessage(title, description))
  const success: ToastHandler = (title, description) => toast.success(formatMessage(title, description))
  const error: ToastHandler = (title, description) => toast.error(formatMessage(title, description))
  const info: ToastHandler = (title, description) => toast(formatMessage(title, description), { icon: "ℹ️" })
  const warning: ToastHandler = (title, description) => toast(formatMessage(title, description), { icon: "⚠️" })

  return {
    toast: base,
    success,
    error,
    info,
    warning
  }
}
