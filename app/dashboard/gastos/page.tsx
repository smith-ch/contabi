"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
// Asegurarnos de que estamos importando desde el archivo correcto
import { getExpensesByUserId, createExpense, updateExpense, deleteExpense, type Expense } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Edit, MoreHorizontal, PlusCircle, Search, Trash } from "lucide-react"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })
  const { toast } = useToast()

  const expenseCategories = [
    "Alquiler",
    "Servicios",
    "Salarios",
    "Materiales",
    "Transporte",
    "Marketing",
    "Impuestos",
    "Otros",
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) return

        const userData = JSON.parse(storedUser)

        // Cargar gastos
        const userExpenses = await getExpensesByUserId(userData.id)
        setExpenses(userExpenses)
        setFilteredExpenses(userExpenses)
      } catch (error) {
        console.error("Error al cargar gastos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredExpenses(expenses)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredExpenses(
        expenses.filter(
          (expense) =>
            expense.description.toLowerCase().includes(term) || expense.category.toLowerCase().includes(term),
        ),
      )
    }
  }, [searchTerm, expenses])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleAddExpense = () => {
    setCurrentExpense(null)
    setFormData({
      category: "",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    })
    setIsDialogOpen(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpense(expense)
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split("T")[0],
    })
    setIsDialogOpen(true)
  }

  const handleDeleteExpense = (expense: Expense) => {
    setCurrentExpense(expense)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.amount || !formData.category) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) return

      const userData = JSON.parse(storedUser)

      if (currentExpense) {
        // Actualizar gasto existente
        const updatedExpense = await updateExpense({
          ...currentExpense,
          category: formData.category,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          date: new Date(formData.date),
        })

        setExpenses(expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)))

        toast({
          title: "Gasto actualizado",
          description: "El gasto ha sido actualizado exitosamente",
        })
      } else {
        // Crear nuevo gasto
        const newExpense = await createExpense({
          userId: userData.id,
          category: formData.category,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          date: new Date(formData.date),
        })

        setExpenses([...expenses, newExpense])

        toast({
          title: "Gasto creado",
          description: "El gasto ha sido creado exitosamente",
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar gasto:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el gasto",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!currentExpense) return

    try {
      await deleteExpense(currentExpense.id)

      setExpenses(expenses.filter((e) => e.id !== currentExpense.id))

      toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado exitosamente",
      })

      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el gasto",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-800"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gastos</h2>
        <Button onClick={handleAddExpense}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Gastos</CardTitle>
          <CardDescription>Administre todos sus gastos desde este panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por descripción o categoría..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No se encontraron gastos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteExpense(expense)} className="text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar gasto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentExpense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
            <DialogDescription>
              {currentExpense
                ? "Actualice la información del gasto"
                : "Complete el formulario para agregar un nuevo gasto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoría
                </Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Monto
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

