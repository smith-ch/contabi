"use client"
import { AlertCircle } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card"

interface ConnectionErrorProps {
  message: string
  onRetry?: () => void
}

export function ConnectionError({ message, onRetry }: ConnectionErrorProps) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-red-700 dark:text-red-400">
          <AlertCircle className="mr-2 h-5 w-5" />
          Error de conexión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-600 dark:text-red-300">{message}</p>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={onRetry}
            className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900"
          >
            Reintentar conexión
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
