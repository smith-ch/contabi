"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
// Asegurarnos de que estamos importando desde el archivo correcto
import { createExpense } from "@/lib/db"
import { ArrowLeft, Save } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { BUCKETS } from "@/lib/storage"

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

export default function NewExpensePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      router.push("/")
    }
    setLoading(false)
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleFileUploaded = (filePath: string) => {
    setReceiptPath(filePath)
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

    setSubmitting(true)

    try {
      // Create expense with receipt path if available
      await createExpense({
        userId: user.id,
        category: formData.category,
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        date: new Date(formData.date),
        receipt: receiptPath || undefined,
      })

      toast({
        title: "Gasto creado",
        description: "El gasto ha sido creado exitosamente",
      })

      router.push("/dashboard/gastos")
    } catch (error) {
      console.error("Error al crear gasto:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el gasto",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nuevo Gasto</h2>
          <p className="text-muted-foreground">Registre un nuevo gasto en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle>Información del Gasto</CardTitle>
            <CardDescription>Complete los detalles del gasto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:ring-primary/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange} required>
                  <SelectTrigger className="border-primary/20 focus:ring-primary/30">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[80px] border-primary/20 focus:ring-primary/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                className="border-primary/20 focus:ring-primary/30"
                required
              />
            </div>

            {/* File upload component for receipt */}
            {user && (
              <FileUpload
                bucket={BUCKETS.RECEIPTS}
                userId={user.id}
                onFileUploaded={handleFileUploaded}
                accept="image/*,.pdf"
                label="Comprobante (opcional)"
                buttonText="Subir comprobante"
                className="space-y-2"
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/gastos")}
              className="border-primary/20 hover:bg-primary/10"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 transition-colors">
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Gasto
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

