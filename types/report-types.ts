/**
 * Tipos para los reportes
 */

// Tipo para un proveedor
export interface Supplier {
  id: string
  name: string
  rnc: string
  address?: string
  phone?: string
  email?: string
}

// Tipo para un gasto
export interface Expense {
  id: string
  userId: string
  date: Date | string
  supplier?: Supplier
  description: string
  amount: number
  category: string
  documentType: string
  ncf: string
  ncfModified?: string
  itbisIncluded?: boolean
  paymentMethod: string
  status: "paid" | "pending" | "cancelled"
  createdAt: Date | string
  updatedAt: Date | string
}

// Tipo para una entrada del reporte 606
export interface Report606Entry {
  line: number
  date: string
  rnc: string
  supplierName?: string
  docType: string
  ncf: string
  ncfModified: string
  baseAmount: number
  itbisAmount: number
  itbisRetenido?: number
  itbisPercibido?: number
  isr?: number
  paymentMethod: string
  totalAmount: number
}

// Tipo para el resumen del reporte 606
export interface Report606Summary {
  totalRecords: number
  totalBaseAmount: number
  totalItbisAmount: number
  totalItbisRetenido?: number
  totalItbisPercibido?: number
  totalIsr?: number
  totalAmount: number
  period: string
  startDate: Date
  endDate: Date
}

// Tipo para las credenciales de la DGII
export interface DGIICredentials {
  username: string
  password: string
  rnc: string
}

// Tipo para las opciones de filtrado
export interface FilterOptions {
  categories: string[]
  documentTypes: string[]
  paymentMethods: string[]
  suppliers: string[]
  status: string[]
}

// Tipo para las opciones de personalización
export interface CustomizationOptions {
  showSupplierName: boolean
  showDescription: boolean
  compactMode: boolean
  highlightUnpaid: boolean
  showTotals: boolean
  fontSize: "small" | "medium" | "large"
}

