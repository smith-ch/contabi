/**
 * Servicio para manejar datos y cálculos de reportes
 */

import { createClient } from "@supabase/supabase-js"
import type {
  Expense,
  Report606Entry,
  Report606Summary,
  DGIICredentials,
  FilterOptions,
  Supplier,
} from "@/types/report-types"
import { extractBaseAndItbis, getDocumentTypeCode, getPaymentMethodCode, isItbisApplicable } from "@/lib/report-utils"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Convertir gastos al formato del Reporte 606
export function convertExpensesToReport606(expenses: Expense[]): Report606Entry[] {
  return expenses.map((expense, index) => {
    const hasItbis = isItbisApplicable(expense.category)
    const { baseAmount, itbisAmount } = extractBaseAndItbis(
      expense.amount,
      expense.itbisIncluded !== false, // Por defecto true si no se especifica
      hasItbis,
    )

    const docType = expense.documentType ? getDocumentTypeCode(expense.documentType) : "01"

    const paymentMethod = expense.paymentMethod ? getPaymentMethodCode(expense.paymentMethod) : "01"

    return {
      line: index + 1,
      date: typeof expense.date === "string" ? expense.date : expense.date.toISOString().split("T")[0],
      rnc: expense.supplier?.rnc || "-",
      supplierName: expense.supplier?.name || "-",
      docType,
      ncf: expense.ncf || "-",
      ncfModified: expense.ncfModified || "-",
      baseAmount,
      itbisAmount,
      itbisRetenido: 0, // Por defecto 0, se puede personalizar según necesidad
      itbisPercibido: 0, // Por defecto 0, se puede personalizar según necesidad
      isr: 0, // Por defecto 0, se puede personalizar según necesidad
      paymentMethod,
      totalAmount: baseAmount + itbisAmount,
    }
  })
}

// Calcular resumen del Reporte 606
export function calculateReport606Summary(
  entries: Report606Entry[],
  period: string,
  startDate: Date,
  endDate: Date,
): Report606Summary {
  const totalBaseAmount = entries.reduce((sum, entry) => sum + entry.baseAmount, 0)
  const totalItbisAmount = entries.reduce((sum, entry) => sum + entry.itbisAmount, 0)
  const totalItbisRetenido = entries.reduce((sum, entry) => sum + (entry.itbisRetenido || 0), 0)
  const totalItbisPercibido = entries.reduce((sum, entry) => sum + (entry.itbisPercibido || 0), 0)
  const totalIsr = entries.reduce((sum, entry) => sum + (entry.isr || 0), 0)

  return {
    totalRecords: entries.length,
    totalBaseAmount,
    totalItbisAmount,
    totalItbisRetenido,
    totalItbisPercibido,
    totalIsr,
    totalAmount: totalBaseAmount + totalItbisAmount,
    period,
    startDate,
    endDate,
  }
}

// Obtener gastos por rango de fechas desde Supabase
export async function getExpensesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  filters?: FilterOptions,
): Promise<Expense[]> {
  try {
    // Convertir fechas a formato ISO para la consulta
    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    // Iniciar consulta base
    let query = supabase
      .from("expenses")
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq("userId", userId)
      .gte("date", startDateStr)
      .lte("date", endDateStr)

    // Aplicar filtros adicionales si existen
    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        query = query.in("category", filters.categories)
      }

      if (filters.documentTypes && filters.documentTypes.length > 0) {
        query = query.in("documentType", filters.documentTypes)
      }

      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        query = query.in("paymentMethod", filters.paymentMethods)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status)
      }
    }

    // Ejecutar la consulta
    const { data, error } = await query

    if (error) {
      console.error("Error al obtener gastos:", error)
      return []
    }

    return data as Expense[]
  } catch (error) {
    console.error("Error al consultar gastos:", error)
    return []
  }
}

// Generar períodos para selección de reportes
export function generateReportPeriods(yearsBack = 2) {
  const periods = []
  const currentYear = new Date().getFullYear()

  for (let year = currentYear; year >= currentYear - yearsBack; year--) {
    for (let month = 12; month >= 1; month--) {
      const periodValue = `${year}${String(month).padStart(2, "0")}`
      const periodLabel = `${String(month).padStart(2, "0")}/${year}`
      periods.push({ value: periodValue, label: periodLabel })
    }
  }

  return periods
}

// Simular envío de reporte a la DGII
export async function sendReportToDGII(
  report: Report606Summary,
  entries: Report606Entry[],
  credentials: DGIICredentials,
): Promise<{ success: boolean; message: string }> {
  // Simular retraso de API
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Validar credenciales
  if (!credentials.username || !credentials.password || !credentials.rnc) {
    return {
      success: false,
      message: "Credenciales inválidas. Por favor verifique su usuario, contraseña y RNC.",
    }
  }

  // Validar datos del reporte
  if (entries.length === 0) {
    return {
      success: false,
      message: "El reporte no contiene registros para enviar.",
    }
  }

  // Simular envío exitoso
  return {
    success: true,
    message: "Reporte enviado exitosamente a la DGII.",
  }
}

// Obtener categorías de gastos disponibles
export async function getExpenseCategories(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("expenses").select("category").eq("userId", userId).order("category")

    if (error) {
      console.error("Error al obtener categorías:", error)
      return []
    }

    // Extraer categorías únicas
    const categories = [...new Set(data.map((item) => item.category))]
    return categories
  } catch (error) {
    console.error("Error al consultar categorías:", error)
    return []
  }
}

// Obtener tipos de documentos disponibles
export async function getDocumentTypes(): Promise<string[]> {
  return [
    "Factura",
    "Factura de Consumo Electrónica",
    "Nota de Débito",
    "Nota de Crédito",
    "Comprobante de Compras",
    "Registro Único de Ingresos",
    "Registro de Proveedores Informales",
    "Registro de Gastos Menores",
    "Comprobante de Compras al Exterior",
    "Comprobante Gubernamental",
    "Comprobante para Exportaciones",
    "Comprobante para Pagos al Exterior",
  ]
}

// Obtener métodos de pago disponibles
export async function getPaymentMethods(): Promise<string[]> {
  return [
    "Efectivo",
    "Cheques/Transferencias/Depósito",
    "Tarjeta Crédito/Débito",
    "Compra a Crédito",
    "Permuta",
    "Nota de Crédito",
    "Mixto",
  ]
}

// Obtener proveedores del usuario
export async function getSuppliers(userId: string): Promise<Supplier[]> {
  try {
    const { data, error } = await supabase.from("suppliers").select("*").eq("userId", userId).order("name")

    if (error) {
      console.error("Error al obtener proveedores:", error)
      return []
    }

    return data as Supplier[]
  } catch (error) {
    console.error("Error al consultar proveedores:", error)
    return []
  }
}

