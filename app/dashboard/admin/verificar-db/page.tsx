"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createUser } from "@/lib/db"
import { CheckCircle2, XCircle, Database, RefreshCw, UserPlus } from "lucide-react"

interface TableStatus {
  name: string
  exists: boolean
  count?: number | null
}

export default function VerifyDatabasePage() {
  const [tables, setTables] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingUser, setCreatingUser] = useState(false)
  const [userCreated, setUserCreated] = useState(false)

  const checkTables = async () => {
    setLoading(true)

    const tablesToCheck = ["users", "clients", "invoices", "invoice_items", "expenses", "notifications"]

    const results: TableStatus[] = []

    for (const table of tablesToCheck) {
      try {
        // Verificar si la tabla existe
        const { count, error } = await supabaseClient.from(table).select("*", { count: "exact", head: true })

        if (error) {
          console.error(`Error al verificar la tabla ${table}:`, error)
          results.push({ name: table, exists: false })
        } else {
          results.push({ name: table, exists: true, count })
        }
      } catch (error) {
        console.error(`Error al verificar la tabla ${table}:`, error)
        results.push({ name: table, exists: false })
      }
    }

    setTables(results)
    setLoading(false)
  }

  const createTestUser = async () => {
    setCreatingUser(true)

    try {
      const testUser = await createUser({
        name: "Usuario de Prueba",
        email: "test@example.com",
        password: "password123",
        company: "Empresa de Prueba",
        rnc: "123456789",
        address: "Calle Principal #123, Santo Domingo",
        phone: "+1809555-1234",
        // Se eliminó "createdAt" ya que no se permite en el tipo de entrada
      })

      if (testUser) {
        setUserCreated(true)
        // Actualizar el conteo de usuarios
        checkTables()
      }
    } catch (error) {
      console.error("Error al crear usuario de prueba:", error)
    } finally {
      setCreatingUser(false)
    }
  }

  useEffect(() => {
    checkTables()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Verificación de Base de Datos</h2>
          <p className="text-muted-foreground">Comprueba el estado de las tablas en Supabase</p>
        </div>
        <Button onClick={checkTables} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de las Tablas
          </CardTitle>
          <CardDescription>Verifica que todas las tablas necesarias existen en Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {table.exists ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{table.name}</p>
                      {table.exists && (
                        <p className="text-sm text-muted-foreground">
                          {table.count !== undefined ? `${table.count} registros` : "Tabla existente"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {table.exists ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">OK</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Error</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {tables.every((t) => t.exists) ? (
              <span className="text-green-600">Todas las tablas están correctamente configuradas</span>
            ) : (
              <span className="text-red-600">Algunas tablas no existen o no son accesibles</span>
            )}
          </div>

          {tables.find((t) => t.name === "users")?.exists && (
            <Button
              onClick={createTestUser}
              disabled={creatingUser || userCreated}
              variant={userCreated ? "outline" : "default"}
            >
              {creatingUser ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Creando...
                </>
              ) : userCreated ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Usuario creado
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear usuario de prueba
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {userCreated && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <AlertTitle className="text-green-700 dark:text-green-400">Usuario de prueba creado</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-300">
              <p>Se ha creado un usuario de prueba con las siguientes credenciales:</p>
              <ul className="mt-2 list-disc list-inside">
                <li>Email: test@example.com</li>
                <li>Contraseña: password123</li>
              </ul>
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}
