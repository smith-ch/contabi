"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type AlertType = "info" | "success" | "warning" | "error"

interface Alert {
  id: string
  type: AlertType
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

interface AlertContextType {
  alerts: Alert[]
  addAlert: (alert: Omit<Alert, "id">) => void
  removeAlert: (id: string) => void
  clearAlerts: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const addAlert = (alert: Omit<Alert, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newAlert = { ...alert, id }
    setAlerts((prev) => [...prev, newAlert])

    // Auto-remove non-persistent alerts after duration
    if (!alert.persistent) {
      const duration = alert.duration || 5000
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }
  }

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert, clearAlerts }}>
      {children}
      <AlertDisplay />
    </AlertContext.Provider>
  )
}

function AlertDisplay() {
  const { alerts, removeAlert } = useAlert()

  const getIcon = (type: AlertType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "info":
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getAlertClasses = (type: AlertType) => {
    switch (type) {
      case "success":
        return "bg-success/10 border-success/30 text-success"
      case "warning":
        return "bg-warning/10 border-warning/30 text-warning"
      case "error":
        return "bg-destructive/10 border-destructive/30 text-destructive"
      case "info":
      default:
        return "bg-primary/10 border-primary/30 text-primary"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn("relative rounded-lg border p-4 shadow-lg backdrop-blur-sm", getAlertClasses(alert.type))}
          >
            <button
              onClick={() => removeAlert(alert.id)}
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-background/20"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <div className="flex gap-3">
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div>
                <h5 className="font-medium">{alert.title}</h5>
                <p className="text-sm mt-1">{alert.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
