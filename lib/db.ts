import { supabaseClient, supabaseAdmin, type Tables } from "./supabase"

// Type definitions to match our existing application
export interface User {
  id: string
  name: string
  email: string
  password: string
  company: string
  rnc: string
  address?: string
  phone?: string
  createdAt: Date
}

export interface Client {
  id: string
  userId: string
  name: string
  rnc: string
  address: string
  email: string
  phone: string
  createdAt: Date
}

export interface Invoice {
  id: string
  userId: string
  clientId: string
  invoiceNumber: string
  date: Date
  dueDate: Date
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  notes: string
  createdAt: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  taxable: boolean
  amount: number
}

export interface Expense {
  id: string
  userId: string
  category: string
  description: string
  amount: number
  date: Date
  receipt?: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  relatedId?: string
  relatedType?: "invoice" | "expense" | "client" | "system"
  read: boolean
  createdAt: Date
}

// Helper functions to convert between our application types and Supabase types
function convertUserFromSupabase(user: Tables["users"]): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    company: user.company || "",
    rnc: user.rnc || "",
    address: user.address || undefined,
    phone: user.phone || undefined,
    createdAt: new Date(user.created_at),
  }
}

function convertUserToSupabase(user: Omit<User, "id" | "createdAt">): Omit<Tables["users"], "id" | "created_at"> {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    company: user.company || null,
    rnc: user.rnc || null,
    address: user.address || null,
    phone: user.phone || null,
  }
}

function convertClientFromSupabase(client: Tables["clients"]): Client {
  return {
    id: client.id,
    userId: client.user_id,
    name: client.name,
    rnc: client.rnc,
    address: client.address || "",
    email: client.email || "",
    phone: client.phone || "",
    createdAt: new Date(client.created_at),
  }
}

function convertClientToSupabase(
  client: Omit<Client, "id" | "createdAt">,
): Omit<Tables["clients"], "id" | "created_at"> {
  return {
    user_id: client.userId,
    name: client.name,
    rnc: client.rnc,
    address: client.address || null,
    email: client.email || null,
    phone: client.phone || null,
  }
}

function convertInvoiceFromSupabase(invoice: Tables["invoices"], items: Tables["invoice_items"][]): Invoice {
  return {
    id: invoice.id,
    userId: invoice.user_id,
    clientId: invoice.client_id,
    invoiceNumber: invoice.invoice_number,
    date: new Date(invoice.date),
    dueDate: new Date(invoice.due_date),
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      taxable: item.taxable,
      amount: item.amount,
    })),
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate,
    taxAmount: invoice.tax_amount,
    total: invoice.total,
    status: invoice.status,
    notes: invoice.notes || "",
    createdAt: new Date(invoice.created_at),
  }
}

function convertExpenseFromSupabase(expense: Tables["expenses"]): Expense {
  return {
    id: expense.id,
    userId: expense.user_id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    date: new Date(expense.date),
    receipt: expense.receipt || undefined,
    createdAt: new Date(expense.created_at),
  }
}

function convertExpenseToSupabase(
  expense: Omit<Expense, "id" | "createdAt">,
): Omit<Tables["expenses"], "id" | "created_at"> {
  return {
    user_id: expense.userId,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    date: expense.date.toISOString().split("T")[0],
    receipt: expense.receipt || null,
  }
}

function convertNotificationFromSupabase(notification: Tables["notifications"]): Notification {
  return {
    id: notification.id,
    userId: notification.user_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    relatedId: notification.related_id || undefined,
    relatedType: notification.related_type as "invoice" | "expense" | "client" | "system" | undefined,
    read: notification.read,
    createdAt: new Date(notification.created_at),
  }
}

function convertNotificationToSupabase(
  notification: Omit<Notification, "id" | "createdAt">,
): Omit<Tables["notifications"], "id" | "created_at"> {
  return {
    user_id: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    related_id: notification.relatedId || null,
    related_type: notification.relatedType || null,
    read: notification.read,
  }
}

// User functions
export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const { data, error } = await supabaseAdmin.from("users").insert(convertUserToSupabase(userData)).select().single()

  if (error) {
    console.error("Error creating user:", error)
    throw new Error(`Error creating user: ${error.message}`)
  }

  return convertUserFromSupabase(data)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseClient.from("users").select().eq("email", email).single()

  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116 means no rows returned
      return null
    }
    console.error("Error getting user by email:", error)
    throw new Error(`Error getting user by email: ${error.message}`)
  }

  return data ? convertUserFromSupabase(data) : null
}

export async function getUserByCredentials(email: string, password: string): Promise<User | null> {
  // In a production app, you would use Supabase Auth instead
  const { data, error } = await supabaseClient
    .from("users")
    .select()
    .eq("email", email)
    .eq("password", password)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116 means no rows returned
      return null
    }
    console.error("Error getting user by credentials:", error)
    throw new Error(`Error getting user by credentials: ${error.message}`)
  }

  return data ? convertUserFromSupabase(data) : null
}

export async function updateUser(user: User): Promise<User> {
  const { data, error } = await supabaseClient
    .from("users")
    .update({
      name: user.name,
      email: user.email,
      password: user.password,
      company: user.company || null,
      rnc: user.rnc || null,
      address: user.address || null,
      phone: user.phone || null,
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating user:", error)
    throw new Error(`Error updating user: ${error.message}`)
  }

  return convertUserFromSupabase(data)
}

// Client functions
export async function createClient(clientData: Omit<Client, "id" | "createdAt">): Promise<Client> {
  try {
    console.log("Intentando crear cliente con datos:", JSON.stringify(clientData, null, 2))

    // Verificar que los datos requeridos estén presentes
    if (!clientData.userId) {
      throw new Error("userId es requerido para crear un cliente")
    }

    if (!clientData.name) {
      throw new Error("name es requerido para crear un cliente")
    }

    if (!clientData.rnc) {
      throw new Error("rnc es requerido para crear un cliente")
    }

    const supabaseData = convertClientToSupabase(clientData)
    console.log("Datos convertidos para Supabase:", JSON.stringify(supabaseData, null, 2))

    const { data, error } = await supabaseClient.from("clients").insert(supabaseData).select().single()

    if (error) {
      console.error("Error detallado de Supabase al crear cliente:", error)
      throw new Error(`Error creating client: ${error.message || JSON.stringify(error)}`)
    }

    if (!data) {
      throw new Error("No se recibieron datos después de crear el cliente")
    }

    console.log("Cliente creado exitosamente:", data)

    // Create notification
    try {
      await createNotification({
        userId: clientData.userId,
        title: "Nuevo cliente",
        message: `Se ha creado el cliente ${clientData.name} exitosamente.`,
        type: "success",
        relatedId: data.id,
        relatedType: "client",
        read: false,
      })
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError)
      // No interrumpimos el flujo si falla la notificación
    }

    return convertClientFromSupabase(data)
  } catch (err) {
    console.error("Error completo al crear cliente:", err)
    throw err instanceof Error ? err : new Error(`Error creating client: ${JSON.stringify(err)}`)
  }
}

export async function getClientsByUserId(userId: string): Promise<Client[]> {
  const { data, error } = await supabaseClient.from("clients").select().eq("user_id", userId)

  if (error) {
    console.error("Error getting clients by user ID:", error)
    throw new Error(`Error getting clients by user ID: ${error.message}`)
  }

  return data.map(convertClientFromSupabase)
}

export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabaseClient.from("clients").select().eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116 means no rows returned
      return null
    }
    console.error("Error getting client by ID:", error)
    throw new Error(`Error getting client by ID: ${error.message}`)
  }

  return data ? convertClientFromSupabase(data) : null
}

export async function updateClient(client: Client): Promise<Client> {
  const { data, error } = await supabaseClient
    .from("clients")
    .update({
      name: client.name,
      rnc: client.rnc,
      address: client.address || null,
      email: client.email || null,
      phone: client.phone || null,
    })
    .eq("id", client.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating client:", error)
    throw new Error(`Error updating client: ${error.message}`)
  }

  // Create notification
  await createNotification({
    userId: client.userId,
    title: "Cliente actualizado",
    message: `Se ha actualizado la información del cliente ${client.name}.`,
    type: "info",
    relatedId: client.id,
    relatedType: "client",
    read: false,
  })

  return convertClientFromSupabase(data)
}

export async function deleteClient(id: string): Promise<void> {
  // First get the client to create the notification
  const client = await getClientById(id)
  if (!client) {
    throw new Error("Client not found")
  }

  const { error } = await supabaseClient.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Error deleting client:", error)
    throw new Error(`Error deleting client: ${error.message}`)
  }

  // Create notification
  await createNotification({
    userId: client.userId,
    title: "Cliente eliminado",
    message: `Se ha eliminado el cliente ${client.name}.`,
    type: "warning",
    relatedType: "client",
    read: false,
  })
}

// Invoice functions
export async function createInvoice(invoiceData: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> {
  try {
    console.log("Creando factura con datos:", JSON.stringify(invoiceData, null, 2))

    // Verificar que los datos requeridos estén presentes
    if (!invoiceData.userId) {
      throw new Error("userId es requerido para crear una factura")
    }

    if (!invoiceData.clientId) {
      throw new Error("clientId es requerido para crear una factura")
    }

    // Insertar la factura
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert({
        user_id: invoiceData.userId,
        client_id: invoiceData.clientId,
        invoice_number: invoiceData.invoiceNumber,
        date: invoiceData.date.toISOString().split("T")[0],
        due_date: invoiceData.dueDate.toISOString().split("T")[0],
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount,
        total: invoiceData.total,
        status: invoiceData.status,
        notes: invoiceData.notes || null,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error("Error detallado al crear factura:", invoiceError)
      throw new Error(`Error al crear factura: ${invoiceError.message || JSON.stringify(invoiceError)}`)
    }

    if (!invoice) {
      throw new Error("No se recibieron datos después de crear la factura")
    }

    console.log("Factura creada exitosamente:", invoice)

    // Insertar items de la factura
    const invoiceItems = invoiceData.items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      taxable: item.taxable,
      amount: item.amount,
    }))

    const { data: items, error: itemsError } = await supabaseClient.from("invoice_items").insert(invoiceItems).select()

    if (itemsError) {
      console.error("Error detallado al crear items de factura:", itemsError)
      // Intentar eliminar la factura si falla la creación de items
      await supabaseClient.from("invoices").delete().eq("id", invoice.id)
      throw new Error(`Error al crear items de factura: ${itemsError.message || JSON.stringify(itemsError)}`)
    }

    // Intentar crear notificación, pero no fallar si hay error
    try {
      await createNotification({
        userId: invoiceData.userId,
        title: "Nueva factura",
        message: `Se ha creado la factura #${invoiceData.invoiceNumber} por ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(invoiceData.total)}.`,
        type: "success",
        relatedId: invoice.id,
        relatedType: "invoice",
        read: false,
      }).catch((err) => console.warn("Error al crear notificación para factura:", err))
    } catch (notifError) {
      console.warn("Error al crear notificación para factura:", notifError)
      // No interrumpir el flujo si falla la notificación
    }

    return convertInvoiceFromSupabase(invoice, items || [])
  } catch (err) {
    console.error("Error completo al crear factura:", err)
    throw err instanceof Error ? err : new Error(`Error al crear factura: ${JSON.stringify(err)}`)
  }
}

export async function getInvoicesByUserId(userId: string): Promise<Invoice[]> {
  const { data: invoices, error: invoicesError } = await supabaseClient.from("invoices").select().eq("user_id", userId)

  if (invoicesError) {
    console.error("Error getting invoices by user ID:", invoicesError)
    throw new Error(`Error getting invoices by user ID: ${invoicesError.message}`)
  }

  // Get all invoice items for these invoices
  const invoiceIds = invoices.map((invoice) => invoice.id)

  if (invoiceIds.length === 0) {
    return []
  }

  const { data: items, error: itemsError } = await supabaseClient
    .from("invoice_items")
    .select()
    .in("invoice_id", invoiceIds)

  if (itemsError) {
    console.error("Error getting invoice items:", itemsError)
    throw new Error(`Error getting invoice items: ${itemsError.message}`)
  }

  // Group items by invoice_id
  const itemsByInvoiceId = items.reduce(
    (acc, item) => {
      if (!acc[item.invoice_id]) {
        acc[item.invoice_id] = []
      }
      acc[item.invoice_id].push(item)
      return acc
    },
    {} as Record<string, Tables["invoice_items"][]>,
  )

  // Convert invoices with their items
  return invoices.map((invoice) => convertInvoiceFromSupabase(invoice, itemsByInvoiceId[invoice.id] || []))
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!id) {
    console.error("Error: Invoice ID not provided")
    return null
  }

  const { data: invoice, error: invoiceError } = await supabaseClient.from("invoices").select().eq("id", id).single()

  if (invoiceError) {
    if (invoiceError.code === "PGRST116") {
      // PGRST116 means no rows returned
      return null
    }
    console.error("Error getting invoice by ID:", invoiceError)
    throw new Error(`Error getting invoice by ID: ${invoiceError.message}`)
  }

  const { data: items, error: itemsError } = await supabaseClient.from("invoice_items").select().eq("invoice_id", id)

  if (itemsError) {
    console.error("Error getting invoice items:", itemsError)
    throw new Error(`Error getting invoice items: ${itemsError.message}`)
  }

  return convertInvoiceFromSupabase(invoice, items)
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  // First get the original invoice to compare changes
  const originalInvoice = await getInvoiceById(invoice.id)

  // Update invoice
  const { data: updatedInvoice, error: invoiceError } = await supabaseClient
    .from("invoices")
    .update({
      client_id: invoice.clientId,
      date: invoice.date.toISOString().split("T")[0],
      due_date: invoice.dueDate.toISOString().split("T")[0],
      subtotal: invoice.subtotal,
      tax_rate: invoice.taxRate,
      tax_amount: invoice.taxAmount,
      total: invoice.total,
      status: invoice.status,
      notes: invoice.notes || null,
    })
    .eq("id", invoice.id)
    .select()
    .single()

  if (invoiceError) {
    console.error("Error updating invoice:", invoiceError)
    throw new Error(`Error updating invoice: ${invoiceError.message}`)
  }

  // Delete existing items and insert new ones
  const { error: deleteError } = await supabaseClient.from("invoice_items").delete().eq("invoice_id", invoice.id)

  if (deleteError) {
    console.error("Error deleting invoice items:", deleteError)
    throw new Error(`Error deleting invoice items: ${deleteError.message}`)
  }

  const invoiceItems = invoice.items.map((item) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    taxable: item.taxable,
    amount: item.amount,
  }))

  const { data: items, error: itemsError } = await supabaseClient.from("invoice_items").insert(invoiceItems).select()

  if (itemsError) {
    console.error("Error creating invoice items:", itemsError)
    throw new Error(`Error creating invoice items: ${itemsError.message}`)
  }

  // Create notification if status changed
  if (originalInvoice && originalInvoice.status !== invoice.status) {
    let message = ""
    let type: "info" | "warning" | "success" | "error" = "info"

    switch (invoice.status) {
      case "paid":
        message = `La factura #${invoice.invoiceNumber} ha sido marcada como pagada.`
        type = "success"
        break
      case "overdue":
        message = `La factura #${invoice.invoiceNumber} ha vencido.`
        type = "warning"
        break
      case "cancelled":
        message = `La factura #${invoice.invoiceNumber} ha sido cancelada.`
        type = "warning"
        break
      default:
        message = `El estado de la factura #${invoice.invoiceNumber} ha cambiado a ${invoice.status}.`
    }

    await createNotification({
      userId: invoice.userId,
      title: "Estado de factura actualizado",
      message,
      type,
      relatedId: invoice.id,
      relatedType: "invoice",
      read: false,
    })
  }

  return convertInvoiceFromSupabase(updatedInvoice, items)
}

export async function deleteInvoice(id: string): Promise<void> {
  // First get the invoice to create the notification
  const invoice = await getInvoiceById(id)
  if (!invoice) {
    throw new Error("Invoice not found")
  }

  // Delete invoice (cascade will delete items)
  const { error } = await supabaseClient.from("invoices").delete().eq("id", id)

  if (error) {
    console.error("Error deleting invoice:", error)
    throw new Error(`Error deleting invoice: ${error.message}`)
  }

  // Create notification
  await createNotification({
    userId: invoice.userId,
    title: "Factura eliminada",
    message: `Se ha eliminado la factura #${invoice.invoiceNumber}.`,
    type: "warning",
    relatedType: "invoice",
    read: false,
  })
}

// Expense functions
export async function createExpense(expenseData: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
  try {
    console.log("Creando gasto con datos:", JSON.stringify(expenseData, null, 2))

    // Verificar que los datos requeridos estén presentes
    if (!expenseData.userId) {
      throw new Error("userId es requerido para crear un gasto")
    }

    const supabaseData = convertExpenseToSupabase(expenseData)
    console.log("Datos convertidos para Supabase:", JSON.stringify(supabaseData, null, 2))

    const { data, error } = await supabaseClient.from("expenses").insert(supabaseData).select().single()

    if (error) {
      console.error("Error detallado al crear gasto:", error)
      throw new Error(`Error al crear gasto: ${error.message || JSON.stringify(error)}`)
    }

    if (!data) {
      throw new Error("No se recibieron datos después de crear el gasto")
    }

    console.log("Gasto creado exitosamente:", data)

    // Intentar crear notificación, pero no fallar si hay error
    try {
      await createNotification({
        userId: expenseData.userId,
        title: "Nuevo gasto",
        message: `Se ha registrado un gasto de ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(expenseData.amount)} en la categoría ${expenseData.category}.`,
        type: "info",
        relatedId: data.id,
        relatedType: "expense",
        read: false,
      }).catch((err) => console.warn("Error al crear notificación para gasto:", err))
    } catch (notifError) {
      console.warn("Error al crear notificación para gasto:", notifError)
      // No interrumpir el flujo si falla la notificación
    }

    return convertExpenseFromSupabase(data)
  } catch (err) {
    console.error("Error completo al crear gasto:", err)
    throw err instanceof Error ? err : new Error(`Error al crear gasto: ${JSON.stringify(err)}`)
  }
}

export async function getExpensesByUserId(userId: string): Promise<Expense[]> {
  const { data, error } = await supabaseClient.from("expenses").select().eq("user_id", userId)

  if (error) {
    console.error("Error getting expenses by user ID:", error)
    throw new Error(`Error getting expenses by user ID: ${error.message}`)
  }

  return data.map(convertExpenseFromSupabase)
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabaseClient.from("expenses").select().eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116 means no rows returned
      return null
    }
    console.error("Error getting expense by ID:", error)
    throw new Error(`Error getting expense by ID: ${error.message}`)
  }

  return data ? convertExpenseFromSupabase(data) : null
}

export async function updateExpense(expense: Expense): Promise<Expense> {
  const { data, error } = await supabaseClient
    .from("expenses")
    .update(convertExpenseToSupabase(expense))
    .eq("id", expense.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating expense:", error)
    throw new Error(`Error updating expense: ${error.message}`)
  }

  // Create notification
  await createNotification({
    userId: expense.userId,
    title: "Gasto actualizado",
    message: `Se ha actualizado el gasto de ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(expense.amount)} en la categoría ${expense.category}.`,
    type: "info",
    relatedId: expense.id,
    relatedType: "expense",
    read: false,
  })

  return convertExpenseFromSupabase(data)
}

export async function deleteExpense(id: string): Promise<void> {
  // First get the expense to create the notification
  const expense = await getExpenseById(id)
  if (!expense) {
    throw new Error("Expense not found")
  }

  const { error } = await supabaseClient.from("expenses").delete().eq("id", id)

  if (error) {
    console.error("Error deleting expense:", error)
    throw new Error(`Error deleting expense: ${error.message}`)
  }

  // Create notification
  await createNotification({
    userId: expense.userId,
    title: "Gasto eliminado",
    message: `Se ha eliminado un gasto de ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(expense.amount)} en la categoría ${expense.category}.`,
    type: "warning",
    relatedType: "expense",
    read: false,
  })
}

// Notification functions
export async function createNotification(
  notificationData: Omit<Notification, "id" | "createdAt">,
): Promise<Notification> {
  try {
    console.log("Creando notificación con datos:", JSON.stringify(notificationData, null, 2))

    // Verificar que los datos requeridos estén presentes
    if (!notificationData.userId) {
      throw new Error("userId es requerido para crear una notificación")
    }

    const supabaseData = convertNotificationToSupabase(notificationData)
    console.log("Datos convertidos para Supabase:", JSON.stringify(supabaseData, null, 2))

    const { data, error } = await supabaseClient.from("notifications").insert(supabaseData).select().single()

    if (error) {
      console.error("Error detallado al crear notificación:", error)
      throw new Error(`Error al crear notificación: ${error.message || JSON.stringify(error)}`)
    }

    if (!data) {
      throw new Error("No se recibieron datos después de crear la notificación")
    }

    console.log("Notificación creada exitosamente:", data)
    return convertNotificationFromSupabase(data)
  } catch (err) {
    console.error("Error completo al crear notificación:", err)
    // No lanzar el error para evitar interrumpir el flujo principal
    // Simplemente devolver una notificación vacía
    return {
      id: "error",
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      relatedId: notificationData.relatedId,
      relatedType: notificationData.relatedType,
      read: notificationData.read,
      createdAt: new Date(),
    }
  }
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
  const { data, error } = await supabaseClient
    .from("notifications")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting notifications by user ID:", error)
    throw new Error(`Error getting notifications by user ID: ${error.message}`)
  }

  return data.map(convertNotificationFromSupabase)
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const { count, error } = await supabaseClient
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) {
    console.error("Error getting unread notifications count:", error)
    throw new Error(`Error getting unread notifications count: ${error.message}`)
  }

  return count || 0
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabaseClient.from("notifications").update({ read: true }).eq("id", id)

  if (error) {
    console.error("Error marking notification as read:", error)
    throw new Error(`Error marking notification as read: ${error.message}`)
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabaseClient
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    throw new Error(`Error marking all notifications as read: ${error.message}`)
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabaseClient.from("notifications").delete().eq("id", id)

  if (error) {
    console.error("Error deleting notification:", error)
    throw new Error(`Error deleting notification: ${error.message}`)
  }
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabaseClient.from("notifications").delete().eq("user_id", userId)

  if (error) {
    console.error("Error deleting all notifications:", error)
    throw new Error(`Error deleting all notifications: ${error.message}`)
  }
}

// Report functions
export async function getInvoicesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Invoice[]> {
  const { data: invoices, error: invoicesError } = await supabaseClient
    .from("invoices")
    .select()
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])

  if (invoicesError) {
    console.error("Error getting invoices by date range:", invoicesError)
    throw new Error(`Error getting invoices by date range: ${invoicesError.message}`)
  }

  if (invoices.length === 0) {
    return []
  }

  // Get all invoice items for these invoices
  const invoiceIds = invoices.map((invoice) => invoice.id)
  const { data: items, error: itemsError } = await supabaseClient
    .from("invoice_items")
    .select()
    .in("invoice_id", invoiceIds)

  if (itemsError) {
    console.error("Error getting invoice items:", itemsError)
    throw new Error(`Error getting invoice items: ${itemsError.message}`)
  }

  // Group items by invoice_id
  const itemsByInvoiceId = items.reduce(
    (acc, item) => {
      if (!acc[item.invoice_id]) {
        acc[item.invoice_id] = []
      }
      acc[item.invoice_id].push(item)
      return acc
    },
    {} as Record<string, Tables["invoice_items"][]>,
  )

  // Convert invoices with their items
  return invoices.map((invoice) => convertInvoiceFromSupabase(invoice, itemsByInvoiceId[invoice.id] || []))
}

export async function getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
  const { data, error } = await supabaseClient
    .from("expenses")
    .select()
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])

  if (error) {
    console.error("Error getting expenses by date range:", error)
    throw new Error(`Error getting expenses by date range: ${error.message}`)
  }

  return data.map(convertExpenseFromSupabase)
}

// Function to check for overdue invoices
export async function checkOverdueInvoices(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0]

    // Find pending invoices that are overdue
    const { data: overdueInvoices, error } = await supabaseClient
      .from("invoices")
      .select()
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("due_date", today)

    if (error) {
      console.error("Error checking overdue invoices:", error)
      return
    }

    // Update each overdue invoice
    for (const invoice of overdueInvoices) {
      // Only update if not already marked as overdue
      if (invoice.status !== "overdue") {
        const { error: updateError } = await supabaseClient
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", invoice.id)

        if (updateError) {
          console.error(`Error updating invoice ${invoice.id} to overdue:`, updateError)
          continue
        }

        // Create notification
        await createNotification({
          userId,
          title: "Factura vencida",
          message: `La factura #${invoice.invoice_number} ha vencido.`,
          type: "warning",
          relatedId: invoice.id,
          relatedType: "invoice",
          read: false,
        })
      }
    }
  } catch (error) {
    console.error("Error in checkOverdueInvoices:", error)
  }
}

// Agregar una función para verificar la conexión con Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.from("users").select("count").limit(1)

    if (error) {
      console.error("Error al verificar la conexión con Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error inesperado al verificar la conexión:", error)
    return false
  }
}
