/**
 * Utility functions for report calculations and formatting
 */

import { format } from "date-fns"
import { es } from "date-fns/locale"

// Constants for tax calculations
export const ITBIS_RATE = 0.18 // 18% ITBIS rate in Dominican Republic

/**
 * Formats a date to the standard Dominican format (DD/MM/YYYY)
 */
export function formatDominicanDate(date: string | Date): string {
  if (!date) return "-"
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "dd/MM/yyyy", { locale: es })
}

/**
 * Formats a currency value to Dominican Peso format
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
 * Extracts the base amount and ITBIS from a total amount
 * @param totalAmount The total amount including ITBIS
 * @param itbisIncluded Whether the total amount includes ITBIS
 * @param hasItbis Whether the item has ITBIS applied
 * @returns An object with baseAmount and itbisAmount
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
    // If ITBIS is included in the total amount, extract it
    // Formula: baseAmount = totalAmount / (1 + ITBIS_RATE)
    const baseAmount = +(totalAmount / (1 + ITBIS_RATE)).toFixed(2)
    const itbisAmount = +(totalAmount - baseAmount).toFixed(2)
    return { baseAmount, itbisAmount }
  } else {
    // If ITBIS is not included, calculate it
    // Formula: itbisAmount = baseAmount * ITBIS_RATE
    const baseAmount = totalAmount
    const itbisAmount = +(baseAmount * ITBIS_RATE).toFixed(2)
    return { baseAmount, itbisAmount }
  }
}

/**
 * Determines if an expense category is subject to ITBIS
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
 * Gets the document type code for the 606 report
 */
export function getDocumentTypeCode(docType: string): string {
  const docTypes: Record<string, string> = {
    Factura: "1",
    "Nota de Débito": "2",
    "Nota de Crédito": "3",
    "Comprobante de Compras": "4",
    "Registro Único de Ingresos": "5",
    "Registro de Proveedores Informales": "6",
    "Registro de Gastos Menores": "7",
    "Regímenes Especiales": "8",
    "Comprobante de Compras al Exterior": "9",
  }

  return docTypes[docType] || "1"
}

/**
 * Gets the payment method code for the 606 report
 */
export function getPaymentMethodCode(method: string): string {
  const methods: Record<string, string> = {
    Efectivo: "1",
    "Cheque/Transferencia": "2",
    Tarjeta: "3",
    Crédito: "4",
    Permuta: "5",
    "Nota de Crédito": "6",
    Mixto: "7",
  }

  return methods[method] || "1"
}

