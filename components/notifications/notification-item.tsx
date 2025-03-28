"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { markNotificationAsRead, deleteNotification, type Notification } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Check, Trash2, AlertCircle, Info, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface NotificationItemProps {
  notification: Notification
  onUpdate: (notification: Notification) => void
  onDelete: (id: string) => void
}

export function NotificationItem({ notification, onUpdate, onDelete }: NotificationItemProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleMarkAsRead = async () => {
    if (notification.read) return

    setLoading(true)
    try {
      await markNotificationAsRead(notification.id)

      // Actualizar estado local
      onUpdate({ ...notification, read: true })
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteNotification(notification.id)

      // Actualizar estado local
      onDelete(notification.id)

      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada",
        variant: "success",
      })
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      handleMarkAsRead()
    }

    // Navegar a la página relacionada si existe
    if (notification.relatedId && notification.relatedType) {
      switch (notification.relatedType) {
        case "invoice":
          router.push(`/dashboard/facturas/${notification.relatedId}`)
          break
        case "expense":
          router.push(`/dashboard/gastos`)
          break
        case "client":
          router.push(`/dashboard/clientes`)
          break
        default:
          break
      }
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-warning" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    })
  }

  return (
    <Card
      className={`mb-3 transition-colors ${
        notification.read ? "bg-card" : "bg-primary/5 dark:bg-primary/10 border-primary/20"
      } hover:bg-muted/50 cursor-pointer`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${!notification.read ? "text-primary" : ""}`}>{notification.title}</h4>
            <p className="text-sm text-muted-foreground mt-1 break-words">{notification.message}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">{getTimeAgo(notification.createdAt)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-0 flex justify-end gap-2">
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              handleMarkAsRead()
            }}
            disabled={loading}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Marcar como leída
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          disabled={loading}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  )
}

