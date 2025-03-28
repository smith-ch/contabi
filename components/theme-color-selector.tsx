"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { useAlert } from "@/components/ui/alert-provider"

const themes = [
  { name: "default", color: "#4f46e5", label: "Índigo" },
  { name: "blue", color: "#3b82f6", label: "Azul" },
  { name: "green", color: "#22c55e", label: "Verde" },
  { name: "purple", color: "#a855f7", label: "Púrpura" },
  { name: "amber", color: "#f59e0b", label: "Ámbar" },
]

export function ThemeColorSelector() {
  const [currentTheme, setCurrentTheme] = useState("default")
  const { addAlert } = useAlert()

  useEffect(() => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem("color-theme")
    if (savedTheme) {
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (themeName: string) => {
    // Eliminar todas las clases de tema
    document.documentElement.classList.remove("theme-blue", "theme-green", "theme-purple", "theme-amber")

    // Aplicar el nuevo tema si no es el predeterminado
    if (themeName !== "default") {
      document.documentElement.classList.add(`theme-${themeName}`)
    }

    // Guardar preferencia
    localStorage.setItem("color-theme", themeName)
  }

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName)
    applyTheme(themeName)

    // Mostrar alerta
    const theme = themes.find((t) => t.name === themeName)
    if (theme) {
      addAlert({
        type: "success",
        title: "Tema actualizado",
        message: `El tema ha sido cambiado a ${theme.label}`,
        duration: 3000,
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {themes.map((theme) => (
        <motion.div key={theme.name} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            variant="outline"
            className="w-12 h-12 rounded-full p-0 relative border-2 transition-all duration-300"
            style={{
              backgroundColor: theme.color,
              borderColor: currentTheme === theme.name ? theme.color : "transparent",
              boxShadow: currentTheme === theme.name ? `0 0 0 2px ${theme.color}40` : "none",
            }}
            onClick={() => handleThemeChange(theme.name)}
            title={theme.label}
          >
            {currentTheme === theme.name && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check className="h-5 w-5 text-white drop-shadow-md" />
              </motion.div>
            )}
            <span className="sr-only">{theme.label}</span>
          </Button>
          <p className="text-xs text-center mt-1 text-muted-foreground">{theme.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

