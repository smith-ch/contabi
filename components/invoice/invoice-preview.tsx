"use client"

import { formatCurrency, formatDate } from "@/lib/utils"

interface InvoicePreviewProps {
  config: {
    logo: string
    primaryColor: string
    secondaryColor: string
    showLogo: boolean
    showFooter: boolean
    footerText: string
    showSignature: boolean
    signatureText: string
    showWatermark: boolean
    watermarkText: string
    showQRCode: boolean
  }
}

export function InvoicePreview({ config }: InvoicePreviewProps) {
  // Datos de ejemplo para la vista previa
  const sampleCompany = {
    name: "SNG SERVIMAX SNG S.R.L.",
    address: "DOM",
    phone: "+18494608077",
    email: "sngservimax@gmail.com",
    rnc: "133226261",
  }

  const sampleClient = {
    name: "1 NORALEON",
    rnc: "1-30-88005-2",
    address: "C/San Martín de Porres no 14, Naco",
    city: "Santo Domingo",
    district: "Distrito Nacional 10014",
    country: "República Dominicana",
  }

  const sampleInvoice = {
    number: "1002",
    date: new Date("2025-03-23"),
    dueDate: new Date("2025-04-07"),
    terms: "Pago en 15 días",
    items: [
      {
        date: new Date("2025-03-20"),
        service: "Horas",
        description: "Compra de suministro de limpieza",
        quantity: 1,
        rate: 3017.0,
        amount: 3017.0,
        taxable: false,
      },
      {
        date: new Date("2025-03-20"),
        service: "Horas",
        description: "Servicio de limpieza",
        quantity: 1,
        rate: 1500.0,
        amount: 1500.0,
        taxable: true,
      },
    ],
    subtotal: 4517.0,
    taxRate: 0.18,
    taxAmount: 270.0,
    total: 4787.0,
  }

  // Calcular la base imponible (solo los items taxable)
  const taxableAmount = sampleInvoice.items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="bg-white p-8 relative">
      {/* Marca de agua */}
      {config.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="transform rotate-45 text-6xl font-bold opacity-10" style={{ color: config.primaryColor }}>
            {config.watermarkText}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Encabezado */}
        <div className="mb-8 flex justify-between">
          <div className="max-w-[50%]">
            {config.showLogo && config.logo && (
              <div className="mb-3 max-h-20">
                <img src={config.logo || "/placeholder.svg"} alt="Logo" className="h-16 object-contain" />
              </div>
            )}
            <h1 className="text-xl font-bold" style={{ color: config.primaryColor }}>
              {sampleCompany.name}
            </h1>
            <p>{sampleCompany.address}</p>
            <p>{sampleCompany.phone}</p>
            <p>{sampleCompany.email}</p>
            <p>RNC: {sampleCompany.rnc}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold mb-2" style={{ color: config.primaryColor }}>
              Factura de Impuestos
            </h2>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">FACTURA N.°</span>
                <span>{sampleInvoice.number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">FECHA</span>
                <span>{formatDate(sampleInvoice.date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">CONDICIONES</span>
                <span>{sampleInvoice.terms}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">FECHA DE VENCIMIENTO</span>
                <span>{formatDate(sampleInvoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-2 font-medium uppercase text-gray-500">FACTURAR A</h3>
            <p className="font-medium">{sampleClient.name}</p>
            <p>{sampleClient.rnc}</p>
            <p>{sampleClient.address}</p>
            <p>{sampleClient.city}</p>
            <p>{sampleClient.district}</p>
            <p>{sampleClient.country}</p>
          </div>
        </div>

        {/* Tabla de items */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: config.secondaryColor }}>
                <th className="border-b p-2 text-left font-medium">FECHA</th>
                <th className="border-b p-2 text-left font-medium">SERVICIO</th>
                <th className="border-b p-2 text-left font-medium">DESCRIPCIÓN</th>
                <th className="border-b p-2 text-center font-medium">CANT.</th>
                <th className="border-b p-2 text-right font-medium">TASA</th>
                <th className="border-b p-2 text-right font-medium">IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              {sampleInvoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-2">{formatDate(item.date)}</td>
                  <td className="p-2">{item.service}</td>
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">{formatCurrency(item.rate)}</td>
                  <td className="p-2 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mb-8 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between border-b border-gray-200 py-1">
              <span>SUBTOTAL</span>
              <span>{formatCurrency(sampleInvoice.subtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 py-1">
              <span>IMPUESTO</span>
              <span>{formatCurrency(sampleInvoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-lg font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(sampleInvoice.total)}</span>
            </div>
            <div className="flex justify-between py-1 text-lg font-bold" style={{ color: config.primaryColor }}>
              <span>SALDO PENDIENTE</span>
              <span>RD${formatCurrency(sampleInvoice.total).replace("RD$", "")}</span>
            </div>
          </div>
        </div>

        {/* Resumen de impuestos */}
        <div className="mb-8">
          <h3 className="mb-2 font-medium uppercase text-gray-500">RESUMEN DE IMPUESTOS</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: config.secondaryColor }}>
                <th className="border-b p-2 text-center font-medium">TASA</th>
                <th className="border-b p-2 text-center font-medium">IMPUESTOS DE</th>
                <th className="border-b p-2 text-center font-medium">BASE IMPONIBLE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2 text-center">ITBIS de {sampleInvoice.taxRate * 100}%</td>
                <td className="p-2 text-center">{formatCurrency(sampleInvoice.taxAmount)}</td>
                <td className="p-2 text-center">{formatCurrency(taxableAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Firma */}
        {config.showSignature && (
          <div className="mb-8 flex justify-end">
            <div className="w-64 text-center">
              <div className="border-t border-gray-400 pt-2">{config.signatureText}</div>
            </div>
          </div>
        )}

        {/* Pie de página */}
        {config.showFooter && (
          <div className="text-center text-sm text-gray-500">
            <p className="whitespace-pre-line">{config.footerText}</p>
          </div>
        )}

        {/* Código QR */}
        {config.showQRCode && (
          <div className="absolute bottom-0 right-0 p-4">
            <div className="h-20 w-20 bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">Código QR</span>
            </div>
          </div>
        )}

        {/* Número de página */}
        <div className="mt-8 text-center text-xs text-gray-400">Page 1 of 1</div>
      </div>
    </div>
  )
}

