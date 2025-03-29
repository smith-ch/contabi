"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function VerifyTables() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, { exists: boolean; columns?: string[] }>>({})
  const [error, setError] = useState<string | null>(null)

  const verifyTables = async () => {
    setLoading(true)
    setError(null)
    setResults({})

    try {
      // Verificar tabla clients
      const { data: clientsInfo, error: clientsError } = await supabaseClient.rpc("get_table_info", {
        table_name: "clients",
      })

      if (clientsError) {
        console.error("Error al verificar tabla clients:", clientsError)
        setResults((prev) => ({
          ...prev,
          clients: { exists: false },
        }))
      } else {
        setResults((prev) => ({
          ...prev,
          clients: {
            exists: true,
            columns: clientsInfo?.map((col: any) => `${col.column_name} (${col.data_type})`) || [],
          },
        }))
      }

      // Verificar tabla users
      const { data: usersInfo, error: usersError } = await supabaseClient.rpc("get_table_info", {
        table_name: "users",
      })

      if (usersError) {
        console.error("Error al verificar tabla users:", usersError)
        setResults((prev) => ({
          ...prev,
          users: { exists: false },
        }))
      } else {
        setResults((prev) => ({
          ...prev,
          users: {
            exists: true,
            columns: usersInfo?.map((col: any) => `${col.column_name} (${col.data_type})`) || [],
          },
        }))
      }

      // Verificar tabla invoices
      const { data: invoicesInfo, error: invoicesError } = await supabaseClient.rpc("get_table_info", {
        table_name: "invoices",
      })

      if (invoicesError) {
        console.error("Error al verificar tabla invoices:", invoicesError)
        setResults((prev) => ({
          ...prev,
          invoices: { exists: false },
        }))
      } else {
        setResults((prev) => ({
          ...prev,
          invoices: {
            exists: true,
            columns: invoicesInfo?.map((col: any) => `${col.column_name} (${col.data_type})`) || [],
          },
        }))
      }

      // Verificar tabla invoice_items
      const { data: itemsInfo, error: itemsError } = await supabaseClient.rpc("get_table_info", {
        table_name: "invoice_items",
      })

      if (itemsError) {
        console.error("Error al verificar tabla invoice_items:", itemsError)
        setResults((prev) => ({
          ...prev,
          invoice_items: { exists: false },
        }))
      } else {
        setResults((prev) => ({
          ...prev,
          invoice_items: {
            exists: true,
            columns: itemsInfo?.map((col: any) => `${col.column_name} (${col.data_type})`) || [],
          },
        }))
      }
    } catch (err) {
      console.error("Error al verificar tablas:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al verificar tablas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Estructura de Tablas</CardTitle>
        <CardDescription>
          Verifica que las tablas necesarias existan en Supabase y tengan la estructura correcta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={verifyTables} disabled={loading} className="mb-4">
          {loading ? "Verificando..." : "Verificar Tablas"}
        </Button>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>Error: {error}</p>
            </div>
          </div>
        )}

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            {Object.entries(results).map(([table, info]) => (
              <div
                key={table}
                className={`p-4 border rounded-md ${info.exists ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div className="flex items-center mb-2">
                  {info.exists ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  <h3 className="font-medium">{table}</h3>
                </div>

                {info.exists ? (
                  <div>
                    <p className="text-sm text-green-700">La tabla existe</p>
                    {info.columns && info.columns.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Columnas:</p>
                        <ul className="text-xs mt-1 space-y-1">
                          {info.columns.map((col, idx) => (
                            <li key={idx} className="text-gray-700">
                              {col}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-700">La tabla no existe o no es accesible</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

