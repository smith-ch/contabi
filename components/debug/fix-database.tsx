"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function FixDatabase() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const fixDatabase = async () => {
    setLoading(true)
    setResults({})

    try {
      // Ejecutar script para corregir políticas de RLS para invoices
      const { error: invoicesError } = await supabaseClient.rpc("fix_invoices_policies")
      setResults((prev) => ({ ...prev, invoices: !invoicesError }))

      if (invoicesError) {
        console.error("Error al corregir políticas de facturas:", invoicesError)
      }

      // Ejecutar script para corregir políticas de RLS para invoice_items
      const { error: itemsError } = await supabaseClient.rpc("fix_invoice_items_policies")
      setResults((prev) => ({ ...prev, invoice_items: !itemsError }))

      if (itemsError) {
        console.error("Error al corregir políticas de items de facturas:", itemsError)
      }

      // Ejecutar script para corregir políticas de RLS para expenses
      const { error: expensesError } = await supabaseClient.rpc("fix_expenses_policies")
      setResults((prev) => ({ ...prev, expenses: !expensesError }))

      if (expensesError) {
        console.error("Error al corregir políticas de gastos:", expensesError)
      }

      // Ejecutar script para corregir políticas de RLS para notifications
      const { error: notificationsError } = await supabaseClient.rpc("fix_notifications_policies")
      setResults((prev) => ({ ...prev, notifications: !notificationsError }))

      if (notificationsError) {
        console.error("Error al corregir políticas de notificaciones:", notificationsError)
      }

      toast({
        title: "Corrección completada",
        description: "Se han aplicado las correcciones a la base de datos",
        
      })
    } catch (error) {
      console.error("Error al corregir la base de datos:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al corregir la base de datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Corregir Políticas de Seguridad
        </CardTitle>
        <CardDescription>
          Corrige las políticas de seguridad de fila (RLS) para permitir la creación de registros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Si estás experimentando errores al crear facturas, gastos o notificaciones, este proceso puede ayudar a
          corregir las políticas de seguridad en la base de datos.
        </p>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2 mt-4">
            {Object.entries(results).map(([table, success]) => (
              <div key={table} className="flex items-center gap-2">
                {success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span>
                  {table}: {success ? "Corregido" : "Error"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={fixDatabase} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Corrigiendo...
            </>
          ) : (
            "Corregir Base de Datos"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

