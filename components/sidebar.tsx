"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  Package,
  Settings,
  Users,
  HelpCircle,
  Wrench,
  FileBarChart,
  Banknote,
  Receipt,
  User,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAlert } from "@/components/ui/alert-provider"
import { motion } from "framer-motion"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { addAlert } = useAlert()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    addAlert({
      type: "success",
      title: "Sesión cerrada",
      message: "Ha cerrado sesión correctamente",
      duration: 3000,
    })
    router.push("/login")
  }

  return (
    <div
      className={cn("pb-12 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950", className)}
    >
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <motion.h2
              className="text-lg font-semibold tracking-tight text-blue-800 dark:text-blue-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Sistema Contable RD
            </motion.h2>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={user?.logo || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback className="bg-blue-600 text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
                  {user?.name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email || "usuario@ejemplo.com"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-3">
          <div className="h-[2px] bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-800 dark:via-blue-600 dark:to-blue-800 rounded-full" />
        </div>
        <div className="px-3">
          <div className="space-y-1">
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard" passHref>
                <Button
                  variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname === "/dashboard"
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Inicio
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/facturas" passHref>
                <Button
                  variant={pathname.includes("/dashboard/facturas") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/facturas")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Facturas
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/clientes" passHref>
                <Button
                  variant={pathname.includes("/dashboard/clientes") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/clientes")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Clientes
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/gastos" passHref>
                <Button
                  variant={pathname.includes("/dashboard/gastos") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/gastos")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gastos
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/productos" passHref>
                <Button
                  variant={pathname.includes("/dashboard/productos") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/productos")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Productos
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/reportes" passHref>
                <Button
                  variant={pathname.includes("/dashboard/reportes") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/reportes")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reportes
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/soporte" passHref>
                <Button
                  variant={pathname.includes("/dashboard/soporte") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/soporte")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Soporte Técnico
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/diagnostico" passHref>
                <Button
                  variant={pathname.includes("/dashboard/diagnostico") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/diagnostico")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Diagnóstico
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/perfil" passHref>
                <Button
                  variant={pathname.includes("/dashboard/perfil") ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname.includes("/dashboard/perfil")
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-300"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900",
                  )}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="px-3">
          <div className="h-[2px] bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-800 dark:via-blue-600 dark:to-blue-800 rounded-full" />
        </div>
        <div className="px-3">
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-sm font-semibold text-blue-800 dark:text-blue-300">Accesos Rápidos</h3>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/facturas/nueva" passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Nueva Factura
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/reportes/reporte-606" passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <FileBarChart className="mr-2 h-4 w-4" />
                  Reporte 606
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/clientes/nuevo" passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <User className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="/dashboard/gastos/nuevo" passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Nuevo Gasto
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="px-3 mt-auto">
          <div className="h-[2px] bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-800 dark:via-blue-600 dark:to-blue-800 rounded-full" />
        </div>
        <div className="px-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

