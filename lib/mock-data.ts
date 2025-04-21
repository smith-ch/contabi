/**
 * Mock data for testing and development
 */

import type { Expense } from "@/types/report-types"
import { format, subDays } from "date-fns"

// Generate a random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Format date to ISO string
function formatDateToISO(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Generate mock expenses for testing
export function generateMockExpenses(count = 10, startDate?: Date, endDate?: Date): Expense[] {
  const start = startDate || subDays(new Date(), 30)
  const end = endDate || new Date()

  const categories = ["Bienes", "Servicios", "Alquileres", "Impuestos", "Otros", "Importaciones"]
  const paymentMethods = ["Efectivo", "Cheque/Transferencia", "Tarjeta", "Crédito"]
  const documentTypes = ["Factura", "Nota de Débito", "Nota de Crédito", "Comprobante de Compras"]

  const suppliers = [
    { name: "Papelería Nacional", rnc: "101012345" },
    { name: "Consultores Asociados", rnc: "131012345" },
    { name: "TechStore", rnc: "501012345" },
    { name: "Servicios Generales", rnc: "401789012" },
    { name: "Distribuidora Central", rnc: "130987654" },
    { name: "Importadora del Este", rnc: "101567890" },
  ]

  return Array.from({ length: count }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const amount = Math.round(Math.random() * 100000) / 100 // Random amount up to 1000
    const date = randomDate(start, end)

    return {
      id: `exp-${i + 1}`,
      date: formatDateToISO(date),
      description: `Compra de ${category.toLowerCase()}`,
      amount,
      category,
      supplier,
      ncf: `B0100000${(i + 1).toString().padStart(3, "0")}`,
      documentType: documentTypes[Math.floor(Math.random() * documentTypes.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      itbisIncluded: true,
      notes: `Nota de prueba para ${category.toLowerCase()}`,
    }
  })
}

// Mock function to get expenses by date range
export async function mockGetExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Generate 5-15 random expenses
  const count = Math.floor(Math.random() * 10) + 5
  return generateMockExpenses(count, startDate, endDate)
}
