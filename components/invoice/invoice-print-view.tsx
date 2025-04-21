"use client"

import { useEffect, useState } from "react"
import type { Invoice, Client } from "@/lib/db"
import { getFileUrl, STORAGE_BUCKETS } from "@/lib/storage"
import { formatCurrency, formatDate } from "@/lib/utils"
import Image from "next/image"

interface InvoicePrintViewProps {
  invoice: Invoice
  client: Client
  user: any
}

export function InvoicePrintView({ invoice, client, user }: InvoicePrintViewProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadLogo = async () => {
      if (user?.logo) {
        try {
          const url = await getFileUrl(STORAGE_BUCKETS.LOGOS, user.logo)
          setLogoUrl(url)
        } catch (error) {
          console.error("Error al cargar logo:", error)
        }
      }
    }

    loadLogo()
  }, [user])

  // Calcular base imponible (solo los items taxable)
  const taxableAmount = invoice.items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {logoUrl ? (
            <div className="h-20 w-40 relative mb-2">
              <Image
                src={logoUrl || "/placeholder.svg"}
                alt={user.company || "Logo"}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800">{user.company || "Mi Empresa"}</h1>
          )}
          <p className="text-gray-600">{user.name}</p>
          <p className="text-gray-600">RNC: {user.rnc}</p>
          {user.address && <p className="text-gray-600">{user.address}</p>}
          {user.phone && <p className="text-gray-600">{user.phone}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800 mb-1">FACTURA</h2>
          <p className="text-gray-600">#{invoice.invoiceNumber}</p>
          <p className="text-gray-600">Fecha: {formatDate(invoice.date)}</p>
          <p className="text-gray-600">Vencimiento: {formatDate(invoice.dueDate)}</p>
          <div className="mt-2 inline-block px-2 py-1 rounded-md bg-gray-100 text-gray-800">
            {invoice.status === "paid" && "PAGADA"}
            {invoice.status === "pending" && "PENDIENTE"}
            {invoice.status === "overdue" && "VENCIDA"}
            {invoice.status === "cancelled" && "CANCELADA"}
          </div>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="mb-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">FACTURAR A</h3>
        <p className="font-medium">{client.name}</p>
        <p className="text-gray-600">RNC: {client.rnc}</p>
        {client.address && <p className="text-gray-600">{client.address}</p>}
        {client.email && <p className="text-gray-600">{client.email}</p>}
        {client.phone && <p className="text-gray-600">{client.phone}</p>}
      </div>

      {/* Tabla de items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 text-left text-gray-600">Descripción</th>
            <th className="py-2 text-right text-gray-600">Cantidad</th>
            <th className="py-2 text-right text-gray-600">Precio</th>
            <th className="py-2 text-center text-gray-600">ITBIS</th>
            <th className="py-2 text-right text-gray-600">Importe</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-3 text-gray-800">{item.description}</td>
              <td className="py-3 text-right text-gray-800">{item.quantity}</td>
              <td className="py-3 text-right text-gray-800">{formatCurrency(item.price)}</td>
              <td className="py-3 text-center text-gray-800">{item.taxable ? "Sí" : "No"}</td>
              <td className="py-3 text-right text-gray-800">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">ITBIS ({(invoice.taxRate * 100).toFixed(0)}%)</span>
            <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between py-3 font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Resumen de impuestos */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">RESUMEN DE IMPUESTOS</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b p-2 text-center font-medium text-gray-600">TASA</th>
              <th className="border-b p-2 text-center font-medium text-gray-600">IMPUESTOS</th>
              <th className="border-b p-2 text-center font-medium text-gray-600">BASE IMPONIBLE</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-2 text-center text-gray-800">ITBIS {invoice.taxRate * 100}%</td>
              <td className="p-2 text-center text-gray-800">{formatCurrency(invoice.taxAmount)}</td>
              <td className="p-2 text-center text-gray-800">{formatCurrency(taxableAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notas */}
      {invoice.notes && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">NOTAS</h3>
          <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {/* Pie de página */}
      <div className="text-center text-gray-500 text-sm mt-16 pt-4 border-t border-gray-200">
        <p>Gracias por su preferencia</p>
        <p className="mt-1">
          Este documento es una factura fiscal válida según las regulaciones de la República Dominicana.
        </p>
      </div>
    </div>
  )
}
