"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sun, Moon, Laptop } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="rounded-full w-8 h-8 border-primary/20">
        <div className="h-4 w-4 bg-primary/20 rounded-full animate-pulse"></div>
        <span className="sr-only">Cambiar tema</span>
      </Button>
    )
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 border-primary/20 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              y: currentTheme === "dark" ? 0 : -30,
              opacity: currentTheme === "dark" ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4 text-indigo-400" />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              y: currentTheme === "light" ? 0 : 30,
              opacity: currentTheme === "light" ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4 text-amber-500" />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              y: theme === "system" ? 0 : currentTheme === "dark" ? 30 : -30,
              opacity: theme === "system" ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <Laptop className="h-4 w-4 text-slate-500" />
          </motion.div>

          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 fade-in-20">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Claro</span>
          {theme === "light" && (
            <motion.span layoutId="theme-check" className="ml-auto h-1 w-1 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer flex items-center gap-2">
          <Moon className="h-4 w-4 text-indigo-400" />
          <span>Oscuro</span>
          {theme === "dark" && (
            <motion.span layoutId="theme-check" className="ml-auto h-1 w-1 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer flex items-center gap-2">
          <Laptop className="h-4 w-4 text-slate-500" />
          <span>Sistema</span>
          {theme === "system" && (
            <motion.span layoutId="theme-check" className="ml-auto h-1 w-1 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
