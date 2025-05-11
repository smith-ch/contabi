import { InvoiceForm } from "../components/invoice-form"
import { getClients } from "../actions"
import { auth } from "@/lib/auth"

export const metadata = {
  title: "Nueva Factura | ContaDom",
  description: "Crear una nueva factura",
}

export default async function NewInvoicePage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Debe iniciar sesión para acceder a esta página</p>
      </div>
    )
  }

  const clients = await getClients(userId)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Nueva Factura</h1>
      <InvoiceForm clients={clients} userId={userId} />
    </div>
  )
}
