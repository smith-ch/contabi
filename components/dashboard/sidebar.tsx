"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  FileText,
  Home,
  Receipt,
  Settings,
  Users,
  FileUp,
  Palette,
  HelpCircle,
  Database,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768)
    }

    const handleToggleSidebar = (e: Event) => {
      const customEvent = e as CustomEvent
      setIsOpen(customEvent.detail.isOpen)
    }

    // Inicializar estado basado en el tamaño de la pantalla
    handleResize()

    // Escuchar eventos de cambio de tamaño
    window.addEventListener("resize", handleResize)
    window.addEventListener("toggle-sidebar", handleToggleSidebar)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("toggle-sidebar", handleToggleSidebar)
    }
  }, [])

  // Añadir un nuevo elemento al array navItems para el diagnóstico
  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home },
    { href: "/dashboard/facturas", label: "Facturas", icon: FileText },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
    { href: "/dashboard/gastos", label: "Gastos", icon: Receipt },
    { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
    {
      href: "/dashboard/configuracion",
      label: "Configuración",
      icon: Settings,
      subItems: [
        { href: "/dashboard/configuracion", label: "General" },
        { href: "/dashboard/configuracion/plantilla-factura", label: "Plantilla de Factura", icon: Palette },
      ],
    },
    { href: "/dashboard/ayuda", label: "Ayuda", icon: HelpCircle },
    // Añadir este nuevo elemento
    {
      href: "/dashboard/diagnostico",
      label: "Diagnóstico",
      icon: Database,
      subItems: [
        { href: "/dashboard/diagnostico", label: "Verificar Tablas" },
        { href: "/dashboard/diagnostico/corregir-db", label: "Corregir Base de Datos", icon: RefreshCw },
      ],
    },
  ]

  if (!isOpen) {
    return null
  }

  return (
    <div className="w-64 flex-shrink-0 border-r bg-card transition-colors duration-300">
      <div className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white font-bold">
            C
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">ContaDom</h2>
            <p className="text-xs text-muted-foreground">Sistema de Contabilidad RD</p>
          </div>
        </div>
      </div>
      <nav className="flex h-full flex-col p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.subItems && item.subItems.some((subItem) => pathname === subItem.href))
            const Icon = item.icon

            return (
              <div key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <Icon className={cn("mr-2 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </Link>

                {item.subItems && isActive && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      const SubIcon = subItem.icon || FileUp

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                            isSubActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-primary/5 hover:text-primary",
                          )}
                        >
                          {subItem.icon && (
                            <SubIcon
                              className={cn("mr-2 h-4 w-4", isSubActive ? "text-primary" : "text-muted-foreground")}
                            />
                          )}
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <div className="rounded-md bg-primary/5 p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <h3 className="font-medium text-primary mb-1 text-sm relative z-10">Soporte Técnico</h3>
            <p className="text-xs text-muted-foreground relative z-10">¿Necesita ayuda con el sistema?</p>
            <Link href="/dashboard/ayuda">
              <Button variant="link" className="text-xs text-primary p-0 h-auto mt-1 relative z-10">
                <HelpCircle className="mr-1 h-3 w-3" />
                Contactar soporte
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
