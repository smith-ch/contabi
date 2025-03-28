"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getInvoiceById, getClientById, type Invoice, type Client, type User } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Download, Edit, Printer, Share2 } from "lucide-react"
import { InvoicePrintView } from "@/components/invoice/invoice-print-view"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useAlert } from "@/components/ui/alert-provider"

export default function InvoiceDetailPage() {
  // Usar useParams en lugar de React.use
  const params = useParams()
  const id = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { addAlert } = useAlert()

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) {
          router.push("/dashboard/facturas")
          return
        }

        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) return

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Cargar factura
        const invoiceData = await getInvoiceById(id)
        if (!invoiceData) {
          toast({
            title: "Error",
            description: "Factura no encontrada",
            variant: "destructive",
          })
          router.push("/dashboard/facturas")
          return
        }

        setInvoice(invoiceData)

        // Cargar cliente
        const clientData = await getClientById(invoiceData.clientId)
        if (clientData) {
          setClient(clientData)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar la factura",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, router, toast])

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const handleDownloadPDF = async () => {
    if (!invoice || !client || !user) return

    try {
      setIsPrinting(true)

      // Mostrar mensaje de carga
      addAlert({
        type: "info",
        title: "Generando PDF",
        message: "Por favor espere mientras se genera el PDF...",
        duration: 3000,
      })

      // Dar tiempo para que se renderice la vista de impresión
      await new Promise((resolve) => setTimeout(resolve, 500))

      const printElement = document.getElementById("invoice-print-view")
      if (!printElement) return

      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`Factura-${invoice.invoiceNumber}.pdf`)

      addAlert({
        type: "success",
        title: "PDF generado",
        message: "El PDF ha sido generado exitosamente",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al generar el PDF",
        duration: 5000,
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleShareInvoice = async () => {
    if (!invoice) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Factura ${invoice.invoiceNumber}`,
          text: `Factura ${invoice.invoiceNumber} por ${formatCurrency(invoice.total)}`,
          url: window.location.href,
        })
      } else {
        // Copiar al portapapeles si Web Share API no está disponible
        await navigator.clipboard.writeText(window.location.href)
        addAlert({
          type: "success",
          title: "Enlace copiado",
          message: "El enlace de la factura ha sido copiado al portapapeles",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error al compartir:", error)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!invoice || !client || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Factura no encontrada</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/facturas")}>
          Volver a Facturas
        </Button>
      </div>
    )
  }

  if (isPrinting) {
    return (
      <div id="invoice-print-view">
        <InvoicePrintView invoice={invoice} client={client} user={user} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/facturas")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Factura #{invoice.invoiceNumber}</h2>
          <span className={`ml-2 rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
            {getStatusText(invoice.status)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/facturas/${invoice.id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleShareInvoice}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{client.name}</p>
            <p>RNC: {client.rnc}</p>
            <p>{client.address}</p>
            <p>{client.email}</p>
            <p>{client.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de Emisión:</span>
              <span>{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de Vencimiento:</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                {getStatusText(invoice.status)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Descripción</th>
                  <th className="p-2 text-center font-medium">Cantidad</th>
                  <th className="p-2 text-right font-medium">Precio</th>
                  <th className="p-2 text-center font-medium">ITBIS</th>
                  <th className="p-2 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                    <td className="p-2 text-center">{item.taxable ? "Sí" : "No"}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-2 text-right">
            <div className="flex justify-end">
              <span className="w-32 text-muted-foreground">Subtotal:</span>
              <span className="w-32 font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-end">
              <span className="w-32 text-muted-foreground">ITBIS ({invoice.taxRate * 100}%):</span>
              <span className="w-32 font-medium">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-end">
              <span className="w-32 text-muted-foreground">Total:</span>
              <span className="w-32 text-xl font-bold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

