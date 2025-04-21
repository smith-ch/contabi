"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Intentando iniciar sesión con:", formData.email)

      // Verificar conexión con Supabase
      const { data: connectionTest, error: connectionError } = await supabaseClient
        .from("users")
        .select("count")
        .limit(1)

      if (connectionError) {
        console.error("Error de conexión con Supabase:", connectionError)
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con la base de datos. Por favor, intente nuevamente.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("Conexión con Supabase exitosa, verificando credenciales...")

      // Verificar credenciales directamente con Supabase
      const { data, error } = await supabaseClient
        .from("users")
        .select()
        .eq("email", formData.email)
        .eq("password", formData.password)
        .single()

      if (error) {
        console.error("Error al verificar credenciales:", error)

        if (error.code === "PGRST116") {
          toast({
            title: "Error de autenticación",
            description: "Credenciales incorrectas. Por favor, intente nuevamente.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: `Error al verificar credenciales: ${error.message}`,
            variant: "destructive",
          })
        }

        setIsLoading(false)
        return
      }

      if (data) {
        console.log("Usuario autenticado correctamente:", data.email)

        // Convertir el usuario de Supabase al formato de la aplicación
        const user = {
          id: data.id,
          name: data.name,
          email: data.email,
          password: data.password, // No deberíamos almacenar esto en producción
          company: data.company || "",
          rnc: data.rnc || "",
          address: data.address || undefined,
          phone: data.phone || undefined,
          createdAt: new Date(data.created_at),
        }

        // Guardar sesión
        localStorage.setItem("currentUser", JSON.stringify(user))

        // Redirigir al dashboard
        console.log("Redirigiendo al dashboard...")
        router.push("/dashboard")
      } else {
        console.error("No se encontró el usuario pero no se devolvió un error")
        toast({
          title: "Error de autenticación",
          description: "Credenciales incorrectas. Por favor, intente nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error inesperado de inicio de sesión:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al iniciar sesión. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = () => {
    router.push("/register")
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={handleRegister}>
            Registrarse
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
