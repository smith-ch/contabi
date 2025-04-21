"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, X } from "lucide-react"

interface ToastNotificationProps {
  type: "success" | "error" | "info"
  message: string
  duration?: number
  onClose?: () => void
}

export function ToastNotification({ type, message, duration = 5000, onClose }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      : type === "error"
        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"

  const textColor =
    type === "success"
      ? "text-green-600 dark:text-green-400"
      : type === "error"
        ? "text-red-600 dark:text-red-400"
        : "text-blue-600 dark:text-blue-400"

  const Icon = type === "success" ? CheckCircle : type === "error" ? AlertCircle : AlertCircle

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border p-4 shadow-lg ${bgColor}`}
      role="alert"
    >
      <Icon className={`h-5 w-5 ${textColor}`} />
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          if (onClose) onClose()
        }}
        className={`ml-auto rounded-full p-1 ${textColor} hover:bg-opacity-20 hover:bg-gray-200`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
