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

    // Preparar el elemento para la captura
    const originalStyles = {
      width: element.style.width,
      height: element.style.height,
      overflow: element.style.overflow,
      position: element.style.position,
      background: element.style.background,
    }

    // Aplicar estilos temporales para la captura
    element.style.width = `${element.scrollWidth}px`
    element.style.height = `${element.scrollHeight}px`
    element.style.overflow = "visible"
    element.style.background = "white"

    // Aplicar clase de impresión
    element.classList.add("printing")

    // Esperar a que los estilos se apliquen
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Configurar opciones para html2canvas
    const canvas = await html2canvas(element, {
      scale: scale, // Mayor resolución
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (document, clonedElement) => {
        // Asegurar que los estilos se apliquen al clon
        clonedElement.style.width = `${element.scrollWidth}px`
        clonedElement.style.height = `${element.scrollHeight}px`
        clonedElement.style.overflow = "visible"
        clonedElement.style.background = "white"
        clonedElement.classList.add("printing")
      },
    })

    // Restaurar estilos originales
    element.style.width = originalStyles.width
    element.style.height = originalStyles.height
    element.style.overflow = originalStyles.overflow
    element.style.position = originalStyles.position
    element.style.background = originalStyles.background
    element.classList.remove("printing")

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
          ${element.outerHTML}
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

