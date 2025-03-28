"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { getInvoicesByUserId, getClientById, deleteInvoice, type Invoice, type Client } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FilePlus, MoreHorizontal, Printer, Search, Trash, FileText, Edit, LayoutGrid, List } from "lucide-react"
import { InvoiceKanban } from "@/components/invoice/invoice-kanban"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { useAlert } from "@/components/ui/alert-provider"
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { addAlert } = useAlert()

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) {
          setError("No se encontró información de usuario. Por favor, inicie sesión nuevamente.")
          setLoading(false)
          return
        }

        const userData = JSON.parse(storedUser)

        // Cargar facturas
        const userInvoices = await getInvoicesByUserId(userData.id)
        setInvoices(userInvoices)
        setFilteredInvoices(userInvoices)

        // Cargar información de clientes
        const clientsMap: Record<string, Client> = {}
        for (const invoice of userInvoices) {
          if (!clientsMap[invoice.clientId]) {
            try {
              const client = await getClientById(invoice.clientId)
              if (client) {
                clientsMap[invoice.clientId] = client
              }
            } catch (clientError) {
              console.error("Error al cargar cliente:", clientError)
              // Continuar con el siguiente cliente
            }
          }
        }
        setClients(clientsMap)
      } catch (error) {
        console.error("Error al cargar facturas:", error)
        setError("Ocurrió un error al cargar las facturas. Por favor, intente nuevamente.")
        addAlert({
          type: "error",
          title: "Error",
          message: "Ocurrió un error al cargar las facturas",
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [addAlert])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredInvoices(invoices)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredInvoices(
        invoices.filter((invoice) => {
          // Verificar si el cliente existe antes de acceder a sus propiedades
          const clientName = clients[invoice.clientId]?.name?.toLowerCase() || ""

          return (
            invoice.invoiceNumber.toLowerCase().includes(term) ||
            clientName.includes(term) ||
            formatDate(invoice.date).includes(term) ||
            getStatusText(invoice.status).toLowerCase().includes(term)
          )
        }),
      )
    }
  }, [searchTerm, invoices, clients])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleInvoiceUpdate = (updatedInvoice: Invoice) => {
    setInvoices((prev) => prev.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)))
  }

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return

    try {
      setIsDeleting(true)
      await deleteInvoice(invoiceToDelete.id)

      // Actualizar estado local
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id))
      setFilteredInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id))

      addAlert({
        type: "success",
        title: "Factura eliminada",
        message: `La factura #${invoiceToDelete.invoiceNumber} ha sido eliminada exitosamente`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al eliminar factura:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al eliminar la factura",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success border border-success/20"
      case "pending":
        return "bg-warning/10 text-warning border border-warning/20"
      case "overdue":
        return "bg-destructive/10 text-destructive border border-destructive/20"
      case "cancelled":
        return "bg-muted/10 text-muted-foreground border border-muted/20"
      default:
        return "bg-muted/10 text-muted-foreground border border-muted/20"
    }
  }

  const getStatusText = (status: string) => {
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-primary animate-pulse">Cargando facturas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Intentar nuevamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
          <p className="text-muted-foreground">Gestione todas sus facturas desde este panel</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-primary/10 text-primary" : ""}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Vista de lista</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("kanban")}
            className={viewMode === "kanban" ? "bg-primary/10 text-primary" : ""}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Vista Kanban</span>
          </Button>
          <Link href="/dashboard/facturas/nueva">
            <Button className="bg-primary hover:bg-primary/90 transition-colors">
              <FilePlus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Gestión de Facturas
          </CardTitle>
          <CardDescription>Administre todas sus facturas desde este panel</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2 bg-card p-2 rounded-md border border-primary/20">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente, fecha o estado..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-md border border-primary/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
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
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              No se encontraron facturas
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="font-medium">
                              <Link href={`/dashboard/facturas/${invoice.id}`} className="text-primary hover:underline">
                                {invoice.invoiceNumber}
                              </Link>
                            </TableCell>
                            <TableCell>{clients[invoice.clientId]?.name || "Cliente desconocido"}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}
                              >
                                {getStatusText(invoice.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Acciones</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/facturas/${invoice.id}`} className="cursor-pointer">
                                      <FileText className="mr-2 h-4 w-4" />
                                      Ver detalles
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/facturas/${invoice.id}/editar`} className="cursor-pointer">
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/dashboard/facturas/${invoice.id}/imprimir`}
                                      className="cursor-pointer"
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Imprimir
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(invoice)}
                                    className="text-destructive cursor-pointer"
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="kanban-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <InvoiceKanban invoices={filteredInvoices} clients={clients} onInvoiceUpdate={handleInvoiceUpdate} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La factura #{invoiceToDelete?.invoiceNumber} será eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

