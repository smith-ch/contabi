// global.d.ts o al inicio de report-service.ts
declare global {
    interface Window {
      getExpensesByDateRange?: (userId: string, startDate: Date, endDate: Date) => Promise<Expense[]>
    }
  }
  
  export {}; // Esto asegura que el archivo es un módulo
  
  /**
   * Service for handling report data and calculations
   */
  
  import type { Expense, Report606Entry, Report606Summary } from "@/types/report-types"
  import { extractBaseAndItbis, getDocumentTypeCode, getPaymentMethodCode, isItbisApplicable } from "@/lib/report-utils"
  import { mockGetExpensesByDateRange } from "@/lib/mock-data"
  
  // Convert expenses to Report 606 format
  export function convertExpensesToReport606(expenses: Expense[]): Report606Entry[] {
    return expenses.map((expense, index) => {
      const hasItbis = isItbisApplicable(expense.category)
      const { baseAmount, itbisAmount } = extractBaseAndItbis(
        expense.amount,
        expense.itbisIncluded !== false, // Default to true if not specified
        hasItbis,
      )
  
      const docType = expense.documentType ? getDocumentTypeCode(expense.documentType) : "1"
  
      const paymentMethod = expense.paymentMethod ? getPaymentMethodCode(expense.paymentMethod) : "1"
  
      return {
        line: index + 1,
        // Si expense.date es string se deja, si no se convierte a formato ISO (solo la fecha)
        date: typeof expense.date === "string" ? expense.date : expense.date.toISOString().split("T")[0],
        rnc: expense.supplier?.rnc || "-",
        docType,
        ncf: expense.ncf || "-",
        ncfModified: expense.ncfModified || "-",
        baseAmount,
        itbisAmount,
        paymentMethod,
        totalAmount: baseAmount + itbisAmount,
      }
    })
  }
  
  // Calculate Report 606 summary
  export function calculateReport606Summary(
    entries: Report606Entry[],
    period: string,
    startDate: Date,
    endDate: Date,
  ): Report606Summary {
    const totalBaseAmount = entries.reduce((sum, entry) => sum + entry.baseAmount, 0)
    const totalItbisAmount = entries.reduce((sum, entry) => sum + entry.itbisAmount, 0)
  
    return {
      totalRecords: entries.length,
      totalBaseAmount,
      totalItbisAmount,
      totalAmount: totalBaseAmount + totalItbisAmount,
      period,
      startDate,
      endDate,
    }
  }
  
  // Get expenses by date range (uses mock or real function)
  export async function getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    try {
      // Try to use the real function if available
      if (typeof window !== "undefined" && window.getExpensesByDateRange) {
        return await window.getExpensesByDateRange(userId, startDate, endDate)
      }
  
      // Fall back to mock function
      return await mockGetExpensesByDateRange(userId, startDate, endDate)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      return []
    }
  }
  
  // Generate periods for report selection
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
  
  // Simulate sending report to DGII
  export async function sendReportToDGII(
    report: Report606Summary,
    entries: Report606Entry[],
    credentials: { username: string; password: string },
  ): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
  
    // Validate credentials (mock)
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        message: "Credenciales inválidas. Por favor verifique su usuario y contraseña.",
      }
    }
  
    // Simulate successful submission
    return {
      success: true,
      message: "Reporte enviado exitosamente a la DGII.",
    }
  }
  