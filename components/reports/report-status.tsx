"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

interface ReportStatusProps {
  status: "loading" | "error" | "success" | "empty"
  message?: string
  onRetry?: () => void
}

export function ReportStatus({ status, message, onRetry }: ReportStatusProps) {
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium text-center">{message || "Generando reporte..."}</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Esto puede tomar unos momentos, por favor espere.
        </p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{message || "Ocurrió un error al generar el reporte."}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar nuevamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "empty") {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin datos</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{message || "No hay datos disponibles para el período seleccionado."}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "success" && message) {
    return (
      <Alert className="my-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-600 dark:text-green-400">Éxito</AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400">{message}</AlertDescription>
      </Alert>
    )
  }

  return null
}

