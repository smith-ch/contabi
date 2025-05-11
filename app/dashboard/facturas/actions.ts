"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

// Tipos para los datos de la factura
export type InvoiceItem = {
  id?: string
  description: string
  quantity: number
  price: number
  amount: number
  taxable: boolean
}

export type InvoiceFormData = {
  id?: string
  invoice_number: string
  client_id: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: "pendiente" | "parcialmente pagada" | "pagada" | "vencida" | "cancelada"
  notes?: string
}

// Obtener todas las facturas
export async function getInvoices(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      clients (
        id,
        name,
        rnc
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al obtener facturas:", error)
    throw new Error("No se pudieron cargar las facturas")
  }

  return data
}

// Obtener una factura por ID
export async function getInvoiceById(id: string, userId: string) {
  const supabase = createServerSupabaseClient()

  // Obtener la factura
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(`
      *,
      clients (
        id,
        name,
        rnc,
        address,
        phone,
        email
      )
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (invoiceError) {
    console.error("Error al obtener factura:", invoiceError)
    throw new Error("No se pudo cargar la factura")
  }

  // Obtener los items de la factura
  const { data: items, error: itemsError } = await supabase.from("invoice_items").select("*").eq("invoice_id", id)

  if (itemsError) {
    console.error("Error al obtener items de factura:", itemsError)
    throw new Error("No se pudieron cargar los items de la factura")
  }

  return { ...invoice, items }
}

// Crear o actualizar una factura
export async function saveInvoice(data: InvoiceFormData, userId: string) {
  const supabase = createServerSupabaseClient()
  const isNew = !data.id
  const invoiceId = data.id || uuidv4()

  // Preparar datos de la factura
  const invoiceData = {
    id: invoiceId,
    invoice_number: data.invoice_number,
    client_id: data.client_id,
    issue_date: data.issue_date,
    due_date: data.due_date,
    subtotal: data.subtotal,
    tax_rate: data.tax_rate,
    tax_amount: data.tax_amount,
    total: data.total,
    status: data.status,
    notes: data.notes || null,
    user_id: userId,
  }

  // Iniciar una transacción
  try {
    // Insertar o actualizar la factura
    if (isNew) {
      const { error: invoiceError } = await supabase.from("invoices").insert(invoiceData)

      if (invoiceError) throw invoiceError
    } else {
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", invoiceId)
        .eq("user_id", userId)

      if (invoiceError) throw invoiceError

      // Eliminar items existentes para reemplazarlos
      const { error: deleteError } = await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId)

      if (deleteError) throw deleteError
    }

    // Insertar los nuevos items
    const invoiceItems = data.items.map((item) => ({
      id: item.id || uuidv4(),
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      amount: item.amount,
      taxable: item.taxable,
    }))

    const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

    if (itemsError) throw itemsError

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/dashboard/facturas")

    return { success: true, id: invoiceId }
  } catch (error) {
    console.error("Error al guardar factura:", error)
    return { success: false, error: "No se pudo guardar la factura" }
  }
}

// Eliminar una factura
export async function deleteInvoice(id: string, userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Eliminar primero los items de la factura
    const { error: itemsError } = await supabase.from("invoice_items").delete().eq("invoice_id", id)

    if (itemsError) throw itemsError

    // Luego eliminar la factura
    const { error: invoiceError } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", userId)

    if (invoiceError) throw invoiceError

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/dashboard/facturas")

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar factura:", error)
    return { success: false, error: "No se pudo eliminar la factura" }
  }
}

// Obtener todos los clientes
export async function getClients(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("clients").select("*").eq("user_id", userId).order("name")

  if (error) {
    console.error("Error al obtener clientes:", error)
    throw new Error("No se pudieron cargar los clientes")
  }

  return data
}
