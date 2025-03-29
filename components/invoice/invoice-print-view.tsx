"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
// Asegurarnos de que estamos importando desde el archivo correcto
import type { Invoice, Client, User } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"
import { getFileUrl, BUCKETS } from "@/lib/storage"

// Extender el tipo User para incluir la propiedad 'logo'
interface ExtendedUser extends User {
  logo?: string
}

interface InvoicePrintViewProps {
  invoice: Invoice
  client: Client
  user: ExtendedUser
}

export function InvoicePrintView({ invoice, client, user }: InvoicePrintViewProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [config, setConfig] = useState({
    primaryColor: "#4f46e5",
    secondaryColor: "#e5e7eb",
    showLogo: true,
    showFooter: true,
    footerText:
      "Gracias por su preferencia. Este documento es una factura fiscal válida según las regulaciones de la República Dominicana.",
    showSignature: false,
    signatureText: "Firma autorizada",
    showWatermark: false,
    watermarkText: "PAGADO",
    showQRCode: false,
  })

  useEffect(() => {
    // Cargar configuración guardada
    const savedConfig = localStorage.getItem("invoiceTemplateConfig")
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }

    // Cargar el logo de la compañía si está disponible
    const loadLogo = async () => {
      if (user.logo) {
        try {
          const url = await getFileUrl(BUCKETS.LOGOS, user.logo)
          if (url) {
            setLogoUrl(url)
          }
        } catch (error) {
          console.error("Error loading logo:", error)
        }
      }
    }

    loadLogo()
  }, [user.logo])

  // Calcular la base imponible (solo los items taxable)
  const taxableAmount = invoice.items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0)

  // Generar datos para el código QR
  const qrData = JSON.stringify({
    invoice: invoice.invoiceNumber,
    date: formatDate(invoice.date),
    client: client.name,
    rnc: client.rnc,
    total: invoice.total,
    currency: "RD$",
  })

  return (
    <div className={`relative ${isDark ? "text-white" : "text-black"}`}>
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color: black !important;
            background: white !important;
          }
          .print-white {
            color: black !important;
            background: white !important;
          }
          .print-black {
            color: black !important;
          }
        }
      `}</style>

      {/* Marca de agua */}
      {config.showWatermark && invoice.status === "paid" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="transform rotate-45 text-6xl font-bold opacity-10"
            style={{ color: isDark ? `${config.primaryColor}80` : config.primaryColor }}
          >
            {config.watermarkText}
          </div>
        </div>
      )}

      <div className="relative print-white">
        {/* Encabezado */}
        <div className="mb-8 flex justify-between">
          <div className="max-w-[50%]">
            {config.showLogo && logoUrl && (
              <div className="mb-3 max-h-20">
                <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="h-16 object-contain" />
              </div>
            )}
            <h1
              className="text-xl font-bold print-black"
              style={{ color: isDark ? `${config.primaryColor}FF` : config.primaryColor }}
            >
              {user.company}
            </h1>
            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{user.address || "DOM"}</p>
            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{user.phone || ""}</p>
            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{user.email}</p>
            <p className={isDark ? "text-gray-300" : "text-gray-700"}>RNC: {user.rnc}</p>
          </div>
          <div className="text-right">
            <h2
              className="text-xl font-bold mb-2 print-black"
              style={{ color: isDark ? `${config.primaryColor}FF` : config.primaryColor }}
            >
              Factura de Impuestos
            </h2>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className={isDark ? "font-medium text-gray-400" : "font-medium text-gray-500"}>FACTURA N.°</span>
                <span className="print-black">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? "font-medium text-gray-400" : "font-medium text-gray-500"}>FECHA</span>
                <span className="print-black">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? "font-medium text-gray-400" : "font-medium text-gray-500"}>CONDICIONES</span>
                <span className="print-black">
                  Pago en {Math.round((invoice.dueDate.getTime() - invoice.date.getTime()) / (1000 * 60 * 60 * 24))}{" "}
                  días
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? "font-medium text-gray-400" : "font-medium text-gray-500"}>
                  FECHA DE VENCIMIENTO
                </span>
                <span className="print-black">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="mb-8">
          <h3 className={`mb-2 font-medium uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>FACTURAR A</h3>
          <p className="font-medium print-black">{client.name}</p>
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>{client.rnc}</p>
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>{client.address}</p>
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>{client.email}</p>
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>{client.phone}</p>
        </div>

        {/* Tabla de items */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? `${config.secondaryColor}20` : config.secondaryColor,
                }}
              >
                <th
                  className={`border-b p-2 text-left font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  DESCRIPCIÓN
                </th>
                <th
                  className={`border-b p-2 text-center font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  CANT.
                </th>
                <th
                  className={`border-b p-2 text-right font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  PRECIO
                </th>
                <th
                  className={`border-b p-2 text-center font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  ITBIS
                </th>
                <th
                  className={`border-b p-2 text-right font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  IMPORTE
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <td className="p-2 print-black">{item.description}</td>
                  <td className="p-2 text-center print-black">{item.quantity}</td>
                  <td className="p-2 text-right print-black">{formatCurrency(item.price)}</td>
                  <td className="p-2 text-center print-black">{item.taxable ? "Sí" : "No"}</td>
                  <td className="p-2 text-right print-black">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mb-8 flex justify-end">
          <div className="w-64 space-y-2">
            <div className={`flex justify-between border-b py-1 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <span className="print-black">SUBTOTAL</span>
              <span className="print-black">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className={`flex justify-between border-b py-1 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <span className="print-black">IMPUESTO ({invoice.taxRate * 100}%)</span>
              <span className="print-black">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-lg font-bold print-black">
              <span>TOTAL</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            <div
              className="flex justify-between py-1 text-lg font-bold print-black"
              style={{ color: isDark ? `${config.primaryColor}FF` : config.primaryColor }}
            >
              <span>SALDO PENDIENTE</span>
              <span>RD${formatCurrency(invoice.total).replace("RD$", "")}</span>
            </div>
          </div>
        </div>

        {/* Resumen de impuestos */}
        <div className="mb-8">
          <h3 className={`mb-2 font-medium uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            RESUMEN DE IMPUESTOS
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? `${config.secondaryColor}20` : config.secondaryColor,
                }}
              >
                <th
                  className={`border-b p-2 text-center font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  TASA
                </th>
                <th
                  className={`border-b p-2 text-center font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  IMPUESTOS DE
                </th>
                <th
                  className={`border-b p-2 text-center font-medium ${isDark ? "border-gray-700" : "border-gray-200"} print-black`}
                >
                  BASE IMPONIBLE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <td className="p-2 text-center print-black">ITBIS de {invoice.taxRate * 100}%</td>
                <td className="p-2 text-center print-black">{formatCurrency(invoice.taxAmount)}</td>
                <td className="p-2 text-center print-black">{formatCurrency(taxableAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Firma */}
        {config.showSignature && (
          <div className="mb-8 flex justify-end">
            <div className="w-64 text-center">
              <div className={`border-t pt-2 ${isDark ? "border-gray-700" : "border-gray-400"} print-black`}>
                {config.signatureText}
              </div>
            </div>
          </div>
        )}

        {/* Pie de página */}
        {config.showFooter && (
          <div className={`text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <p className="whitespace-pre-line print-black">{config.footerText}</p>
          </div>
        )}

        {/* Código QR */}
        {config.showQRCode && (
          <div className="absolute bottom-0 right-0 p-4">
            <QRCodeSVG
              value={qrData}
              size={80}
              bgColor={isDark ? "#1f2937" : "#ffffff"}
              fgColor={isDark ? "#ffffff" : "#000000"}
            />
          </div>
        )}

        {/* Número de página */}
        <div className={`mt-8 text-center text-xs ${isDark ? "text-gray-500" : "text-gray-400"} print-black`}>
          Page 1 of 1
        </div>
      </div>
    </div>
  )
}
