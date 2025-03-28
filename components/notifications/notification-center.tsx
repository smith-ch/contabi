"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Trash2 } from "lucide-react"
import {
  getNotificationsByUserId,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  type Notification,
} from "@/lib/db"
import { NotificationItem } from "@/components/notifications/notification-item"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const loadNotifications = async () => {
      try {
        setLoading(true)
        const userNotifications = await getNotificationsByUserId(user.id)
        setNotifications(userNotifications)

        const count = await getUnreadNotificationsCount(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error("Error al cargar notificaciones:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Configurar intervalo para actualizar notificaciones cada minuto
    const interval = setInterval(loadNotifications, 60000)

    return () => clearInterval(interval)
  }, [user, isOpen])

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.id)

      // Actualizar estado local
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)

      toast({
        title: "Notificaciones marcadas como leídas",
        description: "Todas las notificaciones han sido marcadas como leídas",
        variant: "success",
      })
    } catch (error) {
      console.error("Error al marcar notificaciones como leídas:", error)
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas",
        variant: "destructive",
      })
    }
  }

  const handleClearAll = async () => {
    if (!user) return

    try {
      await deleteAllNotifications(user.id)

      // Actualizar estado local
      setNotifications([])
      setUnreadCount(0)

      toast({
        title: "Notificaciones eliminadas",
        description: "Todas las notificaciones han sido eliminadas",
        variant: "success",
      })
    } catch (error) {
      console.error("Error al eliminar notificaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar las notificaciones",
        variant: "destructive",
      })
    }
  }

  const handleNotificationUpdate = (updatedNotification: Notification) => {
    setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))

    // Actualizar contador de no leídas
    if (!updatedNotification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleNotificationDelete = (id: string) => {
    const deletedNotification = notifications.find((n) => n.id === id)

    setNotifications((prev) => prev.filter((n) => n.id !== id))

    // Actualizar contador de no leídas si la notificación eliminada no estaba leída
    if (deletedNotification && !deletedNotification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
              variant="default"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {unreadCount} sin leer
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="bg-muted/30 rounded-full p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No hay notificaciones</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Las notificaciones aparecerán aquí cuando haya actividad en su cuenta.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <NotificationItem
                    notification={notification}
                    onUpdate={handleNotificationUpdate}
                    onDelete={handleNotificationDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <SheetFooter className="border-t pt-4 flex-row justify-between">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={loading || unreadCount === 0}>
            <Check className="mr-2 h-4 w-4" />
            Marcar todo como leído
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} disabled={loading || notifications.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Borrar todo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

