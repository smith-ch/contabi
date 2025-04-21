"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Invoice, Client } from "@/lib/db"
import { motion } from "framer-motion"
import { FileText, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react"
import Link from "next/link"

interface SortableInvoiceItemProps {
  invoice: Invoice
  client: Client | undefined
  status: "pending" | "paid" | "overdue" | "cancelled"
}

export function SortableInvoiceItem({ invoice, client, status }: SortableInvoiceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: invoice.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  const getStatusIcon = () => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "cancelled":
        return <Ban className="h-4 w-4 text-muted-foreground" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (): string => {
    switch (status) {
      case "paid":
        return "bg-success/10 border-success/30 hover:bg-success/20"
      case "pending":
        return "bg-warning/10 border-warning/30 hover:bg-warning/20"
      case "overdue":
        return "bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
      case "cancelled":
        return "bg-muted/10 border-muted/30 hover:bg-muted/20"
      default:
        return "bg-primary/10 border-primary/30 hover:bg-primary/20"
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 ${getStatusColor()}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/dashboard/facturas/${invoice.id}`} className="block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">#{invoice.invoiceNumber}</span>
          </div>
          <span className="text-sm font-bold">{formatCurrency(invoice.total)}</span>
        </div>
        <div className="mt-2 text-xs">
          <p>{client?.name || "Cliente desconocido"}</p>
          <p className="mt-1 text-muted-foreground">Vence: {formatDate(invoice.dueDate)}</p>
        </div>
      </Link>
    </motion.div>
  )
}
