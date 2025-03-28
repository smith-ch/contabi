"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  getInvoiceById,
  getClientsByUserId,
  updateInvoice,
  type Client,
  type InvoiceItem,
  type Invoice,
} from "@/lib/db"
import { formatCurrency, calculateITBIS } from "@/lib/utils"
import { Trash, Plus, AlertCircle, ArrowLeft, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAlert } from "@/components/ui/alert-provider"

export default function EditInvoicePage() {
  // Usar useParams en lugar de React.use
  const params = useParams()
  const id = params?.id as string

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { addAlert } = useAlert()

  const [invoiceData, setInvoiceData] = useState({
    clientId: "",
    invoiceNumber: "",
    date: "",
    dueDate: "",
    items: [] as InvoiceItem[],
    subtotal: 0,
    taxRate: 0.18, // ITBIS estándar en República Dominicana (18%)
    taxAmount: 0,
    total: 0,
    status: "pending",
    notes: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) {
          router.push("/dashboard/facturas")
          return
        }

        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) {
          router.push("/")
          return
        }

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Cargar factura
        const invoice = await getInvoiceById(id)
        if (!invoice) {
          toast({
            title: "Error",
            description: "Factura no encontrada",
            variant: "destructive",
          })
          router.push("/dashboard/facturas")
          return
        }

        // Verificar que la factura pertenezca al usuario
        if (invoice.userId !== userData.id) {
          toast({
            title: "Error",
            description: "No tiene permiso para editar esta factura",
            variant: "destructive",
          })
          router.push("/dashboard/facturas")
          return
        }

        setOriginalInvoice(invoice)

        // Cargar clientes
        const userClients = await getClientsByUserId(userData.id)
        setClients(userClients)

        // Inicializar formulario con datos de la factura
        setInvoiceData({
          clientId: invoice.clientId,
          invoiceNumber: invoice.invoiceNumber,
          date: new Date(invoice.date).toISOString().split("T")[0],
          dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
          items: invoice.items,
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          total: invoice.total,
          status: invoice.status,
          notes: invoice.notes,
        })
      } catch (error) {
        console.error("Error al cargar datos:", error)
        addAlert({
          type: "error",
          title: "Error",
          message: "Ocurrió un error al cargar la factura",
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, router, toast, addAlert])

  useEffect(() => {
    // Calcular totales cuando cambian los items
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0)
    const taxableAmount = invoiceData.items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = calculateITBIS(taxableAmount, invoiceData.taxRate)
    const total = subtotal + taxAmount

    setInvoiceData((prev) => ({
      ...prev,
      subtotal,
      taxAmount,
      total,
    }))
  }, [invoiceData.items, invoiceData.taxRate])

  const handleClientChange = (value: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      clientId: value,
    }))
  }

  const handleStatusChange = (value: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      status: value as "pending" | "paid" | "overdue" | "cancelled",
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInvoiceData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }

    // Recalcular el monto del item
    if (field === "quantity" || field === "price") {
      const quantity = field === "quantity" ? Number(value) || 0 : updatedItems[index].quantity
      const price = field === "price" ? Number(value) || 0 : updatedItems[index].price
      updatedItems[index].amount = quantity * price
    }

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }))
  }

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          description: "",
          quantity: 1,
          price: 0,
          taxable: true,
          amount: 0,
        },
      ],
    }))
  }

  const removeItem = (index: number) => {
    if (invoiceData.items.length === 1) {
      return // Mantener al menos un item
    }

    const updatedItems = invoiceData.items.filter((_, i) => i !== index)

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }))
  }

  const validateForm = () => {
    if (!invoiceData.clientId) {
      setError("Debe seleccionar un cliente")
      return false
    }

    // Verificar que al menos un ítem tenga descripción y valores válidos
    const validItems = invoiceData.items.filter(
      (item) => item.description.trim() !== "" && item.quantity > 0 && item.price > 0,
    )

    if (validItems.length === 0) {
      setError("Debe agregar al menos un ítem válido con descripción, cantidad y precio")
      return false
    }

    setError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !originalInvoice) {
      return
    }

    setSubmitting(true)

    try {
      // Filtrar items vacíos
      const validItems = invoiceData.items.filter(
        (item) => item.description.trim() !== "" && item.quantity > 0 && item.price > 0,
      )

      const invoiceToUpdate = {
        ...originalInvoice,
        clientId: invoiceData.clientId,
        date: new Date(invoiceData.date),
        dueDate: new Date(invoiceData.dueDate),
        items: validItems,
        subtotal: invoiceData.subtotal,
        taxRate: invoiceData.taxRate,
        taxAmount: invoiceData.taxAmount,
        total: invoiceData.total,
        status: invoiceData.status,
        notes: invoiceData.notes,
      }

      await updateInvoice(invoiceToUpdate)

      addAlert({
        type: "success",
        title: "Factura actualizada",
        message: "La factura ha sido actualizada exitosamente",
        duration: 3000,
      })

      router.push(`/dashboard/facturas/${id}`)
    } catch (error) {
      console.error("Error al actualizar factura:", error)
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al actualizar la factura",
        duration: 5000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-primary animate-pulse">Cargando factura...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Factura #{invoiceData.invoiceNumber}</h2>
          <p className="text-muted-foreground">Modifique los detalles de la factura</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-shake">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Información General</CardTitle>
              <CardDescription>Información básica de la factura</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 p-6">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente</Label>
                <Select value={invoiceData.clientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="border-primary/20 focus:ring-primary/30">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Número de Factura</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  readOnly
                  className="border-primary/20 focus:ring-primary/30 bg-primary/5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha de Emisión</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={invoiceData.date}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={invoiceData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="border-primary/20 focus:ring-primary/30">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Detalle de Factura</CardTitle>
              <CardDescription>Agregue los productos o servicios a facturar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-md border border-primary/20 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-primary/5">
                      <th className="p-2 text-left font-medium">Descripción</th>
                      <th className="p-2 text-center font-medium">Cantidad</th>
                      <th className="p-2 text-center font-medium">Precio</th>
                      <th className="p-2 text-center font-medium">ITBIS</th>
                      <th className="p-2 text-right font-medium">Importe</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={item.id} className="border-b hover:bg-primary/5 transition-colors">
                        <td className="p-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            placeholder="Descripción del producto o servicio"
                            className="border-primary/20 focus:ring-primary/30"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                            className="text-center border-primary/20 focus:ring-primary/30"
                          />
                        </td>
                        <td className="p-2 w-32">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                            className="text-center border-primary/20 focus:ring-primary/30"
                          />
                        </td>
                        <td className="p-2 w-20 text-center">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => handleItemChange(index, "taxable", e.target.checked)}
                            className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/30"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary-foreground transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ítem
              </Button>

              <div className="mt-4 space-y-2 text-right">
                <div className="flex justify-end">
                  <span className="w-32 text-muted-foreground">Subtotal:</span>
                  <span className="w-32 font-medium">{formatCurrency(invoiceData.subtotal)}</span>
                </div>
                <div className="flex justify-end">
                  <span className="w-32 text-muted-foreground">ITBIS (18%):</span>
                  <span className="w-32 font-medium">{formatCurrency(invoiceData.taxAmount)}</span>
                </div>
                <div className="flex justify-end">
                  <span className="w-32 text-muted-foreground">Total:</span>
                  <span className="w-32 text-xl font-bold text-primary">{formatCurrency(invoiceData.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Notas</CardTitle>
              <CardDescription>Información adicional para la factura</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                name="notes"
                value={invoiceData.notes}
                onChange={handleInputChange}
                placeholder="Condiciones de pago, información adicional, etc."
                className="min-h-[100px] border-primary/20 focus:ring-primary/30"
              />
            </CardContent>
            <CardFooter className="flex justify-between p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/facturas/${id}`)}
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
                    Guardar Cambios
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}

