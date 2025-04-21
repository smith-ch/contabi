/**
 * Utilidades para cálculos y formateo de reportes
 */

import { format } from "date-fns"
import { es } from "date-fns/locale"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

// Constantes para cálculos de impuestos
export const ITBIS_RATE = 0.18 // 18% tasa de ITBIS en República Dominicana

/**
 * Formatea una fecha al formato dominicano estándar (DD/MM/YYYY)
 */
export function formatDominicanDate(date: string | Date): string {
  if (!date) return "-"
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "dd/MM/yyyy", { locale: es })
}

/**
 * Formatea un valor de moneda al formato de Peso Dominicano
 */
export function formatDominicanCurrency(value: number): string {
  if (value === undefined || value === null) return "RD$0.00"

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Extrae el monto base e ITBIS de un monto total
 * @param totalAmount El monto total incluyendo ITBIS
 * @param itbisIncluded Si el monto total incluye ITBIS
 * @param hasItbis Si el ítem tiene ITBIS aplicado
 * @returns Un objeto con baseAmount e itbisAmount
 */
export function extractBaseAndItbis(
  totalAmount: number,
  itbisIncluded = true,
  hasItbis = true,
): { baseAmount: number; itbisAmount: number } {
  if (!hasItbis) {
    return {
      baseAmount: totalAmount,
      itbisAmount: 0,
    }
  }

  if (itbisIncluded) {
    // Si el ITBIS está incluido en el monto total, extraerlo
    // Fórmula: baseAmount = totalAmount / (1 + ITBIS_RATE)
    const baseAmount = +(totalAmount / (1 + ITBIS_RATE)).toFixed(2)
    const itbisAmount = +(totalAmount - baseAmount).toFixed(2)
    return { baseAmount, itbisAmount }
  } else {
    // Si el ITBIS no está incluido, calcularlo
    // Fórmula: itbisAmount = baseAmount * ITBIS_RATE
    const baseAmount = totalAmount
    const itbisAmount = +(baseAmount * ITBIS_RATE).toFixed(2)
    return { baseAmount, itbisAmount }
  }
}

/**
 * Determina si una categoría de gasto está sujeta a ITBIS
 */
export function isItbisApplicable(category: string): boolean {
  const itbisCategories = [
    "Bienes",
    "Servicios",
    "Alquileres",
    "Importaciones",
    "Telecomunicaciones",
    "Electricidad",
    "Agua",
  ]

  return itbisCategories.includes(category)
}

/**
 * Obtiene el código de tipo de documento para el reporte 606
 */
export function getDocumentTypeCode(docType: string): string {
  const docTypes: Record<string, string> = {
    Factura: "01",
    "Factura de Consumo Electrónica": "02",
    "Nota de Débito": "03",
    "Nota de Crédito": "04",
    "Comprobante de Compras": "11",
    "Registro Único de Ingresos": "12",
    "Registro de Proveedores Informales": "13",
    "Registro de Gastos Menores": "14",
    "Comprobante de Compras al Exterior": "15",
    "Comprobante Gubernamental": "16",
    "Comprobante para Exportaciones": "17",
    "Comprobante para Pagos al Exterior": "18",
  }

  return docTypes[docType] || "01"
}

/**
 * Obtiene el código de método de pago para el reporte 606
 */
export function getPaymentMethodCode(method: string): string {
  const methods: Record<string, string> = {
    Efectivo: "01",
    "Cheques/Transferencias/Depósito": "02",
    "Tarjeta Crédito/Débito": "03",
    "Compra a Crédito": "04",
    Permuta: "05",
    "Nota de Crédito": "06",
    Mixto: "07",
  }

  return methods[method] || "01"
}

/**
 * Exporta el reporte a PDF
 */
export async function exportToPDF(
  elementId: string,
  fileName = "reporte-606.pdf",
  orientation: "portrait" | "landscape" = "landscape",
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`)
    }

    // Aplicar estilos de impresión temporalmente
    element.classList.add("printing")

    // Configurar opciones para html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Mayor resolución
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    // Remover estilos de impresión
    element.classList.remove("printing")

    // Configurar dimensiones del PDF
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: "a4",
    })

    const pdfWidth = orientation === "landscape" ? 297 : 210
    const pdfHeight = orientation === "landscape" ? 210 : 297

    const imgWidth = canvas.width
    const imgHeight = canvas.height

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    pdf.save(fileName)
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    throw error
  }
}

/**
 * Imprime el reporte
 */
export function printReport(elementId: string): void {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Elemento con ID ${elementId} no encontrado`)
    return
  }

  // Crear un iframe oculto para imprimir
  const iframe = document.createElement("iframe")
  iframe.style.display = "none"
  document.body.appendChild(iframe)

  // Escribir el contenido del elemento en el iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    console.error("No se pudo acceder al documento del iframe")
    return
  }

  // Agregar estilos de impresión
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte 606</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10mm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 2mm;
            font-size: 10pt;
          }
          th {
            background-color: #f0f0f0;
          }
          .header {
            text-align: center;
            margin-bottom: 5mm;
          }
          .footer {
            margin-top: 5mm;
            text-align: right;
            font-size: 8pt;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)

  iframeDoc.close()

  // Imprimir y eliminar el iframe
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()

  // Eliminar el iframe después de imprimir
  setTimeout(() => {
    document.body.removeChild(iframe)
  }, 1000)
}
