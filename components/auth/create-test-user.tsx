"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function CreateTestUser() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCreateTestUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/seed-test-user")
      const data = await response.json()

      if (data.success) {
        if (data.created) {
          toast({
            title: "Usuario de prueba creado",
            description: `Email: test@example.com, Contraseña: password123`,
            variant: "default",
          })
        } else {
          toast({
            title: "Información",
            description: data.message,
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear usuario de prueba:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el usuario de prueba",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4 text-center">
      <Button onClick={handleCreateTestUser} disabled={isLoading}>
        {isLoading ? "Creando..." : "Crear usuario de prueba"}
      </Button>
      <p className="text-sm text-gray-500 mt-2">
        Si es la primera vez que usa el sistema, cree un usuario de prueba para iniciar sesión.
      </p>
    </div>
  )
}
