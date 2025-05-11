"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Edit, MoreHorizontal, Trash2, FileText, Printer, Plus } from "lucide-react"
import { deleteInvoice } from "../actions"

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total: number
  status: string
  clients: {
    id: string
    name: string
    rnc: string
  }
}

type InvoiceListProps = {
  invoices: Invoice[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return

    setIsDeleting(true)
    try {
      await deleteInvoice(invoiceToDelete, "userId") // Reemplazar con el userId real
      router.refresh()
    } catch (error) {
      console.error("Error al eliminar factura:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "pagada":
        return "bg-green-100 text-green-800"
      case "parcialmente pagada":
        return "bg-blue-100 text-blue-800"
      case "vencida":
        return "bg-red-100 text-red-800"
      case "cancelada":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No hay facturas registradas</p>
        <Link href="/dashboard/facturas/nueva">
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" /> Crear Factura
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.clients.name}</TableCell>
                <TableCell>{format(new Date(invoice.issue_date), "dd MMM yyyy", { locale: es })}</TableCell>
                <TableCell>{format(new Date(invoice.due_date), "dd MMM yyyy", { locale: es })}</TableCell>
                <TableCell>RD$ {invoice.total.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/facturas/${invoice.id}`)}>
                        <FileText className="h-4 w-4 mr-2" /> Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/facturas/${invoice.id}/editar`)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/facturas/${invoice.id}/imprimir`)}>
                        <Printer className="h-4 w-4 mr-2" /> Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(invoice.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta factura y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
