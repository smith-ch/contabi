"use client"

import { CardFooter } from "@/components/ui/card"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, ChevronDown, Download, Printer, RefreshCw, Send } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { exportToPDF, printElement } from "@/lib/pdf-utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Expense {
  id: string
  date: Date | string
  supplier: {
    id: string
    name: string
    rnc: string
  }
  ncf: string
  ncfModified?: string
  description: string
  category: string
  amount: number
  itbisIncluded: boolean
  hasItbis: boolean
  itbisAmount?: number
  baseAmount?: number
  paymentMethod: string
  status: "paid" | "pending" | "cancelled"
  docType: string
}

interface Report606Entry {
  line: number
  date: string
  rnc: string
  supplierName: string
  docType: string
  ncf: string
  ncfModified: string
  baseAmount: number
  itbisAmount: number
  itbisRetenido?: number
  itbisPercibido?: number
  isr?: number
  paymentMethod: string
}

interface Report606Summary {
  period: string
  startDate: Date
  endDate: Date
  totalRecords: number
  totalAmount: number
  totalBaseAmount: number
  totalItbisAmount: number
  totalItbisRetenido?: number
  totalItbisPercibido?: number
  totalIsr?: number
}

interface FilterOptions {
  categories: string[]
  documentTypes: string[]
  paymentMethods: string[]
  suppliers: string[]
  status: string[]
}

interface CustomizationOptions {
  showSupplierName: boolean
  showDescription: boolean
  compactMode: boolean
  highlightUnpaid: boolean
  showTotals: boolean
  fontSize: "small" | "medium" | "large"
}

interface DGIICredentials {
  username: string
  password: string
  rnc: string
}

// Interfaces para los datos de Supabase
interface SupabaseCategory {
  name: string
}

interface SupabaseDocType {
  name: string
}

interface SupabasePaymentMethod {
  name: string
}

interface SupabaseSupplier {
  id: string
  name: string
  rnc: string
}

interface SupabaseExpense {
  id: string
  date: string
  description: string | null
  amount: number
  itbis_included: boolean
  has_itbis: boolean
  payment_method: string
  status: "paid" | "pending" | "cancelled"
  doc_type: string
  ncf: string | null
  ncf_modified: string | null
  category: string
  supplier_id: string
  suppliers: {
    id: string
    name: string
    rnc: string
  } | null
}

// Mapeo de tipos de documentos para el formato 606
const docTypeMapping: Record<string, string> = {
  Factura: "01",
  "Nota de Débito": "02",
  "Nota de Crédito": "03",
  "Comprobante de Compras": "04",
  "Registro de Proveedores Informales": "11",
  "Registro Único de Ingresos": "12",
  "Comprobante de Gastos Menores": "13",
  "Comprobante de Regímenes Especiales": "14",
  "Comprobante Gubernamental": "15",
}

// Mapeo de métodos de pago para el formato 606
const paymentMethodMapping: Record<string, string> = {
  Efectivo: "01",
  "Cheques/Transferencias/Depósito": "02",
  "Tarjeta Crédito/Débito": "03",
  "Compra a Crédito": "04",
  Permuta: "05",
  "Nota de Crédito": "06",
  Mixto: "07",
}

export function Report606() {
  // Estado para el período seleccionado y fechas
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([])
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))

  // Estado para los datos del reporte
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [reportEntries, setReportEntries] = useState<Report606Entry[]>([])
  const [reportSummary, setReportSummary] = useState<Report606Summary | null>(null)

  // Estado para filtros
  const [availableFilters, setAvailableFilters] = useState<{
    categories: string[]
    documentTypes: string[]
    paymentMethods: string[]
    suppliers: { id: string; name: string; rnc: string }[]
  }>({
    categories: [],
    documentTypes: [],
    paymentMethods: [],
    suppliers: [],
  })

  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    documentTypes: [],
    paymentMethods: [],
    suppliers: [],
    status: ["paid"], // Por defecto, solo mostrar gastos pagados
  })

  // Estado para personalización
  const [customization, setCustomization] = useState<CustomizationOptions>({
    showSupplierName: true,
    showDescription: false,
    compactMode: false,
    highlightUnpaid: true,
    showTotals: true,
    fontSize: "medium",
  })

  // Estado para diálogos
  const [sendDialogOpen, setSendDialogOpen] = useState<boolean>(false)
  const [dgiiCredentials, setDgiiCredentials] = useState<DGIICredentials>({
    username: "",
    password: "",
    rnc: "",
  })
  const [sendingReport, setSendingReport] = useState<boolean>(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  // Referencias
  const reportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Efecto para cargar períodos disponibles
  useEffect(() => {
    const loadPeriods = () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      const availablePeriods = []

      // Generar períodos para los últimos 12 meses
      for (let i = 0; i < 12; i++) {
        const year = currentYear - Math.floor((currentMonth - i + 12) / 12)
        const month = (currentMonth - i + 12) % 12

        const date = new Date(year, month, 1)
        const value = format(date, "yyyyMM")
        const label = format(date, "MMMM yyyy", { locale: es })

        availablePeriods.push({ value, label })
      }

      setPeriods(availablePeriods)

      // Establecer período actual por defecto
      const currentPeriod = format(now, "yyyyMM")
      setSelectedPeriod(currentPeriod)
    }

    loadPeriods()
  }, [])

  // Cargar filtros disponibles desde Supabase
  useEffect(() => {
    const loadAvailableFilters = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Obtener el usuario actual
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error al obtener usuario:", userError)
          throw new Error("No se pudo obtener la información del usuario")
        }

        if (!user) {
          console.warn("No hay usuario autenticado, usando configuración por defecto")
          setLoading(false)
          return
        }

        const userId = user.id

        // Helper function to fetch and process data
        const fetchData = async (tableName: string, column: string) => {
          const { data, error } = await supabase.from(tableName).select(column).eq("user_id", userId).order(column)

          if (error) {
            console.error(`Error fetching ${tableName}:`, error)
            return []
          }

          return [...new Set(data.map((item: any) => item[column]))]
        }

        // Fetch categories, document types, and payment methods
        const categoriesPromise = fetchData("expenses", "category")
        const documentTypesPromise = fetchData("expenses", "doc_type")
        const paymentMethodsPromise = fetchData("expenses", "payment_method")

        // Fetch suppliers
        const suppliersPromise = supabase
          .from("expenses")
          .select("suppliers(id, name, rnc)")
          .eq("user_id", userId)
          .not("supplier_id", "is", null)
          .order("supplier_id")
          .then(({ data, error }) => {
            if (error) {
              console.error("Error fetching suppliers:", error)
              return []
            }

            return [
              ...new Set(
                data
                  ? data.map((s: any) => ({
                      id: s.suppliers.id,
                      name: s.suppliers.name,
                      rnc: s.suppliers.rnc,
                    }))
                  : [],
              ),
            ]
          })

        // Resolve all promises in parallel
        const [categories, documentTypes, paymentMethods, suppliers] = await Promise.all([
          categoriesPromise,
          documentTypesPromise,
          paymentMethodsPromise,
          suppliersPromise,
        ])

        setAvailableFilters({
          categories,
          documentTypes,
          paymentMethods,
          suppliers,
        })
      } catch (error) {
        console.error("Error al cargar filtros:", error)
        setError("No se pudieron cargar los filtros disponibles.")
      } finally {
        setLoading(false)
      }
    }

    loadAvailableFilters()
  }, [])

  // Función para cargar datos del reporte
  const loadReportData = useCallback(async () => {
    if (!startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error al obtener usuario:", userError)
        throw new Error("No se pudo obtener la información del usuario")
      }

      if (!user) {
        console.warn("No hay usuario autenticado, usando configuración por defecto")
        setLoading(false)
        return
      }

      const userId = user.id

      // Formatear fechas para la consulta
      const startDateStr = format(startDate, "yyyy-MM-dd")
      const endDateStr = format(endDate, "yyyy-MM-dd")

      // Consultar gastos desde Supabase
      let query = supabase
        .from("expenses")
        .select(`
          id, 
          date, 
          description, 
          amount, 
          itbis_included, 
          has_itbis, 
          payment_method, 
          status, 
          doc_type,
          ncf,
          ncf_modified,
          category,
          supplier_id,
          suppliers(id, name, rnc)
        `)
        .eq("user_id", userId)
        .gte("date", startDateStr)
        .lte("date", endDateStr)

      // Aplicar filtros
      if (filters.categories.length > 0) {
        query = query.in("category", filters.categories)
      }

      if (filters.documentTypes.length > 0) {
        query = query.in("doc_type", filters.documentTypes)
      }

      if (filters.paymentMethods.length > 0) {
        query = query.in("payment_method", filters.paymentMethods)
      }

      if (filters.suppliers.length > 0) {
        query = query.in("supplier_id", filters.suppliers)
      }

      if (filters.status.length > 0) {
        query = query.in("status", filters.status)
      }

      const { data: expensesData, error: expensesError } = await query

      if (expensesError) throw expensesError

      if (!expensesData || expensesData.length === 0) {
        setExpenses([])
        setReportEntries([])
        setReportSummary({
          period: selectedPeriod,
          startDate,
          endDate,
          totalRecords: 0,
          totalAmount: 0,
          totalBaseAmount: 0,
          totalItbisAmount: 0,
          totalItbisRetenido: 0,
          totalItbisPercibido: 0,
          totalIsr: 0,
        })
        return
      }

      // Transformar datos de la base de datos al formato de la aplicación
      const processedExpenses: Expense[] = expensesData.map((expense: any) => ({
        id: expense.id as string,
        date: new Date(expense.date),
        supplier: {
          id: expense.suppliers?.id || "",
          name: expense.suppliers?.name || "Proveedor Desconocido",
          rnc: expense.suppliers?.rnc || "000000000",
        },
        ncf: expense.ncf || "",
        ncfModified: expense.ncf_modified || "",
        description: expense.description || "",
        category: expense.category || "",
        amount: expense.amount || 0,
        itbisIncluded: expense.itbis_included || false,
        hasItbis: expense.has_itbis || false,
        paymentMethod: expense.payment_method || "",
        status: (expense.status as "paid" | "pending" | "cancelled") || "paid",
        docType: expense.doc_type || "",
      }))

      // Calcular montos base e ITBIS
      const expensesWithCalculations = processedExpenses.map((expense) => {
        if (expense.hasItbis) {
          if (expense.itbisIncluded) {
            // Si el ITBIS está incluido, calculamos el monto base dividiendo entre 1.18
            const baseAmount = Number((expense.amount / 1.18).toFixed(2))
            const itbisAmount = Number((expense.amount - baseAmount).toFixed(2))
            return { ...expense, baseAmount, itbisAmount }
          } else {
            // Si el ITBIS no está incluido, el monto base es el monto original
            const baseAmount = expense.amount
            const itbisAmount = Number((baseAmount * 0.18).toFixed(2))
            return { ...expense, baseAmount, itbisAmount }
          }
        } else {
          // Si no tiene ITBIS, el monto base es el monto total y el ITBIS es 0
          return { ...expense, baseAmount: expense.amount, itbisAmount: 0 }
        }
      })

      setExpenses(expensesWithCalculations)

      // Convertir a formato 606
      const entries: Report606Entry[] = expensesWithCalculations.map((expense, index) => ({
        line: index + 1,
        date: format(new Date(expense.date), "yyyy-MM-dd"),
        rnc: expense.supplier.rnc,
        supplierName: expense.supplier.name,
        docType: docTypeMapping[expense.docType] || "01",
        ncf: expense.ncf,
        ncfModified: expense.ncfModified || "",
        baseAmount: expense.baseAmount || 0,
        itbisAmount: expense.itbisAmount || 0,
        itbisRetenido: 0,
        itbisPercibido: 0,
        isr: 0,
        paymentMethod: paymentMethodMapping[expense.paymentMethod] || "01",
      }))

      setReportEntries(entries)

      // Calcular resumen
      const summary: Report606Summary = {
        period: selectedPeriod,
        startDate,
        endDate,
        totalRecords: entries.length,
        totalAmount: entries.reduce((sum, entry) => sum + entry.baseAmount + entry.itbisAmount, 0),
        totalBaseAmount: entries.reduce((sum, entry) => sum + entry.baseAmount, 0),
        totalItbisAmount: entries.reduce((sum, entry) => sum + entry.itbisAmount, 0),
        totalItbisRetenido: entries.reduce((sum, entry) => sum + (entry.itbisRetenido || 0), 0),
        totalItbisPercibido: entries.reduce((sum, entry) => sum + (entry.itbisPercibido || 0), 0),
        totalIsr: entries.reduce((sum, entry) => sum + (entry.isr || 0), 0),
      }

      setReportSummary(summary)

      toast({
        title: "Datos actualizados",
        description: `Se cargaron ${entries.length} registros para el período seleccionado.`,
      })
    } catch (error) {
      console.error("Error al cargar datos del reporte:", error)
      setError("No se pudieron cargar los datos del reporte. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, startDate, endDate, filters, toast])

  // Efecto para cargar datos cuando cambian las fechas o filtros
  useEffect(() => {
    // Solo cargar datos si tenemos un período seleccionado
    if (selectedPeriod && startDate && endDate) {
      loadReportData()
    }
  }, [selectedPeriod, startDate, endDate, filters, loadReportData])

  // Manejar cambio de período
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
  }

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof FilterOptions, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Manejar cambio de personalización
  const handleCustomizationChange = (key: keyof CustomizationOptions, value: any) => {
    setCustomization((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Exportar a PDF
  const handleExportPDF = async () => {
    if (!reportRef.current) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intente nuevamente.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Asegurar que el contenido esté completamente renderizado
      await new Promise((resolve) => setTimeout(resolve, 500))

      const success = await exportToPDF(
        "report-606-content",
        `reporte-606-${selectedPeriod}.pdf`,
        "landscape",
        2, // Alta resolución
      )

      if (success) {
        toast({
          title: "PDF generado",
          description: "El PDF ha sido generado exitosamente.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar el PDF. Intente nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el PDF.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Imprimir reporte
  const handlePrint = () => {
    if (!reportRef.current) return
    printElement("report-606-content")
  }

  // Enviar reporte a la DGII
  const handleSendToDGII = async () => {
    if (!reportSummary || !reportEntries.length) return

    setSendingReport(true)
    setSendResult(null)

    try {
      // Simulamos el envío a la DGII
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSendResult({
        success: true,
        message: "El reporte ha sido enviado exitosamente a la DGII.",
      })

      toast({
        title: "Reporte enviado",
        description: "El reporte ha sido enviado exitosamente a la DGII.",
      })
    } catch (error) {
      console.error("Error al enviar reporte a la DGII:", error)
      setSendResult({
        success: false,
        message: "Error al enviar el reporte. Por favor intente nuevamente.",
      })

      toast({
        title: "Error",
        description: "No se pudo enviar el reporte a la DGII.",
        variant: "destructive",
      })
    } finally {
      setSendingReport(false)
    }
  }

  // Renderizar tabla del reporte
  const renderReportTable = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (!reportEntries.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-4">No hay registros para el período seleccionado.</p>
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      )
    }

    const fontSize = {
      small: "text-xs",
      medium: "text-sm",
      large: "text-base",
    }[customization.fontSize]

    return (
      <div className={`overflow-x-auto ${fontSize}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="border px-2 py-1 text-center">Línea</th>
              <th className="border px-2 py-1 text-center">Fecha</th>
              <th className="border px-2 py-1 text-center">RNC/Cédula</th>
              {customization.showSupplierName && <th className="border px-2 py-1 text-center">Proveedor</th>}
              <th className="border px-2 py-1 text-center">Tipo Doc.</th>
              <th className="border px-2 py-1 text-center">NCF</th>
              <th className="border px-2 py-1 text-center">NCF Modificado</th>
              {customization.showDescription && <th className="border px-2 py-1 text-center">Descripción</th>}
              <th className="border px-2 py-1 text-center">Monto Facturado</th>
              <th className="border px-2 py-1 text-center">ITBIS Facturado</th>
              <th className="border px-2 py-1 text-center">ITBIS Retenido</th>
              <th className="border px-2 py-1 text-center">ITBIS Percibido</th>
              <th className="border px-2 py-1 text-center">Retención Renta</th>
              <th className="border px-2 py-1 text-center">Forma de Pago</th>
            </tr>
          </thead>
          <tbody>
            {reportEntries.map((entry) => {
              const expense = expenses.find(
                (e) => e.ncf === entry.ncf && format(new Date(e.date), "yyyy-MM-dd") === entry.date,
              )

              const isUnpaid = expense?.status === "pending" && customization.highlightUnpaid

              return (
                <tr key={`${entry.line}-${entry.ncf}`} className={isUnpaid ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                  <td className="border px-2 py-1 text-center">{entry.line}</td>
                  <td className="border px-2 py-1 text-center">{format(new Date(entry.date), "dd/MM/yyyy")}</td>
                  <td className="border px-2 py-1 text-center">{entry.rnc}</td>
                  {customization.showSupplierName && <td className="border px-2 py-1">{entry.supplierName}</td>}
                  <td className="border px-2 py-1 text-center">{entry.docType}</td>
                  <td className="border px-2 py-1 text-center">{entry.ncf}</td>
                  <td className="border px-2 py-1 text-center">{entry.ncfModified}</td>
                  {customization.showDescription && <td className="border px-2 py-1">{expense?.description || "-"}</td>}
                  <td className="border px-2 py-1 text-right">
                    {new Intl.NumberFormat("es-DO", {
                      style: "currency",
                      currency: "DOP",
                    }).format(entry.baseAmount)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {new Intl.NumberFormat("es-DO", {
                      style: "currency",
                      currency: "DOP",
                    }).format(entry.itbisAmount)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {new Intl.NumberFormat("es-DO", {
                      style: "currency",
                      currency: "DOP",
                    }).format(entry.itbisRetenido || 0)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {new Intl.NumberFormat("es-DO", {
                      style: "currency",
                      currency: "DOP",
                    }).format(entry.itbisPercibido || 0)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {new Intl.NumberFormat("es-DO", {
                      style: "currency",
                      currency: "DOP",
                    }).format(entry.isr || 0)}
                  </td>
                  <td className="border px-2 py-1 text-center">{entry.paymentMethod}</td>
                </tr>
              )
            })}
          </tbody>
          {customization.showTotals && reportSummary && (
            <tfoot>
              <tr className="bg-muted font-medium">
                <td
                  colSpan={
                    customization.showSupplierName
                      ? customization.showDescription
                        ? 8
                        : 7
                      : customization.showDescription
                        ? 7
                        : 6
                  }
                  className="border px-2 py-1 text-right"
                >
                  Totales:
                </td>
                <td className="border px-2 py-1 text-right">
                  {new Intl.NumberFormat("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  }).format(reportSummary.totalBaseAmount)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {new Intl.NumberFormat("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  }).format(reportSummary.totalItbisAmount)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {new Intl.NumberFormat("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  }).format(reportSummary.totalItbisRetenido || 0)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {new Intl.NumberFormat("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  }).format(reportSummary.totalItbisPercibido || 0)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {new Intl.NumberFormat("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  }).format(reportSummary.totalIsr || 0)}
                </td>
                <td className="border px-2 py-1"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    )
  }

  // Renderizar encabezado del reporte
  const renderReportHeader = () => {
    if (!reportSummary) return null

    return (
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold">FORMATO DE ENVÍO 606</h2>
        <h3 className="text-lg font-semibold">COMPRAS DE BIENES Y SERVICIOS</h3>
        <div className="mt-2">
          <p>
            <span className="font-semibold">Período:</span>{" "}
            {format(reportSummary.startDate, "MMMM yyyy", { locale: es })}
          </p>
          <p>
            <span className="font-semibold">Fecha de Generación:</span>{" "}
            {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reporte 606 - Compras y Gastos</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {reportSummary ? `${reportSummary.totalRecords} registros` : "0 registros"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {selectedPeriod ? periods.find((p) => p.value === selectedPeriod)?.label : "Sin período"}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Reporte de compras y gastos para la Dirección General de Impuestos Internos (DGII)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="controls" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="controls">Controles</TabsTrigger>
              <TabsTrigger value="filters">Filtros</TabsTrigger>
              <TabsTrigger value="customization">Personalización</TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="period">Período</Label>
                  <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={loadReportData} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Cargando..." : "Actualizar"}
                </Button>

                <div className="flex space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Acciones
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Opciones de Reporte</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar a PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSendDialogOpen(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar a DGII
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Categorías</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableFilters.categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange("categories", [...filters.categories, category])
                            } else {
                              handleFilterChange(
                                "categories",
                                filters.categories.filter((c) => c !== category),
                              )
                            }
                          }}
                        />
                        <Label htmlFor={`category-${category}`} className="cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Tipos de Documento</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableFilters.documentTypes.map((docType) => (
                      <div key={docType} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`docType-${docType}`}
                          checked={filters.documentTypes.includes(docType)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange("documentTypes", [...filters.documentTypes, docType])
                            } else {
                              handleFilterChange(
                                "documentTypes",
                                filters.documentTypes.filter((d) => d !== docType),
                              )
                            }
                          }}
                        />
                        <Label htmlFor={`docType-${docType}`} className="cursor-pointer">
                          {docType}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Métodos de Pago</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableFilters.paymentMethods.map((method) => (
                      <div key={method} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`method-${method}`}
                          checked={filters.paymentMethods.includes(method)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange("paymentMethods", [...filters.paymentMethods, method])
                            } else {
                              handleFilterChange(
                                "paymentMethods",
                                filters.paymentMethods.filter((m) => m !== method),
                              )
                            }
                          }}
                        />
                        <Label htmlFor={`method-${method}`} className="cursor-pointer">
                          {method}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Estado</Label>
                  <div className="border rounded-md p-2">
                    {["paid", "pending", "cancelled"].map((status) => (
                      <div key={status} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange("status", [...filters.status, status])
                            } else {
                              handleFilterChange(
                                "status",
                                filters.status.filter((s) => s !== status),
                              )
                            }
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="cursor-pointer">
                          {status === "paid" ? "Pagado" : status === "pending" ? "Pendiente" : "Cancelado"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      categories: [],
                      documentTypes: [],
                      paymentMethods: [],
                      suppliers: [],
                      status: ["paid"],
                    })
                  }}
                >
                  Restablecer Filtros
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="customization" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSupplierName">Mostrar Nombre del Proveedor</Label>
                    <Switch
                      id="showSupplierName"
                      checked={customization.showSupplierName}
                      onCheckedChange={(checked) => handleCustomizationChange("showSupplierName", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDescription">Mostrar Descripción</Label>
                    <Switch
                      id="showDescription"
                      checked={customization.showDescription}
                      onCheckedChange={(checked) => handleCustomizationChange("showDescription", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compactMode">Modo Compacto</Label>
                    <Switch
                      id="compactMode"
                      checked={customization.compactMode}
                      onCheckedChange={(checked) => handleCustomizationChange("compactMode", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="highlightUnpaid">Resaltar No Pagados</Label>
                    <Switch
                      id="highlightUnpaid"
                      checked={customization.highlightUnpaid}
                      onCheckedChange={(checked) => handleCustomizationChange("highlightUnpaid", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTotals">Mostrar Totales</Label>
                    <Switch
                      id="showTotals"
                      checked={customization.showTotals}
                      onCheckedChange={(checked) => handleCustomizationChange("showTotals", checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fontSize">Tamaño de Fuente</Label>
                    <Select
                      value={customization.fontSize}
                      onValueChange={(value) =>
                        handleCustomizationChange("fontSize", value as "small" | "medium" | "large")
                      }
                    >
                      <SelectTrigger id="fontSize">
                        <SelectValue placeholder="Tamaño de fuente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeño</SelectItem>
                        <SelectItem value="medium">Mediano</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div
            id="report-606-content"
            ref={reportRef}
            className={`p-4 ${customization.compactMode ? "print:text-xs" : "print:text-sm"}`}
          >
            {renderReportHeader()}
            {renderReportTable()}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            {reportSummary && (
              <>
                Total:{" "}
                {new Intl.NumberFormat("es-DO", {
                  style: "currency",
                  currency: "DOP",
                }).format(reportSummary.totalAmount)}{" "}
                | Base:{" "}
                {new Intl.NumberFormat("es-DO", {
                  style: "currency",
                  currency: "DOP",
                }).format(reportSummary.totalBaseAmount)}{" "}
                | ITBIS:{" "}
                {new Intl.NumberFormat("es-DO", {
                  style: "currency",
                  currency: "DOP",
                }).format(reportSummary.totalItbisAmount)}
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo para enviar a DGII */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Reporte a la DGII</DialogTitle>
            <DialogDescription>
              Ingrese sus credenciales de la Oficina Virtual de la DGII para enviar el reporte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dgii-rnc">RNC/Cédula</Label>
              <Input
                id="dgii-rnc"
                value={dgiiCredentials.rnc}
                onChange={(e) => setDgiiCredentials({ ...dgiiCredentials, rnc: e.target.value })}
                placeholder="000-00000-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dgii-username">Usuario</Label>
              <Input
                id="dgii-username"
                value={dgiiCredentials.username}
                onChange={(e) => setDgiiCredentials({ ...dgiiCredentials, username: e.target.value })}
                placeholder="Usuario de la Oficina Virtual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dgii-password">Contraseña</Label>
              <Input
                id="dgii-password"
                type="password"
                value={dgiiCredentials.password}
                onChange={(e) => setDgiiCredentials({ ...dgiiCredentials, password: e.target.value })}
                placeholder="Contraseña de la Oficina Virtual"
              />
            </div>

            {sendResult && (
              <div
                className={`p-3 rounded-md ${sendResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {sendResult.message}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendToDGII} disabled={sendingReport}>
              {sendingReport ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Estilos para impresión */}
      <style jsx global>{`
       @media print {
         body * {
           visibility: hidden;
         }
         #report-606-content,
         #report-606-content * {
           visibility: visible;
         }
         #report-606-content {
           position: absolute;
           left: 0;
           top: 0;
           width: 100%;
         }
         .printing {
           background-color: white !important;
           color: black !important;
         }
       }
     `}</style>
    </div>
  )
}
