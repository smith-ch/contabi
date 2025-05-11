"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Save } from "lucide-react"
import { saveInvoice, type InvoiceFormData, type InvoiceItem } from "../actions"
import { format } from "date-fns"

type Client = {
  id: string
  name: string
  rnc: string
}

type InvoiceFormProps = {
  initialData?: InvoiceFormData
  clients: Client[]
  userId: string
}

export function InvoiceForm({ initialData, clients, userId }: InvoiceFormProps) {
  const router = useRouter()
  const isEditing = !!initialData?.id

  const [formData, setFormData] = useState<InvoiceFormData>({
    id: initialData?.id || undefined,
    invoice_number: initialData?.invoice_number || "",
    client_id: initialData?.client_id || "",
    issue_date: initialData?.issue_date || format(new Date(), "yyyy-MM-dd"),
    due_date: initialData?.due_date || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    items: initialData?.items || [{ description: "", quantity: 1, price: 0, amount: 0, taxable: true }],
    subtotal: initialData?.subtotal || 0,
    tax_rate: initialData?.tax_rate || 18,
    tax_amount: initialData?.tax_amount || 0,
    total: initialData?.total || 0,
    status: initialData?.status || "pendiente",
    notes: initialData?.notes || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular totales cuando cambian los items o la tasa de impuestos
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0)
    const taxableAmount = formData.items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = (taxableAmount * formData.tax_rate) / 100
    const total = subtotal + taxAmount

    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total,
    }))
  }, [formData.items, formData.tax_rate])

  // Manejar cambios en los campos del formulario
  const handleChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Manejar cambios en los items
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalcular el monto si cambia la cantidad o el precio
    if (field === "quantity" || field === "price") {
      const quantity = field === "quantity" ? value : updatedItems[index].quantity
      const price = field === "price" ? value : updatedItems[index].price
      updatedItems[index].amount = quantity * price
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  // Agregar un nuevo item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0, amount: 0, taxable: true }],
    }))
  }

  // Eliminar un item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, items: updatedItems }))
    }
  }

  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await saveInvoice(formData, userId)

      if (result.success) {
        router.push("/dashboard/facturas")
      } else {
        setError(result.error || "Ocurrió un error al guardar la factura")
      }
    } catch (err) {
      setError("Ocurrió un error al guardar la factura")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Factura" : "Nueva Factura"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número de Factura</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select value={formData.client_id} onValueChange={(value) => handleChange("client_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.rnc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">Fecha de Emisión</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange("issue_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="parcialmente pagada">Parcialmente Pagada</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tasa de Impuesto (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={formData.tax_rate}
                onChange={(e) => handleChange("tax_rate", Number.parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Artículos</h3>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number.parseFloat(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Precio"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", Number.parseFloat(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.amount.toFixed(2)}</span>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`taxable-${index}`}
                          checked={item.taxable}
                          onChange={(e) => handleItemChange(index, "taxable", e.target.checked)}
                          className="mr-1"
                        />
                        <label htmlFor={`taxable-${index}`} className="text-xs">
                          ITBIS
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2">
                <Plus className="h-4 w-4 mr-2" /> Agregar Artículo
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-end space-y-2">
              <div className="w-1/3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RD$ {formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ITBIS ({formData.tax_rate}%):</span>
                  <span>RD$ {formData.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>RD$ {formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/facturas")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              "Guardando..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Factura
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
