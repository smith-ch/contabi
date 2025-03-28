"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getClientsByUserId, createInvoice, type Client, type InvoiceItem } from "@/lib/db"
import { formatCurrency, calculateITBIS, generateInvoiceNumber, getNextDueDate } from "@/lib/utils"
import { Trash, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewInvoicePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const [invoiceData, setInvoiceData] = useState({
    clientId: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: getNextDueDate(new Date()).toISOString().split("T")[0],
    items: [{ id: "1", description: "", quantity: 1, price: 0, taxable: true, amount: 0 }] as InvoiceItem[],
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
        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) return

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Cargar clientes
        const userClients = await getClientsByUserId(userData.id)
        setClients(userClients)

        // Generar número de factura
        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber: generateInvoiceNumber(),
        }))
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Filtrar items vacíos
      const validItems = invoiceData.items.filter(
        (item) => item.description.trim() !== "" && item.quantity > 0 && item.price > 0,
      )

      const invoiceToCreate = {
        userId: user.id,
        clientId: invoiceData.clientId,
        invoiceNumber: invoiceData.invoiceNumber,
        date: new Date(invoiceData.date),
        dueDate: new Date(invoiceData.dueDate),
        items: validItems,
        subtotal: invoiceData.subtotal,
        taxRate: invoiceData.taxRate,
        taxAmount: invoiceData.taxAmount,
        total: invoiceData.total,
        status: invoiceData.status,
        notes: invoiceData.notes,
        createdAt: new Date(),
      }

      await createInvoice(invoiceToCreate)

      toast({
        title: "Factura creada",
        description: "La factura ha sido creada exitosamente",
        variant: "success",
      })

      router.push("/dashboard/facturas")
    } catch (error) {
      console.error("Error al crear factura:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la factura",
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nueva Factura</h2>
        <p className="text-muted-foreground">Cree una nueva factura para un cliente</p>
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
                  onChange={handleInputChange}
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
                onClick={() => router.push("/dashboard/facturas")}
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
                  "Guardar Factura"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}

