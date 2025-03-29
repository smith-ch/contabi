"use client"

import { useEffect, useState } from "react"
import { getInvoiceById, getClientById, type Invoice, type Client } from "@/lib/db"
import { getFileUrl, STORAGE_BUCKETS } from "@/lib/storage"
import { formatCurrency, formatDate } from "@/lib/utils"
import Image from "next/image"

interface InvoicePrintViewProps {
  invoiceId: string
}

export function InvoicePrintView({ invoiceId }: InvoicePrintViewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar datos del usuario
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)

          // Cargar logo si existe
          if (userData.logo) {
            const url = await getFileUrl(STORAGE_BUCKETS.LOGOS, userData.logo)
            setLogoUrl(url)
          }
        }

        // Cargar factura
        const invoiceData = await getInvoiceById(invoiceId)
        if (invoiceData) {
          setInvoice(invoiceData)

          // Cargar cliente
          const clientData = await getClientById(invoiceData.clientId)
          if (clientData) {
            setClient(clientData)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos para impresión:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [invoiceId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-800"></div>
      </div>
    )
  }

  if (!invoice || !client || !user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-red-500">No se pudo cargar la información de la factura</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {logoUrl ? (
            <div className="h-20 w-40 relative mb-2">
              <Image src={logoUrl || "/placeholder.svg"} alt={user.company || "Logo"} fill className="object-contain" />
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
            <th className="py-2 text-right text-gray-600">Importe</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-3 text-gray-800">{item.description}</td>
              <td className="py-3 text-right text-gray-800">{item.quantity}</td>
              <td className="py-3 text-right text-gray-800">{formatCurrency(item.price)}</td>
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

      {/* Notas */}
      {invoice.notes && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">NOTAS</h3>
          <p className="text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Pie de página */}
      <div className="text-center text-gray-500 text-sm mt-16 pt-4 border-t border-gray-200">
        <p>Gracias por su preferencia</p>
      </div>
    </div>
  )
}

