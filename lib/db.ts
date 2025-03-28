import { v4 as uuidv4 } from "uuid"

// Definición de tipos
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

// Configuración de la base de datos
const DB_NAME = "contabilidadRD"
const DB_VERSION = 2

// Función para inicializar la base de datos
export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      reject("Error al abrir la base de datos")
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion

      // Crear almacén de usuarios si no existe
      if (!db.objectStoreNames.contains("users")) {
        const usersStore = db.createObjectStore("users", { keyPath: "id" })
        usersStore.createIndex("email", "email", { unique: true })
      }

      // Crear almacén de clientes si no existe
      if (!db.objectStoreNames.contains("clients")) {
        const clientsStore = db.createObjectStore("clients", { keyPath: "id" })
        clientsStore.createIndex("userId", "userId", { unique: false })
        clientsStore.createIndex("rnc", "rnc", { unique: false })
      }

      // Crear almacén de facturas si no existe
      if (!db.objectStoreNames.contains("invoices")) {
        const invoicesStore = db.createObjectStore("invoices", { keyPath: "id" })
        invoicesStore.createIndex("userId", "userId", { unique: false })
        invoicesStore.createIndex("clientId", "clientId", { unique: false })
        invoicesStore.createIndex("invoiceNumber", "invoiceNumber", { unique: false })
        invoicesStore.createIndex("date", "date", { unique: false })
      }

      // Crear almacén de gastos si no existe
      if (!db.objectStoreNames.contains("expenses")) {
        const expensesStore = db.createObjectStore("expenses", { keyPath: "id" })
        expensesStore.createIndex("userId", "userId", { unique: false })
        expensesStore.createIndex("date", "date", { unique: false })
        expensesStore.createIndex("category", "category", { unique: false })
      }

      // Crear almacén de notificaciones si no existe o si estamos actualizando desde una versión anterior
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("notifications")) {
          const notificationsStore = db.createObjectStore("notifications", { keyPath: "id" })
          notificationsStore.createIndex("userId", "userId", { unique: false })
          notificationsStore.createIndex("read", "read", { unique: false })
          notificationsStore.createIndex("createdAt", "createdAt", { unique: false })
        }
      }
    }
  })
}

// Funciones para usuarios
export const createUser = async (userData: Omit<User, "id">): Promise<User> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["users"], "readwrite")
    const store = transaction.objectStore("users")

    const user: User = {
      id: uuidv4(),
      ...userData,
    }

    const request = store.add(user)

    request.onsuccess = () => {
      resolve(user)
    }

    request.onerror = () => {
      reject("Error al crear el usuario")
    }
  })
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const index = store.index("email")

    const request = index.get(email)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject("Error al buscar el usuario")
    }
  })
}

export const getUserByCredentials = async (email: string, password: string): Promise<User | null> => {
  const user = await getUserByEmail(email)

  if (user && user.password === password) {
    return user
  }

  return null
}

export const updateUser = async (user: User): Promise<User> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["users"], "readwrite")
    const store = transaction.objectStore("users")

    const request = store.put(user)

    request.onsuccess = () => {
      resolve(user)
    }

    request.onerror = () => {
      reject("Error al actualizar el usuario")
    }
  })
}

// Funciones para clientes
export const createClient = async (clientData: Omit<Client, "id">): Promise<Client> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["clients"], "readwrite")
    const store = transaction.objectStore("clients")

    const client: Client = {
      id: uuidv4(),
      ...clientData,
    }

    const request = store.add(client)

    request.onsuccess = () => {
      // Crear notificación
      createNotification({
        userId: clientData.userId,
        title: "Nuevo cliente",
        message: `Se ha creado el cliente ${client.name} exitosamente.`,
        type: "success",
        relatedId: client.id,
        relatedType: "client",
        read: false,
        createdAt: new Date(),
      }).catch(console.error)

      resolve(client)
    }

    request.onerror = () => {
      reject("Error al crear el cliente")
    }
  })
}

export const getClientsByUserId = async (userId: string): Promise<Client[]> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["clients"], "readonly")
    const store = transaction.objectStore("clients")
    const index = store.index("userId")

    const request = index.getAll(userId)

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject("Error al obtener los clientes")
    }
  })
}

export const getClientById = async (id: string): Promise<Client | null> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["clients"], "readonly")
    const store = transaction.objectStore("clients")

    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject("Error al obtener el cliente")
    }
  })
}

export const updateClient = async (client: Client): Promise<Client> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["clients"], "readwrite")
    const store = transaction.objectStore("clients")

    const request = store.put(client)

    request.onsuccess = () => {
      // Crear notificación
      createNotification({
        userId: client.userId,
        title: "Cliente actualizado",
        message: `Se ha actualizado la información del cliente ${client.name}.`,
        type: "info",
        relatedId: client.id,
        relatedType: "client",
        read: false,
        createdAt: new Date(),
      }).catch(console.error)

      resolve(client)
    }

    request.onerror = () => {
      reject("Error al actualizar el cliente")
    }
  })
}

export const deleteClient = async (id: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["clients"], "readwrite")
    const store = transaction.objectStore("clients")

    // Primero obtenemos el cliente para crear la notificación
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const client = getRequest.result
      if (!client) {
        reject("Cliente no encontrado")
        return
      }

      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => {
        // Crear notificación
        createNotification({
          userId: client.userId,
          title: "Cliente eliminado",
          message: `Se ha eliminado el cliente ${client.name}.`,
          type: "warning",
          relatedType: "client",
          read: false,
          createdAt: new Date(),
        }).catch(console.error)

        resolve()
      }

      deleteRequest.onerror = () => {
        reject("Error al eliminar el cliente")
      }
    }

    getRequest.onerror = () => {
      reject("Error al obtener el cliente para eliminar")
    }
  })
}

// Funciones para facturas
export const createInvoice = async (invoiceData: Omit<Invoice, "id">): Promise<Invoice> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["invoices"], "readwrite")
    const store = transaction.objectStore("invoices")

    const invoice: Invoice = {
      id: uuidv4(),
      ...invoiceData,
    }

    const request = store.add(invoice)

    request.onsuccess = () => {
      // Crear notificación
      createNotification({
        userId: invoice.userId,
        title: "Nueva factura",
        message: `Se ha creado la factura #${invoice.invoiceNumber} por ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(invoice.total)}.`,
        type: "success",
        relatedId: invoice.id,
        relatedType: "invoice",
        read: false,
        createdAt: new Date(),
      }).catch(console.error)

      resolve(invoice)
    }

    request.onerror = () => {
      reject("Error al crear la factura")
    }
  })
}

export const getInvoicesByUserId = async (userId: string): Promise<Invoice[]> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["invoices"], "readonly")
    const store = transaction.objectStore("invoices")
    const index = store.index("userId")

    const request = index.getAll(userId)

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject("Error al obtener las facturas")
    }
  })
}

// Modificar solo la función getInvoiceById para asegurarnos de que siempre tenga una clave válida
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  if (!id) {
    console.error("Error: ID de factura no proporcionado")
    return null
  }

  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["invoices"], "readonly")
    const store = transaction.objectStore("invoices")

    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = (event) => {
      console.error("Error al obtener la factura:", event)
      reject("Error al obtener la factura")
    }
  })
}

export const updateInvoice = async (invoice: Invoice): Promise<Invoice> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["invoices"], "readwrite")
    const store = transaction.objectStore("invoices")

    // Primero obtenemos la factura original para comparar cambios
    const getRequest = store.get(invoice.id)

    getRequest.onsuccess = () => {
      const originalInvoice = getRequest.result
      const updateRequest = store.put(invoice)

      updateRequest.onsuccess = () => {
        // Crear notificación si cambió el estado
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

          createNotification({
            userId: invoice.userId,
            title: "Estado de factura actualizado",
            message,
            type,
            relatedId: invoice.id,
            relatedType: "invoice",
            read: false,
            createdAt: new Date(),
          }).catch(console.error)
        } else if (!originalInvoice) {
          // Si no existía la factura original (caso raro), creamos una notificación genérica
          createNotification({
            userId: invoice.userId,
            title: "Factura actualizada",
            message: `Se ha actualizado la factura #${invoice.invoiceNumber}.`,
            type: "info",
            relatedId: invoice.id,
            relatedType: "invoice",
            read: false,
            createdAt: new Date(),
          }).catch(console.error)
        }

        resolve(invoice)
      }

      updateRequest.onerror = () => {
        reject("Error al actualizar la factura")
      }
    }

    getRequest.onerror = () => {
      reject("Error al obtener la factura original")
    }
  })
}

export const deleteInvoice = async (id: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["invoices"], "readwrite")
    const store = transaction.objectStore("invoices")

    // Primero obtenemos la factura para crear la notificación
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const invoice = getRequest.result
      if (!invoice) {
        reject("Factura no encontrada")
        return
      }

      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => {
        // Crear notificación
        createNotification({
          userId: invoice.userId,
          title: "Factura eliminada",
          message: `Se ha eliminado la factura #${invoice.invoiceNumber}.`,
          type: "warning",
          relatedType: "invoice",
          read: false,
          createdAt: new Date(),
        }).catch(console.error)

        resolve()
      }

      deleteRequest.onerror = () => {
        reject("Error al eliminar la factura")
      }
    }

    getRequest.onerror = () => {
      reject("Error al obtener la factura para eliminar")
    }
  })
}

// Funciones para gastos
export const createExpense = async (expenseData: Omit<Expense, "id">): Promise<Expense> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["expenses"], "readwrite")
    const store = transaction.objectStore("expenses")

    const expense: Expense = {
      id: uuidv4(),
      ...expenseData,
    }

    const request = store.add(expense)

    request.onsuccess = () => {
      // Crear notificación
      createNotification({
        userId: expense.userId,
        title: "Nuevo gasto",
        message: `Se ha registrado un gasto de ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(expense.amount)} en la categoría ${expense.category}.`,
        type: "info",
        relatedId: expense.id,
        relatedType: "expense",
        read: false,
        createdAt: new Date(),
      }).catch(console.error)

      resolve(expense)
    }

    request.onerror = () => {
      reject("Error al crear el gasto")
    }
  })
}

export const getExpensesByUserId = async (userId: string): Promise<Expense[]> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["expenses"], "readonly")
    const store = transaction.objectStore("expenses")
    const index = store.index("userId")

    const request = index.getAll(userId)

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject("Error al obtener los gastos")
    }
  })
}

export const getExpenseById = async (id: string): Promise<Expense | null> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["expenses"], "readonly")
    const store = transaction.objectStore("expenses")

    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject("Error al obtener el gasto")
    }
  })
}

export const updateExpense = async (expense: Expense): Promise<Expense> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["expenses"], "readwrite")
    const store = transaction.objectStore("expenses")

    const request = store.put(expense)

    request.onsuccess = () => {
      // Crear notificación
      createNotification({
        userId: expense.userId,
        title: "Gasto actualizado",
        message: `Se ha actualizado el gasto de ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(expense.amount)} en la categoría ${expense.category}.`,
        type: "info",
        relatedId: expense.id,
        relatedType: "expense",
        read: false,
        createdAt: new Date(),
      }).catch(console.error)

      resolve(expense)
    }

    request.onerror = () => {
      reject("Error al actualizar el gasto")
    }
  })
}

export const deleteExpense = async (id: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["expenses"], "readwrite")
    const store = transaction.objectStore("expenses")

    // Primero obtenemos el gasto para crear la notificación
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const expense = getRequest.result
      if (!expense) {
        reject("Gasto no encontrado")
        return
      }

      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => {
        // Crear notificación
        createNotification({
          userId: expense.userId,
          title: "Gasto eliminado",
          message: `Se ha eliminado un gasto de ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(expense.amount)} en la categoría ${expense.category}.`,
          type: "warning",
          relatedType: "expense",
          read: false,
          createdAt: new Date(),
        }).catch(console.error)

        resolve()
      }

      deleteRequest.onerror = () => {
        reject("Error al eliminar el gasto")
      }
    }

    getRequest.onerror = () => {
      reject("Error al obtener el gasto para eliminar")
    }
  })
}

// Funciones para reportes
export const getInvoicesByDateRange = async (userId: string, startDate: Date, endDate: Date): Promise<Invoice[]> => {
  const allInvoices = await getInvoicesByUserId(userId)
  return allInvoices.filter((invoice) => invoice.date >= startDate && invoice.date <= endDate)
}

export const getExpensesByDateRange = async (userId: string, startDate: Date, endDate: Date): Promise<Expense[]> => {
  const allExpenses = await getExpensesByUserId(userId)
  return allExpenses.filter((expense) => expense.date >= startDate && expense.date <= endDate)
}

// Funciones para notificaciones
export const createNotification = async (notificationData: Omit<Notification, "id">): Promise<Notification> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")

    const notification: Notification = {
      id: uuidv4(),
      ...notificationData,
    }

    const request = store.add(notification)

    request.onsuccess = () => {
      resolve(notification)
    }

    request.onerror = () => {
      reject("Error al crear la notificación")
    }
  })
}

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notifications"], "readonly")
    const store = transaction.objectStore("notifications")
    const index = store.index("userId")

    const request = index.getAll(userId)

    request.onsuccess = () => {
      // Ordenar por fecha de creación (más recientes primero)
      const notifications = request.result || []
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      resolve(notifications)
    }

    request.onerror = () => {
      reject("Error al obtener las notificaciones")
    }
  })
}

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notifications"], "readonly")
    const store = transaction.objectStore("notifications")
    const index = store.index("userId")

    const request = index.getAll(userId)

    request.onsuccess = () => {
      const notifications = request.result || []
      const unreadCount = notifications.filter((n) => !n.read).length
      resolve(unreadCount)
    }

    request.onerror = () => {
      reject("Error al obtener el conteo de notificaciones")
    }
  })
}

export const markNotificationAsRead = async (id: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")

    // Primero obtenemos la notificación
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const notification = getRequest.result
      if (!notification) {
        reject("Notificación no encontrada")
        return
      }

      // Actualizamos el estado de lectura
      notification.read = true

      const updateRequest = store.put(notification)

      updateRequest.onsuccess = () => {
        resolve()
      }

      updateRequest.onerror = () => {
        reject("Error al marcar la notificación como leída")
      }
    }

    getRequest.onerror = () => {
      reject("Error al obtener la notificación")
    }
  })
}

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise(async (resolve, reject) => {
    try {
      // Obtenemos todas las notificaciones no leídas
      const notifications = await getNotificationsByUserId(userId)
      const unreadNotifications = notifications.filter((n) => !n.read)

      if (unreadNotifications.length === 0) {
        resolve()
        return
      }

      const transaction = db.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")

      let completed = 0
      let errors = 0

      unreadNotifications.forEach((notification) => {
        notification.read = true
        const request = store.put(notification)

        request.onsuccess = () => {
          completed++
          if (completed + errors === unreadNotifications.length) {
            if (errors > 0) {
              reject(`Error al marcar ${errors} notificaciones como leídas`)
            } else {
              resolve()
            }
          }
        }

        request.onerror = () => {
          errors++
          completed++
          if (completed + errors === unreadNotifications.length) {
            reject(`Error al marcar ${errors} notificaciones como leídas`)
          }
        }
      })
    } catch (error) {
      reject("Error al marcar todas las notificaciones como leídas")
    }
  })
}

export const deleteNotification = async (id: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")

    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject("Error al eliminar la notificación")
    }
  })
}

export const deleteAllNotifications = async (userId: string): Promise<void> => {
  const db = await initializeDB()
  return new Promise(async (resolve, reject) => {
    try {
      // Obtenemos todas las notificaciones del usuario
      const notifications = await getNotificationsByUserId(userId)

      if (notifications.length === 0) {
        resolve()
        return
      }

      const transaction = db.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")

      let completed = 0
      let errors = 0

      notifications.forEach((notification) => {
        const request = store.delete(notification.id)

        request.onsuccess = () => {
          completed++
          if (completed + errors === notifications.length) {
            if (errors > 0) {
              reject(`Error al eliminar ${errors} notificaciones`)
            } else {
              resolve()
            }
          }
        }

        request.onerror = () => {
          errors++
          completed++
          if (completed + errors === notifications.length) {
            reject(`Error al eliminar ${errors} notificaciones`)
          }
        }
      })
    } catch (error) {
      reject("Error al eliminar todas las notificaciones")
    }
  })
}

// Función para verificar facturas vencidas y crear notificaciones
export const checkOverdueInvoices = async (userId: string): Promise<void> => {
  try {
    const invoices = await getInvoicesByUserId(userId)
    const today = new Date()

    // Filtrar facturas pendientes que han vencido
    const overdueInvoices = invoices.filter(
      (invoice) => invoice.status === "pending" && new Date(invoice.dueDate) < today,
    )

    // Actualizar estado y crear notificaciones
    for (const invoice of overdueInvoices) {
      // Solo actualizar si el estado no era ya "overdue"
      if (invoice.status !== "overdue") {
        invoice.status = "overdue"
        await updateInvoice(invoice)

        // La notificación se crea en updateInvoice
      }
    }
  } catch (error) {
    console.error("Error al verificar facturas vencidas:", error)
  }
}

