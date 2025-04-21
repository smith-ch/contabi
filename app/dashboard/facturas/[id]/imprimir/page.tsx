"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getInvoiceById, getClientById, type Invoice, type Client, type User } from "@/lib/db"
import { InvoicePrintView } from "@/components/invoice/invoice-print-view"
import { ArrowLeft, Printer, Download, Share2 } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { useAlert } from "@/components/ui/alert-provider"

export default function InvoicePrintPage() {
  const params = useParams()
  const id = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
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
        if (!storedUser) {
          router.push("/")
          return
        }

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

        // Verificar que la factura pertenezca al usuario
        if (invoiceData.userId !== userData.id) {
          toast({
            title: "Error",
            description: "No tiene permiso para ver esta factura",
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
        addAlert({
          type: "error",
          title: "Error",
          message: "Ocurrió un error al cargar la factura",
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, router, toast, addAlert])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!invoice || !client || !user || !printRef.current) return

    try {
      setGenerating(true)

      // Mostrar mensaje de carga
      addAlert({
        type: "info",
        title: "Generando PDF",
        message: "Por favor espere mientras se genera el PDF...",
        duration: 3000,
      })

      // Dar tiempo para que se renderice la vista de impresión
      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
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
      setGenerating(false)
    }
  }

  const handleShareInvoice = async () => {
    if (!invoice) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Factura ${invoice.invoiceNumber}`,
          text: `Factura ${invoice.invoiceNumber}`,
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-primary animate-pulse">Cargando factura...</p>
        </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={generating}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleShareInvoice} disabled={generating}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir
          </Button>
          <Button onClick={handleDownloadPDF} disabled={generating}>
            {generating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Generando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden"
      >
        <div ref={printRef} className="p-8 bg-white">
          <InvoicePrintView invoice={invoice} client={client} user={user} />
        </div>
      </motion.div>
    </div>
  )
}
