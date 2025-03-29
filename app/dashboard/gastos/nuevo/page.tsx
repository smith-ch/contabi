"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/components/ui/use-toast"
import { createExpense } from "@/lib/db"
import { FileUpload } from "@/components/ui/file-upload"
import { STORAGE_BUCKETS } from "@/lib/storage"

const EXPENSE_CATEGORIES = [
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
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date(),
    receipt: "",
  })
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUserId(userData.id)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }))
    }
  }

  const handleFileUploaded = (path: string, url: string) => {
    setFormData((prev) => ({ ...prev, receipt: path }))
    setReceiptUrl(url)
  }

  const handleFileDeleted = () => {
    setFormData((prev) => ({ ...prev, receipt: "" }))
    setReceiptUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.description || !formData.amount) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "No se encontró información del usuario",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const amount = Number.parseFloat(formData.amount.replace(/,/g, ""))

      await createExpense({
        userId,
        category: formData.category,
        description: formData.description,
        amount,
        date: formData.date,
        receipt: formData.receipt || undefined,
      })

      toast({
        title: "Gasto registrado",
        description: "El gasto ha sido registrado exitosamente",
      })

      router.push("/dashboard/gastos")
    } catch (error) {
      console.error("Error al crear gasto:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el gasto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Nuevo Gasto</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Gasto</CardTitle>
          <CardDescription>Complete el formulario para registrar un nuevo gasto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={handleSelectChange} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto (RD$)</Label>
                <Input
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <DatePicker date={formData.date} setDate={handleDateChange} />
              </div>

              <div className="space-y-2">
                <Label>Recibo (opcional)</Label>
                {userId && (
                  <FileUpload
                    bucket={STORAGE_BUCKETS.RECEIPTS}
                    userId={userId}
                    onFileUploaded={handleFileUploaded}
                    onFileDeleted={handleFileDeleted}
                    allowedTypes={["image/jpeg", "image/png", "image/webp", "application/pdf"]}
                    maxSizeBytes={5 * 1024 * 1024} // 5MB
                    label="Subir recibo"
                    previewSize="small"
                  />
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descripción del gasto"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Gasto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

