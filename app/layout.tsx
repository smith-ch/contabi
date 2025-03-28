import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AlertProvider } from "@/components/ui/alert-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Contabilidad RD",
  description: "Sistema de contabilidad adaptado a las regulaciones fiscales de la República Dominicana",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AlertProvider>
            {children}
            <Toaster />
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'