"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Download,
  FileText,
  Printer,
  FileUp,
  Info,
  CheckCircle,
  Loader2,
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react"
import { formatDominicanCurrency, formatDominicanDate } from "@/lib/report-utils"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useAlert } from "@/components/ui/alert-provider"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Expense, Report606Entry, Report606Summary, ReportPeriod } from "@/types/report-types"
import {
  calculateReport606Summary,
  convertExpensesToReport606,
  generateReportPeriods,
  getExpensesByDateRange,
  sendReportToDGII,
} from "@/services/report-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { startOfMonth, endOfMonth } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Report606() {
  // State for date range and period
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [period, setPeriod] = useState<string>(
    `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  )

  // State for data
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [report606Data, setReport606Data] = useState<Report606Entry[]>([])
  const [reportSummary, setReportSummary] = useState<Report606Summary | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("report")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // User state
  const [user, setUser] = useState<any>(null)

  // DGII submission state
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [dgiiUsername, setDgiiUsername] = useState("")
  const [dgiiPassword, setDgiiPassword] = useState("")

  // Refs
  const reportRef = useRef<HTMLDivElement>(null)
  const { addAlert } = useAlert()

  // Available periods for selection
  const periods: ReportPeriod[] = generateReportPeriods(2)

  // Load user data on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Update dates when period changes
  useEffect(() => {
    if (period) {
      const year = Number.parseInt(period.substring(0, 4))
      const month = Number.parseInt(period.substring(4, 6)) - 1 // JS months are 0-indexed

      setStartDate(startOfMonth(new Date(year, month)))
      setEndDate(endOfMonth(new Date(year, month)))
    }
  }, [period])

  // Load data when user or dates change
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, startDate, endDate])

  // Load expense data and convert to 606 format
  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get expenses for the selected date range
      const expensesData = await getExpensesByDateRange(user.id, startDate, endDate)
      setExpenses(expensesData)

      // Convert expenses to 606 format
      const report606Entries = convertExpensesToReport606(expensesData)
      setReport606Data(report606Entries)

      // Calculate summary
      const summary = calculateReport606Summary(report606Entries, period, startDate, endDate)
      setReportSummary(summary)

      addAlert({
        type: "success",
        title: "Datos cargados",
        message: `Se cargaron ${expensesData.length} registros para el período seleccionado`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al cargar datos:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al cargar los datos del reporte",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle manual report generation
  const handleGenerateReport = () => {
    loadData()
  }

  // Handle print action
  const handlePrint = () => {
    window.print()
  }

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return

    try {
      setGenerating(true)

      addAlert({
        type: "info",
        title: "Generando PDF",
        message: "Por favor espere mientras se genera el PDF...",
        duration: 3000,
      })

      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`Reporte_606_${period}.pdf`)

      addAlert({
        type: "success",
        title: "PDF generado",
        message: "El reporte 606 ha sido generado exitosamente",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al generar el PDF",
        duration: 5000,
      })
    } finally {
      setGenerating(false)
    }
  }

  // Handle DGII submission dialog
  const handleSendToDGII = () => {
    setShowSendDialog(true)
  }

  // Handle DGII submission
  const handleSubmitToDGII = async () => {
    if (!dgiiUsername || !dgiiPassword || !reportSummary) {
      addAlert({
        type: "error",
        title: "Error",
        message: "Por favor ingrese sus credenciales de la DGII",
        duration: 5000,
      })
      return
    }

    setSending(true)

    try {
      const result = await sendReportToDGII(reportSummary, report606Data, {
        username: dgiiUsername,
        password: dgiiPassword,
      })

      if (result.success) {
        setSendSuccess(true)

        addAlert({
          type: "success",
          title: "Envío exitoso",
          message: result.message,
          duration: 5000,
        })

        // Close dialog after success
        setTimeout(() => {
          setShowSendDialog(false)
          setSendSuccess(false)
          setDgiiUsername("")
          setDgiiPassword("")
        }, 2000)
      } else {
        addAlert({
          type: "error",
          title: "Error",
          message: result.message,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error al enviar a DGII:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al enviar el reporte a la DGII",
        duration: 5000,
      })
    } finally {
      setSending(false)
    }
  }

  // Get filtered report data based on category
  const getFilteredReportData = () => {
    if (filterCategory === "all") return report606Data

    return report606Data.filter((entry) => {
      const expense = expenses.find(
        (e) => e.date === entry.date && e.supplier?.rnc === entry.rnc && e.ncf === entry.ncf,
      )
      return expense?.category === filterCategory
    })
  }

  // Get unique categories from expenses
  const getUniqueCategories = () => {
    const categories = new Set(expenses.map((expense) => expense.category))
    return Array.from(categories)
  }

  // Format period for display
  const formatPeriodDisplay = (periodValue: string) => {
    const year = periodValue.substring(0, 4)
    const month = periodValue.substring(4, 6)
    return `${month}/${year}`
  }

  // Get document type name from code
  const getDocumentTypeName = (code: string) => {
    const types: Record<string, string> = {
      "1": "Factura",
      "2": "Nota de Débito",
      "3": "Nota de Crédito",
      "4": "Comprobante de Compras",
      "5": "Registro Único de Ingresos",
      "6": "Registro de Proveedores Informales",
      "7": "Registro de Gastos Menores",
      "8": "Regímenes Especiales",
      "9": "Comprobante de Compras al Exterior",
    }

    return types[code] || "Desconocido"
  }

  // Get payment method name from code
  const getPaymentMethodName = (code: string) => {
    const methods: Record<string, string> = {
      "1": "Efectivo",
      "2": "Cheque/Transferencia",
      "3": "Tarjeta",
      "4": "Crédito",
      "5": "Permuta",
      "6": "Nota de Crédito",
      "7": "Mixto",
    }

    return methods[code] || "Desconocido"
  }

  // Get filtered data
  const filteredData = getFilteredReportData()
  const uniqueCategories = getUniqueCategories()

  return (
    <>
      <Card className="w-full bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950 border border-blue-200 dark:border-blue-900 shadow-lg print:shadow-none print:border-none">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-t-lg border-b border-blue-200 dark:border-blue-800 print:bg-white print:dark:bg-white print:border-none">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300 print:text-black print:dark:text-black">
                <FileText className="h-6 w-6 print:text-black print:dark:text-black" />
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="print:text-black print:dark:text-black"
                >
                  Formato de Envío 606 - DGII
                </motion.span>
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-400 print:text-gray-700 print:dark:text-gray-700">
                Reporte de Compras de Bienes y Servicios para la Dirección General de Impuestos Internos
              </CardDescription>
            </div>
            <div className="print:hidden">
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Período: {formatPeriodDisplay(period)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 print:p-0">
          {/* Controls Section */}
          <motion.div
            className="flex flex-wrap gap-4 mb-6 print:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="report">Reporte</TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="report" className="space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-blue-700 dark:text-blue-300">Período</Label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800">
                        <SelectValue placeholder="Seleccionar período" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-700 dark:text-blue-300">Fecha Inicio</Label>
                    <DatePicker
                      date={startDate}
                      setDate={setStartDate}
                      className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-700 dark:text-blue-300">Fecha Fin</Label>
                    <DatePicker
                      date={endDate}
                      setDate={setEndDate}
                      className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Generar Reporte
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                        >
                          Acciones
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Opciones de Reporte</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handlePrint} disabled={loading || filteredData.length === 0}>
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDownloadPDF}
                          disabled={loading || generating || filteredData.length === 0}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSendToDGII} disabled={loading || filteredData.length === 0}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Enviar a DGII
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {uniqueCategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-blue-700 dark:text-blue-300">Filtrar por categoría:</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="ml-auto">
                      {filteredData.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {filteredData.length} registros
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Información del Contribuyente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="rnc" className="text-right">
                            RNC/Cédula:
                          </Label>
                          <Input
                            id="rnc"
                            value={user?.rnc || ""}
                            readOnly
                            className="col-span-2 bg-gray-50 dark:bg-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="name" className="text-right">
                            Nombre:
                          </Label>
                          <Input
                            id="name"
                            value={user?.name || ""}
                            readOnly
                            className="col-span-2 bg-gray-50 dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Configuración del Reporte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="format" className="text-right">
                            Formato:
                          </Label>
                          <Select defaultValue="606">
                            <SelectTrigger id="format" className="col-span-2">
                              <SelectValue placeholder="Seleccionar formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="606">Formato 606</SelectItem>
                              <SelectItem value="607" disabled>
                                Formato 607
                              </SelectItem>
                              <SelectItem value="608" disabled>
                                Formato 608
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Report Content */}
          <motion.div
            ref={reportRef}
            className="bg-white p-6 rounded-lg border border-blue-200 dark:bg-white dark:border-blue-800 shadow-md print:shadow-none print:border-none print:p-0 print:dark:bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mb-6 text-center">
              <div className="flex justify-center mb-2">
                <img src="/placeholder.svg?height=60&width=120" alt="DGII Logo" className="h-12 mb-2" />
              </div>
              <h2 className="text-xl font-bold text-blue-800 dark:text-blue-800 print:text-blue-800">
                DIRECCIÓN GENERAL DE IMPUESTOS INTERNOS
              </h2>
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-700 print:text-blue-700">
                FORMATO DE ENVÍO 606
              </h3>
              <h4 className="text-md font-medium text-blue-600 dark:text-blue-600 print:text-blue-600">
                REPORTE DE COMPRAS DE BIENES Y SERVICIOS
              </h4>
              <div className="mt-4 grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-2 bg-blue-50 dark:bg-blue-50 print:bg-blue-50 rounded-md border border-blue-200 dark:border-blue-200 print:border-blue-200 text-left">
                  <p className="font-medium text-blue-700 dark:text-blue-700 print:text-blue-700">
                    <span className="font-bold">RNC/Cédula:</span> {user?.rnc || "N/A"}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-50 print:bg-blue-50 rounded-md border border-blue-200 dark:border-blue-200 print:border-blue-200 text-left">
                  <p className="font-medium text-blue-700 dark:text-blue-700 print:text-blue-700">
                    <span className="font-bold">Período:</span> {formatPeriodDisplay(period)}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="border-collapse w-full">
                <TableHeader className="bg-blue-100 dark:bg-blue-100 print:bg-blue-100">
                  <TableRow className="border-b-2 border-blue-300 dark:border-blue-300 print:border-blue-300">
                    <TableHead className="w-[60px] text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      Línea
                    </TableHead>
                    <TableHead className="w-[100px] text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      Fecha
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      RNC/Cédula
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      Tipo Doc.
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      NCF
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      NCF Modificado
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-right border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      Monto Facturado
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-right border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      ITBIS Facturado
                    </TableHead>
                    <TableHead className="text-blue-800 dark:text-blue-800 print:text-blue-800 font-bold text-center border border-blue-200 dark:border-blue-200 print:border-blue-200">
                      Forma de Pago
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-4 text-gray-500 dark:text-gray-500 print:text-gray-500"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Cargando datos...
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <AlertCircle className="h-5 w-5 mb-2 text-amber-500" />
                            No hay datos para el período seleccionado
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((entry, index) => (
                      <TableRow
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-blue-50 dark:bg-blue-50 print:bg-blue-50"
                            : "bg-white dark:bg-white print:bg-white"
                        }
                      >
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {entry.line}
                        </TableCell>
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {formatDominicanDate(entry.date)}
                        </TableCell>
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {entry.rnc}
                        </TableCell>
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">{entry.docType}</TooltipTrigger>
                              <TooltipContent>
                                <p>{getDocumentTypeName(entry.docType)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {entry.ncf}
                        </TableCell>
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {entry.ncfModified}
                        </TableCell>
                        <TableCell className="text-right border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {formatDominicanCurrency(entry.baseAmount)}
                        </TableCell>
                        <TableCell className="text-right border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          {formatDominicanCurrency(entry.itbisAmount)}
                        </TableCell>
                        <TableCell className="text-center border border-blue-100 dark:border-blue-100 print:border-blue-100 text-black dark:text-black print:text-black">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">{entry.paymentMethod}</TooltipTrigger>
                              <TooltipContent>
                                <p>{getPaymentMethodName(entry.paymentMethod)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {filteredData.length > 0 && (
                    <TableRow className="font-bold bg-blue-100 dark:bg-blue-100 print:bg-blue-100">
                      <TableCell
                        colSpan={6}
                        className="text-right border border-blue-200 dark:border-blue-200 print:border-blue-200 text-blue-800 dark:text-blue-800 print:text-blue-800"
                      >
                        TOTALES:
                      </TableCell>
                      <TableCell className="text-right border border-blue-200 dark:border-blue-200 print:border-blue-200 text-blue-800 dark:text-blue-800 print:text-blue-800">
                        {formatDominicanCurrency(filteredData.reduce((sum, entry) => sum + entry.baseAmount, 0))}
                      </TableCell>
                      <TableCell className="text-right border border-blue-200 dark:border-blue-200 print:border-blue-200 text-blue-800 dark:text-blue-800 print:text-blue-800">
                        {formatDominicanCurrency(filteredData.reduce((sum, entry) => sum + entry.itbisAmount, 0))}
                      </TableCell>
                      <TableCell className="border border-blue-200 dark:border-blue-200 print:border-blue-200"></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredData.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-50 print:bg-blue-50 rounded-md border border-blue-200 dark:border-blue-200 print:border-blue-200 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-600 print:text-blue-600" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-700 print:text-blue-700">
                    <span className="font-bold">Cantidad de Registros:</span> {filteredData.length}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-50 print:bg-blue-50 rounded-md border border-blue-200 dark:border-blue-200 print:border-blue-200 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-600 print:text-blue-600" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-700 print:text-blue-700">
                    <span className="font-bold">Total Monto Facturado:</span>{" "}
                    {formatDominicanCurrency(filteredData.reduce((sum, entry) => sum + entry.baseAmount, 0))}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-50 print:bg-blue-50 rounded-md border border-blue-200 dark:border-blue-200 print:border-blue-200 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-600 print:text-blue-600" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-700 print:text-blue-700">
                    <span className="font-bold">Total ITBIS Facturado:</span>{" "}
                    {formatDominicanCurrency(filteredData.reduce((sum, entry) => sum + entry.itbisAmount, 0))}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-500 print:text-gray-500">
              <p>Este documento es una representación del Formato 606 para fines informativos.</p>
              <p>Para la presentación oficial, utilice la plataforma de la DGII.</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* DGII Submission Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Reporte 606 a la DGII</DialogTitle>
            <DialogDescription>
              Ingrese sus credenciales de la Oficina Virtual de la DGII para enviar el reporte.
            </DialogDescription>
          </DialogHeader>
          {sendSuccess ? (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-green-600">¡Reporte enviado exitosamente!</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    value={dgiiUsername}
                    onChange={(e) => setDgiiUsername(e.target.value)}
                    className="col-span-3"
                    disabled={sending}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={dgiiPassword}
                    onChange={(e) => setDgiiPassword(e.target.value)}
                    className="col-span-3"
                    disabled={sending}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSendDialog(false)} disabled={sending}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSubmitToDGII} disabled={sending}>
                  {sending ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    "Enviar Reporte"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

