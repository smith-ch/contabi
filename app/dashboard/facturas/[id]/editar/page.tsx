import { notFound } from "next/navigation"
import { InvoiceForm } from "../../components/invoice-form"
import { getInvoiceById, getClients } from "../../actions"
import { auth } from "@/lib/auth"

export const metadata = {
  title: "Editar Factura | ContaDom",
  description: "Editar una factura existente",
}

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Debe iniciar sesión para acceder a esta página</p>
      </div>
    )
  }

  try {
    const [invoice, clients] = await Promise.all([getInvoiceById(params.id, userId), getClients(userId)])

    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Editar Factura</h1>
        <InvoiceForm initialData={invoice} clients={clients} userId={userId} />
      </div>
    )
  } catch (error) {
    console.error("Error al cargar la factura:", error)
    notFound()
  }
}
