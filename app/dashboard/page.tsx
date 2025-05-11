"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartIcon, DollarSign, Users, FileText, Receipt } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { BarChart } from "@/components/charts/bar-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ChartSkeleton } from "@/components/ui/chart-skeleton"
import { NoData } from "@/components/ui/no-data"
import { createClient } from "@supabase/supabase-js"

// Tipos
interface Invoice {
  id: string
  invoiceNumber: string
  date: Date
  total: number
  status: string
}

interface Expense {
  id: string
  date: Date
  description: string
  amount: number
  category: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Obtener usuario actual
        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) {
          setError("No se encontró información del usuario")
          return
        }

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Inicializar cliente Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Cargar facturas
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", userData.id)
          .order("date", { ascending: false })

        if (invoicesError) {
          console.error("Error al cargar facturas:", invoicesError)
          throw new Error("Error al cargar facturas")
        }

        // Cargar gastos
        const { data: expensesData, error: expensesError } = await supabase
          .from("expenses")
          .select("*")
          .eq("user_id", userData.id)
          .order("date", { ascending: false })

        if (expensesError) {
          console.error("Error al cargar gastos:", expensesError)
          throw new Error("Error al cargar gastos")
        }

        // Procesar datos
        setInvoices(invoicesData || [])
        setExpenses(expensesData || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calcular estadísticas
  const totalInvoices = invoices.length
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const pendingInvoices = invoices.filter((inv) => inv.status === "pending").length
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netIncome = totalInvoiceAmount - totalExpenses

  // Datos para gráficos
  const currentDate = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const dayLabels = last7Days.map((date) => date.toLocaleDateString("es-DO", { weekday: "short" }))

  const dailyInvoiceData = last7Days.map((date) => {
    const dayInvoices = invoices.filter((inv) => new Date(inv.date).toDateString() === date.toDateString())
    return dayInvoices.reduce((sum, inv) => sum + inv.total, 0)
  })

  const dailyExpenseData = last7Days.map((date) => {
    const dayExpenses = expenses.filter((exp) => new Date(exp.date).toDateString() === date.toDateString())
    return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  })

  // Datos para gráfico de categorías de gastos
  const expenseCategories = expenses.reduce(
    (acc, expense) => {
      const category = expense.category || "Sin categoría"
      acc[category] = (acc[category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const categoryLabels = Object.keys(expenseCategories)
  const categoryData = Object.values(expenseCategories)
  const categoryColors = [
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 99, 132, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
    "rgba(199, 199, 199, 0.7)",
  ]

  // Colores adaptados para modo oscuro/claro
  const incomeColor = isDark ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.7)"
  const incomeBorderColor = isDark ? "rgb(59, 130, 246)" : "rgb(59, 130, 246)"
  const expenseColor = isDark ? "rgba(239, 68, 68, 0.8)" : "rgba(239, 68, 68, 0.7)"
  const expenseBorderColor = isDark ? "rgb(239, 68, 68)" : "rgb(239, 68, 68)"

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-lg p-6 text-foreground shadow-lg animate-pulse">
          <div className="h-6 w-48 bg-primary/30 rounded mb-2"></div>
          <div className="h-4 w-64 bg-primary/20 rounded"></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-l-4 border-l-gray-300 shadow-md animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-muted/30 dark:bg-muted/10">
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </CardHeader>
          <CardContent className="p-6">
            <ChartSkeleton height={300} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md border-red-200 dark:border-red-900">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-red-700 dark:text-red-300">Error</CardTitle>
            <CardDescription>No se pudieron cargar los datos del dashboard</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-lg p-6 text-foreground shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Bienvenido, {user?.name}</h2>
        <p className="opacity-90">Aquí tienes un resumen de tu actividad reciente</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalInvoiceAmount)}
            </div>
            <p className="text-xs text-muted-foreground">{totalInvoices} facturas emitidas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} gastos registrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
            <BarChartIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(netIncome)}</div>
            <p className="text-xs text-muted-foreground">Balance de ingresos y gastos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Facturas por cobrar</p>
          </CardContent>
        </Card>
      </div>

      <ErrorBoundary>
        <Card className="shadow-md">
          <CardHeader className="bg-muted/30 dark:bg-muted/10">
            <CardTitle>Ingresos vs Gastos (Últimos 7 días)</CardTitle>
            <CardDescription>Comparativa de ingresos y gastos diarios</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              {dailyInvoiceData.some((val) => val > 0) || dailyExpenseData.some((val) => val > 0) ? (
                <BarChart
                  data={{
                    labels: dayLabels,
                    datasets: [
                      {
                        label: "Ingresos",
                        data: dailyInvoiceData,
                        backgroundColor: incomeColor,
                        borderColor: incomeBorderColor,
                        borderWidth: 1,
                      },
                      {
                        label: "Gastos",
                        data: dailyExpenseData,
                        backgroundColor: expenseColor,
                        borderColor: expenseBorderColor,
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              ) : (
                <NoData message="No hay datos de ingresos o gastos para mostrar en este período" />
              )}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary>
        <Card className="shadow-md">
          <CardHeader className="bg-muted/30 dark:bg-muted/10">
            <CardTitle>Distribución de Gastos por Categoría</CardTitle>
            <CardDescription>Análisis de gastos por categoría</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              {categoryData.length > 0 && categoryData.some((val) => val > 0) ? (
                <PieChart
                  data={{
                    labels: categoryLabels,
                    datasets: [
                      {
                        label: "Gastos por Categoría",
                        data: categoryData,
                        backgroundColor: categoryColors.slice(0, categoryLabels.length),
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              ) : (
                <NoData message="No hay datos de categorías de gastos para mostrar" />
              )}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <Tabs defaultValue="7days" className="space-y-4">
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
        </TabsList>
        <TabsContent value="7days" className="space-y-4">
          <RecentActivity invoices={filterLast7Days(invoices)} expenses={filterLast7Days(expenses)} />
        </TabsContent>
        <TabsContent value="30days" className="space-y-4">
          <RecentActivity invoices={filterLast30Days(invoices)} expenses={filterLast30Days(expenses)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RecentActivity({ invoices, expenses }: { invoices: Invoice[]; expenses: Expense[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-1 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            Facturas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">No hay facturas recientes</p>
          ) : (
            <div>
              {invoices.slice(0, 5).map((invoice, index) => (
                <div
                  key={invoice.id}
                  className={`flex items-center justify-between p-4 ${
                    index < invoices.slice(0, 5).length - 1 ? "border-b" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium">Factura #{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.total)}</p>
                    <p className={`text-xs ${getStatusColor(invoice.status)}`}>{getStatusText(invoice.status)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-1 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-red-50/50 dark:bg-red-900/20">
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
            Gastos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">No hay gastos recientes</p>
          ) : (
            <div>
              {expenses.slice(0, 5).map((expense, index) => (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between p-4 ${
                    index < expenses.slice(0, 5).length - 1 ? "border-b" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()} - {expense.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600 dark:text-red-400">{formatCurrency(expense.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Funciones auxiliares
function filterLast7Days<T extends { date: Date }>(items: T[]): T[] {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return items
    .filter((item) => new Date(item.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function filterLast30Days<T extends { date: Date }>(items: T[]): T[] {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return items
    .filter((item) => new Date(item.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "text-green-600 dark:text-green-400"
    case "pending":
      return "text-amber-600 dark:text-amber-400"
    case "overdue":
      return "text-red-600 dark:text-red-400"
    default:
      return "text-gray-600 dark:text-gray-400"
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "paid":
      return "Pagada"
    case "pending":
      return "Pendiente"
    case "overdue":
      return "Vencida"
    case "cancelled":
      return "Cancelada"
    default:
      return status
  }
}
