"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getInvoicesByDateRange,
  getExpensesByDateRange,
  type Invoice,
  type Expense,
  checkOverdueInvoices,
} from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Download, LineChart, PieChart, Filter, Printer, Share2 } from "lucide-react"
import { BarChart as BarChartComponent } from "@/components/charts/bar-chart"
import { LineChart as LineChartComponent } from "@/components/charts/line-chart"
import { PieChart as PieChartComponent } from "@/components/charts/pie-chart"
import { useTheme } from "next-themes"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAlert } from "@/components/ui/alert-provider"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [invoices7Days, setInvoices7Days] = useState<Invoice[]>([])
  const [expenses7Days, setExpenses7Days] = useState<Expense[]>([])
  const [invoices30Days, setInvoices30Days] = useState<Invoice[]>([])
  const [expenses30Days, setExpenses30Days] = useState<Expense[]>([])
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date())
  const [customInvoices, setCustomInvoices] = useState<Invoice[]>([])
  const [customExpenses, setCustomExpenses] = useState<Expense[]>([])
  const [reportTitle, setReportTitle] = useState("Reporte Financiero")
  const [reportDescription, setReportDescription] = useState("")
  const [activeTab, setActiveTab] = useState("7days")
  const reportRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { addAlert } = useAlert()

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) return

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Verificar facturas vencidas
        await checkOverdueInvoices(userData.id)

        // Calcular fechas
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Cargar datos para los últimos 7 días
        const invoices7 = await getInvoicesByDateRange(userData.id, sevenDaysAgo, now)
        const expenses7 = await getExpensesByDateRange(userData.id, sevenDaysAgo, now)

        setInvoices7Days(invoices7)
        setExpenses7Days(expenses7)

        // Cargar datos para los últimos 30 días
        const invoices30 = await getInvoicesByDateRange(userData.id, thirtyDaysAgo, now)
        const expenses30 = await getExpensesByDateRange(userData.id, thirtyDaysAgo, now)

        setInvoices30Days(invoices30)
        setExpenses30Days(expenses30)

        // Cargar datos para el rango personalizado inicial (últimos 30 días por defecto)
        setCustomInvoices(invoices30)
        setCustomExpenses(expenses30)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCustomDateChange = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Asegurarse de que las fechas sean válidas
      if (customStartDate > customEndDate) {
        addAlert({
          type: "error",
          title: "Error en fechas",
          message: "La fecha de inicio no puede ser posterior a la fecha de fin",
          duration: 5000,
        })
        return
      }

      // Cargar datos para el rango personalizado
      const customInvoicesData = await getInvoicesByDateRange(user.id, customStartDate, customEndDate)
      const customExpensesData = await getExpensesByDateRange(user.id, customStartDate, customEndDate)

      setCustomInvoices(customInvoicesData)
      setCustomExpenses(customExpensesData)

      // Cambiar a la pestaña personalizada
      setActiveTab("custom")

      addAlert({
        type: "success",
        title: "Datos actualizados",
        message: "Los datos del reporte han sido actualizados para el rango de fechas seleccionado",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al cargar datos personalizados:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al cargar los datos para el rango seleccionado",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!reportRef.current) return

    try {
      setGenerating(true)

      addAlert({
        type: "info",
        title: "Generando PDF",
        message: "Por favor espere mientras se genera el PDF...",
        duration: 3000,
      })

      // Dar tiempo para que se renderice correctamente
      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${reportTitle.replace(/\s+/g, "_")}.pdf`)

      addAlert({
        type: "success",
        title: "PDF generado",
        message: "El reporte ha sido exportado como PDF exitosamente",
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

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reportTitle,
          text: `${reportTitle} - ${reportDescription || "Reporte financiero"}`,
        })
      } else {
        // Fallback si Web Share API no está disponible
        await navigator.clipboard.writeText(`${reportTitle} - ${reportDescription || "Reporte financiero"}`)
        addAlert({
          type: "success",
          title: "Enlace copiado",
          message: "La información del reporte ha sido copiada al portapapeles",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error al compartir:", error)
    }
  }

  const calculateSummary = (invoices: Invoice[], expenses: Expense[]) => {
    const totalIncome = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netIncome = totalIncome - totalExpenses

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    }
  }

  const summary7Days = calculateSummary(invoices7Days, expenses7Days)
  const summary30Days = calculateSummary(invoices30Days, expenses30Days)
  const summaryCustom = calculateSummary(customInvoices, customExpenses)

  // Preparar datos para gráficos
  const getDailyData = (invoices: Invoice[], expenses: Expense[], days: number) => {
    const now = new Date()
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (days - 1 - i))
      return date
    })

    const labels = dates.map((date) => date.toLocaleDateString("es-DO", { weekday: "short", day: "numeric" }))

    const incomeData = dates.map((date) => {
      const dayInvoices = invoices.filter((inv) => new Date(inv.date).toDateString() === date.toDateString())
      return dayInvoices.reduce((sum, inv) => sum + inv.total, 0)
    })

    const expenseData = dates.map((date) => {
      const dayExpenses = expenses.filter((exp) => new Date(exp.date).toDateString() === date.toDateString())
      return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    })

    return { labels, incomeData, expenseData }
  }

  const getCustomRangeData = (invoices: Invoice[], expenses: Expense[], startDate: Date, endDate: Date) => {
    // Calcular el número de días en el rango
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Si el rango es muy grande, agrupar por semanas o meses
    let groupBy = "day"
    if (diffDays > 60) {
      groupBy = "month"
    } else if (diffDays > 14) {
      groupBy = "week"
    }

    if (groupBy === "day") {
      // Generar array de fechas para cada día en el rango
      const dates = []
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }

      const labels = dates.map((date) => date.toLocaleDateString("es-DO", { day: "numeric", month: "short" }))

      const incomeData = dates.map((date) => {
        const dayInvoices = invoices.filter((inv) => new Date(inv.date).toDateString() === date.toDateString())
        return dayInvoices.reduce((sum, inv) => sum + inv.total, 0)
      })

      const expenseData = dates.map((date) => {
        const dayExpenses = expenses.filter((exp) => new Date(exp.date).toDateString() === date.toDateString())
        return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      })

      return { labels, incomeData, expenseData }
    } else if (groupBy === "week") {
      // Agrupar por semanas
      const weeks = []
      const labels = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate)
        const weekEnd = new Date(currentDate)
        weekEnd.setDate(weekEnd.getDate() + 6)

        if (weekEnd > endDate) {
          weeks.push({ start: weekStart, end: endDate })
          labels.push(
            `${weekStart.toLocaleDateString("es-DO", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("es-DO", { day: "numeric", month: "short" })}`,
          )
        } else {
          weeks.push({ start: weekStart, end: weekEnd })
          labels.push(
            `${weekStart.toLocaleDateString("es-DO", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("es-DO", { day: "numeric", month: "short" })}`,
          )
        }

        currentDate.setDate(currentDate.getDate() + 7)
      }

      const incomeData = weeks.map((week) => {
        const weekInvoices = invoices.filter((inv) => {
          const invDate = new Date(inv.date)
          return invDate >= week.start && invDate <= week.end
        })
        return weekInvoices.reduce((sum, inv) => sum + inv.total, 0)
      })

      const expenseData = weeks.map((week) => {
        const weekExpenses = expenses.filter((exp) => {
          const expDate = new Date(exp.date)
          return expDate >= week.start && expDate <= week.end
        })
        return weekExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      })

      return { labels, incomeData, expenseData }
    } else {
      // Agrupar por meses
      const months = []
      const labels = []

      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

      while (currentDate <= endMonth) {
        const monthStart = new Date(currentDate)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        months.push({ start: monthStart, end: monthEnd })
        labels.push(currentDate.toLocaleDateString("es-DO", { month: "long", year: "numeric" }))

        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      const incomeData = months.map((month) => {
        const monthInvoices = invoices.filter((inv) => {
          const invDate = new Date(inv.date)
          return invDate >= month.start && invDate <= month.end
        })
        return monthInvoices.reduce((sum, inv) => sum + inv.total, 0)
      })

      const expenseData = months.map((month) => {
        const monthExpenses = expenses.filter((exp) => {
          const expDate = new Date(exp.date)
          return expDate >= month.start && expDate <= month.end
        })
        return monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      })

      return { labels, incomeData, expenseData }
    }
  }

  const getExpensesByCategory = (expenses: Expense[]) => {
    const categories: Record<string, number> = {}

    expenses.forEach((expense) => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0
      }
      categories[expense.category] += expense.amount
    })

    const labels = Object.keys(categories)
    const data = Object.values(categories)

    // Colores para las categorías
    const backgroundColors = [
      "rgba(255, 99, 132, 0.7)",
      "rgba(54, 162, 235, 0.7)",
      "rgba(255, 206, 86, 0.7)",
      "rgba(75, 192, 192, 0.7)",
      "rgba(153, 102, 255, 0.7)",
      "rgba(255, 159, 64, 0.7)",
      "rgba(199, 199, 199, 0.7)",
      "rgba(83, 102, 255, 0.7)",
    ]

    return { labels, data, backgroundColors }
  }

  const data7Days = getDailyData(invoices7Days, expenses7Days, 7)
  const data30Days = getDailyData(invoices30Days, expenses30Days, 30)
  const dataCustom = getCustomRangeData(customInvoices, customExpenses, customStartDate, customEndDate)
  const expenseCategories7Days = getExpensesByCategory(expenses7Days)
  const expenseCategories30Days = getExpensesByCategory(expenses30Days)
  const expenseCategoriesCustom = getExpensesByCategory(customExpenses)

  // Colores adaptados para modo oscuro/claro
  const incomeColor = isDark ? "rgb(34, 197, 94)" : "rgb(34, 197, 94)"
  const expenseColor = isDark ? "rgb(239, 68, 68)" : "rgb(239, 68, 68)"

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-primary animate-pulse">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reportes Financieros</h2>
          <p className="text-muted-foreground">Análisis detallado de sus ingresos y gastos</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Personalizar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Personalizar Reporte</DialogTitle>
                <DialogDescription>
                  Seleccione un rango de fechas y configure los detalles del reporte
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reportTitle" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="reportTitle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reportDescription" className="text-right">
                    Descripción
                  </Label>
                  <Input
                    id="reportDescription"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Fecha Inicio</Label>
                  <div className="col-span-3">
                    <DatePicker date={customStartDate} setDate={setCustomStartDate} />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Fecha Fin</Label>
                  <div className="col-span-3">
                    <DatePicker date={customEndDate} setDate={setCustomEndDate} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCustomDateChange}>Aplicar Filtros</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir
          </Button>
          <Button onClick={handleExportPDF} disabled={generating}>
            {generating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Generando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/30 dark:bg-muted/10 p-1">
          <TabsTrigger
            value="7days"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Últimos 7 días
          </TabsTrigger>
          <TabsTrigger
            value="30days"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Últimos 30 días
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Personalizado
          </TabsTrigger>
        </TabsList>

        <div ref={reportRef} className="print:p-8">
          <div className="print:mb-8 print:text-center">
            <h1 className="print:text-2xl print:font-bold">{reportTitle}</h1>
            {reportDescription && <p className="print:text-sm print:mt-2">{reportDescription}</p>}
          </div>

          <TabsContent value="7days" className="animate-slide-up">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <LineChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary7Days.totalIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">{summary7Days.invoiceCount} facturas emitidas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                  <BarChart className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(summary7Days.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">{summary7Days.expenseCount} gastos registrados</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
                  <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${summary7Days.netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {formatCurrency(summary7Days.netIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">Balance de ingresos y gastos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-muted/30 dark:bg-muted/10">
                <CardTitle>Análisis de Ingresos y Gastos (7 días)</CardTitle>
                <CardDescription>Resumen de actividad financiera de los últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <BarChartComponent
                    data={{
                      labels: data7Days.labels,
                      datasets: [
                        {
                          label: "Ingresos",
                          data: data7Days.incomeData,
                          backgroundColor: "rgba(34, 197, 94, 0.7)",
                          borderColor: "rgb(34, 197, 94)",
                          borderWidth: 1,
                        },
                        {
                          label: "Gastos",
                          data: data7Days.expenseData,
                          backgroundColor: "rgba(239, 68, 68, 0.7)",
                          borderColor: "rgb(239, 68, 68)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    title="Ingresos vs Gastos Diarios"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-muted/30 dark:bg-muted/10">
                <CardTitle>Distribución de Gastos por Categoría</CardTitle>
                <CardDescription>Análisis de gastos por categoría en los últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  {expenseCategories7Days.labels.length > 0 ? (
                    <PieChartComponent
                      data={{
                        labels: expenseCategories7Days.labels,
                        datasets: [
                          {
                            label: "Gastos por Categoría",
                            data: expenseCategories7Days.data,
                            backgroundColor: expenseCategories7Days.backgroundColors,
                            borderWidth: 1,
                          },
                        ],
                      }}
                      title="Distribución de Gastos"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No hay datos de gastos disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="30days" className="animate-slide-up">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <LineChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary30Days.totalIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">{summary30Days.invoiceCount} facturas emitidas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                  <BarChart className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(summary30Days.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">{summary30Days.expenseCount} gastos registrados</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
                  <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${summary30Days.netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {formatCurrency(summary30Days.netIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">Balance de ingresos y gastos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-muted/30 dark:bg-muted/10">
                <CardTitle>Análisis de Ingresos y Gastos (30 días)</CardTitle>
                <CardDescription>Resumen de actividad financiera de los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <LineChartComponent
                    data={{
                      labels: data30Days.labels,
                      datasets: [
                        {
                          label: "Ingresos",
                          data: data30Days.incomeData,
                          borderColor: incomeColor,
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                          tension: 0.3,
                          fill: true,
                        },
                        {
                          label: "Gastos",
                          data: data30Days.expenseData,
                          borderColor: expenseColor,
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          tension: 0.3,
                          fill: true,
                        },
                      ],
                    }}
                    title="Tendencia de Ingresos y Gastos"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-muted/30 dark:bg-muted/10">
                <CardTitle>Distribución de Gastos por Categoría</CardTitle>
                <CardDescription>Análisis de gastos por categoría en los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  {expenseCategories30Days.labels.length > 0 ? (
                    <PieChartComponent
                      data={{
                        labels: expenseCategories30Days.labels,
                        datasets: [
                          {
                            label: "Gastos por Categoría",
                            data: expenseCategories30Days.data,
                            backgroundColor: expenseCategories30Days.backgroundColors,
                            borderWidth: 1,
                          },
                        ],
                      }}
                      title="Distribución de Gastos"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No hay datos de gastos disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="animate-slide-up">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <LineChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summaryCustom.totalIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">{summaryCustom.invoiceCount} facturas emitidas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                  <BarChart className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(summaryCustom.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">{summaryCustom.expenseCount} gastos registrados</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
                  <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${summaryCustom.netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {formatCurrency(summaryCustom.netIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">Balance de ingresos y gastos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-muted/30 dark:bg-muted/10">
                <CardTitle>Análisis de Ingresos y Gastos (Personalizado)</CardTitle>
                <CardDescription>
                  Período: {customStartDate.toLocaleDateString()} - {customEndDate.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <BarChartComponent
                    data={{
                      labels: dataCustom.labels,
                      datasets: [
                        {
                          label: "Ingresos",
                          data: dataCustom.incomeData,
                          backgroundColor: "rgba(34, 197, 94, 0.7)",
                          borderColor: "rgb(34, 197, 94)",
                          borderWidth: 1,
                        },
                        {
                          label: "Gastos",
                          data: dataCustom.expenseData,
                          backgroundColor: "rgba(239, 68, 68, 0.7)",
                          borderColor: "rgb(239, 68, 68)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    title="Ingresos vs Gastos"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-muted/30 dark:bg-muted/10">
                <CardTitle>Distribución de Gastos por Categoría</CardTitle>
                <CardDescription>Análisis de gastos por categoría en el período seleccionado</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  {expenseCategoriesCustom.labels.length > 0 ? (
                    <PieChartComponent
                      data={{
                        labels: expenseCategoriesCustom.labels,
                        datasets: [
                          {
                            label: "Gastos por Categoría",
                            data: expenseCategoriesCustom.data,
                            backgroundColor: expenseCategoriesCustom.backgroundColors,
                            borderWidth: 1,
                          },
                        ],
                      }}
                      title="Distribución de Gastos"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No hay datos de gastos disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

