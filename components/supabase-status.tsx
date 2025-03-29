"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"

export function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    setStatus("checking")
    setErrorMessage(null)

    try {
      // Intentar hacer una consulta simple para verificar la conexión
      const { data, error } = await supabaseClient.from("users").select("count").limit(1)

      if (error) {
        console.error("Error al conectar con Supabase:", error)
        setStatus("error")
        setErrorMessage(error.message)
      } else {
        setStatus("connected")
      }
    } catch (error) {
      console.error("Error al verificar la conexión:", error)
      setStatus("error")
      setErrorMessage("Error inesperado al conectar con la base de datos")
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="mb-6">
      {status === "checking" || isChecking ? (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <AlertTitle className="text-blue-700 dark:text-blue-400">Verificando conexión...</AlertTitle>
          </div>
          <AlertDescription className="text-blue-600 dark:text-blue-300">
            Comprobando la conexión con Supabase
          </AlertDescription>
        </Alert>
      ) : status === "connected" ? (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-400">Conexión establecida</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-300">
            La conexión con Supabase está funcionando correctamente. Los datos se están guardando en la base de datos.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <AlertTitle className="text-red-700 dark:text-red-400">Error de conexión</AlertTitle>
            <AlertDescription className="text-red-600 dark:text-red-300">
              {errorMessage || "No se pudo establecer conexión con Supabase"}
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                  onClick={checkConnection}
                  disabled={isChecking}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}

