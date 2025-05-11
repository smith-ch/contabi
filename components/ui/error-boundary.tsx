"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    })

    // Opcional: registrar el error en un servicio de monitoreo
    console.error("Error capturado por ErrorBoundary:", error, errorInfo)
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.()
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 dark:border-red-900 shadow-md">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error en la aplicación
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="mb-2">Ha ocurrido un error inesperado en este componente.</p>
              {this.state.error && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
                  <p className="font-mono">{this.state.error.toString()}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={this.resetErrorBoundary}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}
