/**
 * Types for reports and related data
 */

// Expense interface representing a purchase or expense
export interface Expense {
    id: string
    date: string | Date
    description: string
    amount: number
    category: string
    supplier?: {
      name: string
      rnc?: string
    }
    ncf?: string
    ncfModified?: string
    documentType?: string
    paymentMethod?: string
    itbisIncluded?: boolean
    notes?: string
  }
  
  // Report 606 entry interface for DGII reporting
  export interface Report606Entry {
    line: number
    date: string
    rnc: string
    docType: string
    ncf: string
    ncfModified: string
    baseAmount: number
    itbisAmount: number
    paymentMethod: string
    totalAmount: number
  }
  
  // Report 606 summary interface
  export interface Report606Summary {
    totalRecords: number
    totalBaseAmount: number
    totalItbisAmount: number
    totalAmount: number
    period: string
    startDate: Date
    endDate: Date
  }
  
  // Report period interface
  export interface ReportPeriod {
    value: string
    label: string
  }
  
  