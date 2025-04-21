"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
// Asegurarnos de que estamos importando desde el archivo correcto
import { updateInvoice, type Invoice, type Client } from "@/lib/db"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableInvoiceItem } from "@/components/invoice/sortable-invoice-item"
import { FileText, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react"

interface InvoiceKanbanProps {
  invoices: Invoice[]
  clients: Record<string, Client>
  onInvoiceUpdate: (updatedInvoice: Invoice) => void
}

type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled"

interface InvoicesByStatus {
  pending: Invoice[]
  paid: Invoice[]
  overdue: Invoice[]
  cancelled: Invoice[]
}

export function InvoiceKanban({ invoices, clients, onInvoiceUpdate }: InvoiceKanbanProps) {
  const [invoicesByStatus, setInvoicesByStatus] = useState<InvoicesByStatus>({
    pending: [],
    paid: [],
    overdue: [],
    cancelled: [],
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    // Organizar facturas por estado
    const grouped = invoices.reduce(
      (acc, invoice) => {
        acc[invoice.status].push(invoice)
        return acc
      },
      { pending: [], paid: [], overdue: [], cancelled: [] } as InvoicesByStatus,
    )

    setInvoicesByStatus(grouped)
  }, [invoices])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    const draggedInvoice = invoices.find((invoice) => invoice.id === active.id)
    if (draggedInvoice) {
      setActiveInvoice(draggedInvoice)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const invoiceId = active.id as string
    const newStatus = over.id as InvoiceStatus

    if (newStatus === "pending" || newStatus === "paid" || newStatus === "overdue" || newStatus === "cancelled") {
      const invoiceToUpdate = invoices.find((invoice) => invoice.id === invoiceId)

      if (invoiceToUpdate && invoiceToUpdate.status !== newStatus) {
        try {
          const updatedInvoice = { ...invoiceToUpdate, status: newStatus }
          // Usar la función de Supabase para actualizar la factura
          await updateInvoice(updatedInvoice)

          // Actualizar estado local
          setInvoicesByStatus((prev) => {
            const newState = { ...prev }

            // Eliminar de estado anterior
            newState[invoiceToUpdate.status] = newState[invoiceToUpdate.status].filter((inv) => inv.id !== invoiceId)

            // Añadir a nuevo estado
            newState[newStatus] = [...newState[newStatus], updatedInvoice]

            return newState
          })

          // Notificar al componente padre
          onInvoiceUpdate(updatedInvoice)

          toast({
            title: "Estado actualizado",
            description: `La factura #${invoiceToUpdate.invoiceNumber} ha sido movida a ${getStatusText(newStatus)}`,
            variant: "success",
          })
        } catch (error) {
          console.error("Error al actualizar estado:", error)
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado de la factura",
            variant: "destructive",
          })
        }
      }
    }

    setActiveId(null)
    setActiveInvoice(null)
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case "paid":
        return "Pagada"
      case "pending":
        return "Pendiente"
      case "overdue":
        return "Vencida"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case "cancelled":
        return <Ban className="h-5 w-5 text-muted-foreground" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return "bg-success/10 border-success/30 text-success"
      case "pending":
        return "bg-warning/10 border-warning/30 text-warning"
      case "overdue":
        return "bg-destructive/10 border-destructive/30 text-destructive"
      case "cancelled":
        return "bg-muted/10 border-muted/30 text-muted-foreground"
      default:
        return "bg-primary/10 border-primary/30 text-primary"
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Columna: Pendientes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            <h3 className="font-medium">Pendientes</h3>
            <Badge variant="outline" className="ml-auto bg-warning/10 text-warning">
              {invoicesByStatus.pending.length}
            </Badge>
          </div>

          <div
            id="pending"
            className={`min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-colors ${
              activeId ? "border-warning bg-warning/5" : "border-transparent"
            }`}
          >
            <SortableContext items={invoicesByStatus.pending.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {invoicesByStatus.pending.length === 0 ? (
                <div className="flex h-full min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center animate-pulse">
                  <p className="text-sm text-muted-foreground">No hay facturas pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoicesByStatus.pending.map((invoice) => (
                    <SortableInvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      client={clients[invoice.clientId]}
                      status="pending"
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </div>

        {/* Columna: Pagadas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="font-medium">Pagadas</h3>
            <Badge variant="outline" className="ml-auto bg-success/10 text-success">
              {invoicesByStatus.paid.length}
            </Badge>
          </div>

          <div
            id="paid"
            className={`min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-colors ${
              activeId ? "border-success bg-success/5" : "border-transparent"
            }`}
          >
            <SortableContext items={invoicesByStatus.paid.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {invoicesByStatus.paid.length === 0 ? (
                <div className="flex h-full min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center animate-pulse">
                  <p className="text-sm text-muted-foreground">No hay facturas pagadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoicesByStatus.paid.map((invoice) => (
                    <SortableInvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      client={clients[invoice.clientId]}
                      status="paid"
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </div>

        {/* Columna: Vencidas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-medium">Vencidas</h3>
            <Badge variant="outline" className="ml-auto bg-destructive/10 text-destructive">
              {invoicesByStatus.overdue.length}
            </Badge>
          </div>

          <div
            id="overdue"
            className={`min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-colors ${
              activeId ? "border-destructive bg-destructive/5" : "border-transparent"
            }`}
          >
            <SortableContext items={invoicesByStatus.overdue.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {invoicesByStatus.overdue.length === 0 ? (
                <div className="flex h-full min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center animate-pulse">
                  <p className="text-sm text-muted-foreground">No hay facturas vencidas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoicesByStatus.overdue.map((invoice) => (
                    <SortableInvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      client={clients[invoice.clientId]}
                      status="overdue"
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </div>

        {/* Columna: Canceladas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Canceladas</h3>
            <Badge variant="outline" className="ml-auto bg-muted/10 text-muted-foreground">
              {invoicesByStatus.cancelled.length}
            </Badge>
          </div>

          <div
            id="cancelled"
            className={`min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-colors ${
              activeId ? "border-muted bg-muted/5" : "border-transparent"
            }`}
          >
            <SortableContext items={invoicesByStatus.cancelled.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {invoicesByStatus.cancelled.length === 0 ? (
                <div className="flex h-full min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center animate-pulse">
                  <p className="text-sm text-muted-foreground">No hay facturas canceladas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoicesByStatus.cancelled.map((invoice) => (
                    <SortableInvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      client={clients[invoice.clientId]}
                      status="cancelled"
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </div>
      </div>

      {/* Overlay para el elemento arrastrado */}
      <DragOverlay>
        {activeId && activeInvoice && (
          <div className={`rounded-lg border p-3 shadow-md ${getStatusColor(activeInvoice.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(activeInvoice.status)}
                <span className="font-medium">#{activeInvoice.invoiceNumber}</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(activeInvoice.total)}</span>
            </div>
            <div className="mt-2 text-xs">
              <p>{clients[activeInvoice.clientId]?.name || "Cliente"}</p>
              <p className="mt-1 text-muted-foreground">Vence: {formatDate(activeInvoice.dueDate)}</p>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
