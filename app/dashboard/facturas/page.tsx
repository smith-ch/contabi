import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { getInvoices } from "./actions"
import { InvoiceList } from "./components/invoice-list"
import { auth } from "@/lib/auth"

export const metadata = {
  title: "Facturas | ContaDom",
  description: "Gestión de facturas para tu negocio",
}

export default async function InvoicesPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Debe iniciar sesión para acceder a esta página</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Facturas</h1>
        <Link href="/dashboard/facturas/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nueva Factura
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando facturas...</div>}>
            <InvoiceListWrapper userId={userId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function InvoiceListWrapper({ userId }: { userId: string }) {
  const invoices = await getInvoices(userId)
  return <InvoiceList invoices={invoices} />
}
