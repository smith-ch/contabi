"use client"

import type React from "react"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { AlertProvider } from "@/components/ui/alert-provider"
import { Toaster } from "@/components/ui/toaster"
import { initializeStorage } from "@/lib/storage"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar almacenamiento
    initializeStorage().catch(console.error)
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

