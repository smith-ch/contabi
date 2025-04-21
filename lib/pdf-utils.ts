/**
 * Utilidades mejoradas para la generación de PDF
 */

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

/**
 * Exporta un elemento HTML a PDF con opciones mejoradas
 */
export async function exportToPDF(
  elementId: string,
  fileName = "reporte.pdf",
  orientation: "portrait" | "landscape" = "landscape",
  scale = 2,
): Promise<boolean> {
  try {
    // Obtener el elemento
    const element = document.getElementById(elementId)
    if (!element) {
      console.error(`Elemento con ID ${elementId} no encontrado`)
      return false
    }

    // Crear un clon del elemento para no modificar el original
    const clone = element.cloneNode(true) as HTMLElement

    // Establecer estilos para el clon
    clone.style.width = `${element.scrollWidth}px`
    clone.style.height = `${element.scrollHeight}px`
    clone.style.position = "absolute"
    clone.style.top = "-9999px"
    clone.style.left = "-9999px"
    clone.style.overflow = "visible"
    clone.style.background = "white"
    clone.classList.add("printing")

    // Añadir el clon al documento
    document.body.appendChild(clone)

    // Esperar a que los estilos se apliquen
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      // Configurar opciones para html2canvas
      const canvas = await html2canvas(clone, {
        scale: scale, // Mayor resolución
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      })

      // Configurar dimensiones del PDF
      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pdfWidth = orientation === "landscape" ? 297 : 210
      const pdfHeight = orientation === "landscape" ? 210 : 297

      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calcular la escala para ajustar el contenido al PDF
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95

      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10 // Margen superior

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      pdf.save(fileName)
      return true
    } catch (error) {
      console.error("Error al generar el canvas:", error)
      throw error
    } finally {
      // Eliminar el clon después de capturar
      document.body.removeChild(clone)
    }
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    return false
  }
}

/**
 * Imprime un elemento HTML con estilos mejorados
 */
export function printElement(elementId: string): boolean {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error(`Elemento con ID ${elementId} no encontrado`)
      return false
    }

    // Crear un iframe oculto para imprimir
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    document.body.appendChild(iframe)

    // Escribir el contenido del elemento en el iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      console.error("No se pudo acceder al documento del iframe")
      return false
    }

    // Obtener estilos de la página actual
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n")
        } catch (e) {
          return ""
        }
      })
      .join("\n")

    // Clonar el elemento para no modificar el original
    const clone = element.cloneNode(true) as HTMLElement

    // Agregar estilos de impresión
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impresión</title>
          <style>
            ${styles}
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
          ${clone.outerHTML}
        </body>
      </html>
    `)

    iframeDoc.close()

    // Imprimir y eliminar el iframe
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()

      // Eliminar el iframe después de imprimir
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 500)

    return true
  } catch (error) {
    console.error("Error al imprimir:", error)
    return false
  }
}
