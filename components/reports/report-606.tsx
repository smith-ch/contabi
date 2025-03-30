"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { ChevronDown, Download, Printer, RefreshCw, Send } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { exportToPDF, printElement } from "@/lib/pdf-utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase-client"

// Tipos
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

export function Report606() {
  // Estado para el período seleccionado y fechas
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([])
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))

  // Estado para los datos del reporte
  const [loading, setLoading] = useState<boolean>(false)
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

    const loadFilters = async () => {
      try {
        // En un caso real, estos datos vendrían de la base de datos
        setAvailableFilters({
          categories: ["Bienes", "Servicios", "Alquileres", "Importaciones", "Telecomunicaciones"],
          documentTypes: ["Factura", "Nota de Débito", "Nota de Crédito", "Comprobante de Compras"],
          paymentMethods: ["Efectivo", "Cheques/Transferencias/Depósito", "Tarjeta Crédito/Débito", "Compra a Crédito"],
          suppliers: [
            { id: "1", name: "Proveedor 1", rnc: "123456789" },
            { id: "2", name: "Proveedor 2", rnc: "987654321" },
          ],
        })
      } catch (error) {
        console.error("Error al cargar filtros:", error)
      }
    }

    loadPeriods()
    loadFilters()
  }, [])

  // Efecto para actualizar fechas cuando cambia el período
  useEffect(() => {
    if (selectedPeriod) {
      const year = Number.parseInt(selectedPeriod.substring(0, 4))
      const month = Number.parseInt(selectedPeriod.substring(4, 6)) - 1 // Meses en JS son 0-indexed

      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)

      setStartDate(start)
      setEndDate(end)
    }
  }, [selectedPeriod])

  // Reemplazar el useEffect que causa el bucle infinito con esta implementación:

  // Eliminar este useEffect que causa el problema
  useEffect(() => {
    if (startDate && endDate && selectedPeriod) {
      const controller = new AbortController()

      const fetchData = async () => {
        try {
          setLoading(true)
          await loadReportData()
        } catch (error) {
          console.error("Error al cargar datos del reporte:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos del reporte. Intente nuevamente.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      fetchData()

      return () => {
        controller.abort()
      }
    }
  }, [startDate, endDate, selectedPeriod, JSON.stringify(filters)])

  // Y reemplazarlo con este nuevo useEffect que evita el bucle infinito
  useEffect(() => {
    // Crear una bandera para controlar si el componente está montado
    let isMounted = true

    const fetchData = async () => {
      if (!startDate || !endDate || !selectedPeriod) return

      try {
        setLoading(true)

        // En un caso real, estos datos vendrían de Supabase
        const supabase = createClient()

        // Simulamos una carga de datos
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Solo continuar si el componente sigue montado
        if (!isMounted) return

        // Datos de ejemplo
        const mockExpenses: Expense[] = [
          {
            id: "1",
            date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            supplier: {
              id: "1",
              name: "Proveedor 1",
              rnc: "123456789",
            },
            ncf: "B0100000001",
            description: "Compra de materiales",
            category: "Bienes",
            amount: 11800,
            itbisIncluded: true,
            hasItbis: true,
            paymentMethod: "Efectivo",
            status: "paid",
            docType: "Factura",
          },
          {
            id: "2",
            date: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            supplier: {
              id: "2",
              name: "Proveedor 2",
              rnc: "987654321",
            },
            ncf: "B0100000002",
            description: "Servicios profesionales",
            category: "Servicios",
            amount: 5900,
            itbisIncluded: true,
            hasItbis: true,
            paymentMethod: "Cheques/Transferencias/Depósito",
            status: "paid",
            docType: "Factura",
          },
        ]

        // Aplicar filtros
        const filteredExpenses = mockExpenses.filter((expense) => {
          // Filtrar por categoría
          if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
            return false
          }

          // Filtrar por tipo de documento
          if (filters.documentTypes.length > 0 && !filters.documentTypes.includes(expense.docType)) {
            return false
          }

          // Filtrar por método de pago
          if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(expense.paymentMethod)) {
            return false
          }

          // Filtrar por proveedor
          if (filters.suppliers.length > 0 && !filters.suppliers.includes(expense.supplier.id)) {
            return false
          }

          // Filtrar por estado
          if (filters.status.length > 0 && !filters.status.includes(expense.status)) {
            return false
          }

          return true
        })

        // Calcular montos base e ITBIS
        const processedExpenses = filteredExpenses.map((expense) => {
          if (expense.hasItbis) {
            if (expense.itbisIncluded) {
              const baseAmount = +(expense.amount / 1.18).toFixed(2)
              const itbisAmount = +(expense.amount - baseAmount).toFixed(2)
              return { ...expense, baseAmount, itbisAmount }
            } else {
              const baseAmount = expense.amount
              const itbisAmount = +(baseAmount * 0.18).toFixed(2)
              return { ...expense, baseAmount, itbisAmount }
            }
          } else {
            return { ...expense, baseAmount: expense.amount, itbisAmount: 0 }
          }
        })

        // Solo actualizar estados si el componente sigue montado
        if (isMounted) {
          setExpenses(processedExpenses)

          // Convertir a formato 606
          const entries: Report606Entry[] = processedExpenses.map((expense, index) => ({
            line: index + 1,
            date: typeof expense.date === "string" ? expense.date : format(expense.date, "yyyy-MM-dd"),
            rnc: expense.supplier.rnc,
            supplierName: expense.supplier.name,
            docType: expense.docType === "Factura" ? "01" : "02",
            ncf: expense.ncf,
            ncfModified: expense.ncfModified || "",
            baseAmount: expense.baseAmount || 0,
            itbisAmount: expense.itbisAmount || 0,
            itbisRetenido: 0,
            itbisPercibido: 0,
            isr: 0,
            paymentMethod: expense.paymentMethod === "Efectivo" ? "01" : "02",
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
        }
      } catch (error) {
        console.error("Error al cargar datos del reporte:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos del reporte. Intente nuevamente.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Función de limpieza para evitar actualizaciones de estado en componentes desmontados
    return () => {
      isMounted = false
    }
  }, [startDate, endDate, selectedPeriod, filters, toast])

  // Modificar la función loadReportData para que sea más simple y solo se use para el botón de actualizar
  const loadReportData = useCallback(async () => {
    if (!startDate || !endDate) return

    setLoading(true)
    try {
      // En un caso real, estos datos vendrían de Supabase
      const supabase = createClient()

      // Simulamos una carga de datos
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Datos de ejemplo - usar los mismos datos que en el useEffect
      const mockExpenses: Expense[] = [
        {
          id: "1",
          date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          supplier: {
            id: "1",
            name: "Proveedor 1",
            rnc: "123456789",
          },
          ncf: "B0100000001",
          description: "Compra de materiales",
          category: "Bienes",
          amount: 11800,
          itbisIncluded: true,
          hasItbis: true,
          paymentMethod: "Efectivo",
          status: "paid",
          docType: "Factura",
        },
        {
          id: "2",
          date: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          supplier: {
            id: "2",
            name: "Proveedor 2",
            rnc: "987654321",
          },
          ncf: "B0100000002",
          description: "Servicios profesionales",
          category: "Servicios",
          amount: 5900,
          itbisIncluded: true,
          hasItbis: true,
          paymentMethod: "Cheques/Transferencias/Depósito",
          status: "paid",
          docType: "Factura",
        },
      ]

      // Aplicar filtros
      const filteredExpenses = mockExpenses.filter((expense) => {
        // Filtrar por categoría
        if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
          return false
        }

        // Filtrar por tipo de documento
        if (filters.documentTypes.length > 0 && !filters.documentTypes.includes(expense.docType)) {
          return false
        }

        // Filtrar por método de pago
        if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(expense.paymentMethod)) {
          return false
        }

        // Filtrar por proveedor
        if (filters.suppliers.length > 0 && !filters.suppliers.includes(expense.supplier.id)) {
          return false
        }

        // Filtrar por estado
        if (filters.status.length > 0 && !filters.status.includes(expense.status)) {
          return false
        }

        return true
      })

      // Calcular montos base e ITBIS
      const processedExpenses = filteredExpenses.map((expense) => {
        if (expense.hasItbis) {
          if (expense.itbisIncluded) {
            const baseAmount = +(expense.amount / 1.18).toFixed(2)
            const itbisAmount = +(expense.amount - baseAmount).toFixed(2)
            return { ...expense, baseAmount, itbisAmount }
          } else {
            const baseAmount = expense.amount
            const itbisAmount = +(baseAmount * 0.18).toFixed(2)
            return { ...expense, baseAmount, itbisAmount }
          }
        } else {
          return { ...expense, baseAmount: expense.amount, itbisAmount: 0 }
        }
      })

      setExpenses(processedExpenses)

      // Convertir a formato 606
      const entries: Report606Entry[] = processedExpenses.map((expense, index) => ({
        line: index + 1,
        date: typeof expense.date === "string" ? expense.date : format(expense.date, "yyyy-MM-dd"),
        rnc: expense.supplier.rnc,
        supplierName: expense.supplier.name,
        docType: expense.docType === "Factura" ? "01" : "02",
        ncf: expense.ncf,
        ncfModified: expense.ncfModified || "",
        baseAmount: expense.baseAmount || 0,
        itbisAmount: expense.itbisAmount || 0,
        itbisRetenido: 0,
        itbisPercibido: 0,
        isr: 0,
        paymentMethod: expense.paymentMethod === "Efectivo" ? "01" : "02",
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
    } catch (error) {
      console.error("Error al cargar datos del reporte:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedPeriod, filters, toast])

  // Cargar datos del reporte
  // const loadReportData = async () => {
  //   if (!startDate || !endDate) return

  //   try {
  //     // En un caso real, estos datos vendrían de Supabase
  //     const supabase = createClient()

  //     // Simulamos una carga de datos
  //     await new Promise((resolve) => setTimeout(resolve, 1000))

  //     // Datos de ejemplo
  //     const mockExpenses: Expense[] = [
  //       {
  //         id: "1",
  //         date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
  //         supplier: {
  //           id: "1",
  //           name: "Proveedor 1",
  //           rnc: "123456789",
  //         },
  //         ncf: "B0100000001",
  //         description: "Compra de materiales",
  //         category: "Bienes",
  //         amount: 11800,
  //         itbisIncluded: true,
  //         hasItbis: true,
  //         paymentMethod: "Efectivo",
  //         status: "paid",
  //         docType: "Factura",
  //       },
  //       {
  //         id: "2",
  //         date: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
  //         supplier: {
  //           id: "2",
  //           name: "Proveedor 2",
  //           rnc: "987654321",
  //         },
  //         ncf: "B0100000002",
  //         description: "Servicios profesionales",
  //         category: "Servicios",
  //         amount: 5900,
  //         itbisIncluded: true,
  //         hasItbis: true,
  //         paymentMethod: "Cheques/Transferencias/Depósito",
  //         status: "paid",
  //         docType: "Factura",
  //       },
  //     ]

  //     // Aplicar filtros
  //     const filteredExpenses = mockExpenses.filter((expense) => {
  //       // Filtrar por categoría
  //       if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
  //         return false
  //       }

  //       // Filtrar por tipo de documento
  //       if (filters.documentTypes.length > 0 && !filters.documentTypes.includes(expense.docType)) {
  //         return false
  //       }

  //       // Filtrar por método de pago
  //       if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(expense.paymentMethod)) {
  //         return false
  //       }

  //       // Filtrar por proveedor
  //       if (filters.suppliers.length > 0 && !filters.suppliers.includes(expense.supplier.id)) {
  //         return false
  //       }

  //       // Filtrar por estado
  //       if (filters.status.length > 0 && !filters.status.includes(expense.status)) {
  //         return false
  //       }

  //       return true
  //     })

  //     // Calcular montos base e ITBIS
  //     const processedExpenses = filteredExpenses.map((expense) => {
  //       if (expense.hasItbis) {
  //         if (expense.itbisIncluded) {
  //           const baseAmount = +(expense.amount / 1.18).toFixed(2)
  //           const itbisAmount = +(expense.amount - baseAmount).toFixed(2)
  //           return { ...expense, baseAmount, itbisAmount }
  //         } else {
  //           const baseAmount = expense.amount
  //           const itbisAmount = +(baseAmount * 0.18).toFixed(2)
  //           return { ...expense, baseAmount, itbisAmount }
  //         }
  //       } else {
  //         return { ...expense, baseAmount: expense.amount, itbisAmount: 0 }
  //       }
  //     })

  //     setExpenses(processedExpenses)

  //     // Convertir a formato 606
  //     const entries: Report606Entry[] = processedExpenses.map((expense, index) => ({
  //       line: index + 1,
  //       date: typeof expense.date === "string" ? expense.date : format(expense.date, "yyyy-MM-dd"),
  //       rnc: expense.supplier.rnc,
  //       supplierName: expense.supplier.name,
  //       docType: expense.docType === "Factura" ? "01" : "02",
  //       ncf: expense.ncf,
  //       ncfModified: expense.ncfModified || "",
  //       baseAmount: expense.baseAmount || 0,
  //       itbisAmount: expense.itbisAmount || 0,
  //       itbisRetenido: 0,
  //       itbisPercibido: 0,
  //       isr: 0,
  //       paymentMethod: expense.paymentMethod === "Efectivo" ? "01" : "02",
  //     }))

  //     setReportEntries(entries)

  //     // Calcular resumen
  //     const summary: Report606Summary = {
  //       period: selectedPeriod,
  //       startDate,
  //       endDate,
  //       totalRecords: entries.length,
  //       totalAmount: entries.reduce((sum, entry) => sum + entry.baseAmount + entry.itbisAmount, 0),
  //       totalBaseAmount: entries.reduce((sum, entry) => sum + entry.baseAmount, 0),
  //       totalItbisAmount: entries.reduce((sum, entry) => sum + entry.itbisAmount, 0),
  //       totalItbisRetenido: entries.reduce((sum, entry) => sum + (entry.itbisRetenido || 0), 0),
  //       totalItbisPercibido: entries.reduce((sum, entry) => sum + (entry.itbisPercibido || 0), 0),
  //       totalIsr: entries.reduce((sum, entry) => sum + (entry.isr || 0), 0),
  //     }

  //     setReportSummary(summary)
  //   } catch (error) {
  //     console.error("Error al cargar datos del reporte:", error)
  //     throw error
  //   }
  // }

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
                (e) =>
                  e.ncf === entry.ncf &&
                  (typeof e.date === "string" ? e.date : format(e.date, "yyyy-MM-dd")) === entry.date,
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
                  <Label className="mb-2 block">Categor��as</Label>
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

