"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ThemeProvider } from "next-themes"
import { AlertProvider } from "@/components/ui/alert-provider"
import { Toaster } from "@/components/ui/toaster"
import { initializeStorage } from "@/lib/storage"

export function Providers({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true)

  const initStorage = async () => {
    setIsInitializing(true)
    try {
      const result = await initializeStorage()
      if (!result.success) {
        console.warn("Advertencia al inicializar almacenamiento:", result.error)
      } else {
        console.log("Almacenamiento inicializado correctamente. Buckets disponibles:", result.buckets)
      }
    } catch (error) {
      console.error("Error inesperado al inicializar almacenamiento:", error)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    initStorage().catch(console.error)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AlertProvider>
        {children}
        <Toaster />
      </AlertProvider>
    </ThemeProvider>
  )
}
