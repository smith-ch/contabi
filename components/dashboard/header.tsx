"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, UserIcon, Settings } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { checkOverdueInvoices } from "@/lib/db"

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar facturas vencidas al cargar el componente
    checkOverdueInvoices(user.id).catch(console.error)

    // Configurar intervalo para verificar facturas vencidas cada día
    const interval = setInterval(
      () => {
        checkOverdueInvoices(user.id).catch(console.error)
      },
      24 * 60 * 60 * 1000,
    ) // 24 horas

    return () => clearInterval(interval)
  }, [user.id])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    // Emitir evento para que el sidebar responda
    const event = new CustomEvent("toggle-sidebar", { detail: { isOpen: !isSidebarOpen } })
    window.dispatchEvent(event)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm transition-colors duration-300">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </Button>
        <h1 className="text-xl font-bold text-primary">ContaDom</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationCenter />
        <span className="hidden text-sm text-muted-foreground md:inline-block">{user.company}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full flex items-center gap-2 border-primary/20">
              <UserIcon className="h-4 w-4 text-primary" />
              <span className="hidden md:inline-block">{user.name.split(" ")[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracion" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
