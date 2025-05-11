"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  // Verificar conexión con Supabase al cargar el componente
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { error } = await supabase.from("users").select("count").limit(1)

        if (error) {
          console.error("Error de conexión inicial con Supabase:", error)
          setConnectionError(
            "No se pudo establecer conexión con la base de datos. Verifique su conexión a internet e intente nuevamente.",
          )
        } else {
          setConnectionError(null)
        }
      } catch (error) {
        console.error("Error al verificar conexión:", error)
        setConnectionError(
          "Error al verificar la conexión con la base de datos. Por favor, intente nuevamente más tarde.",
        )
      }
    }

    checkConnection()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setConnectionError(null)

    try {
      console.log("Intentando iniciar sesión con:", formData.email)

      // Crear cliente de Supabase
      const supabase = createClientSupabaseClient()

      // Intentar autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      // Si la autenticación falla, intentar el método alternativo
      if (authError) {
        console.log("Autenticación con Auth fallida, intentando método alternativo:", authError.message)

        // Verificar credenciales directamente con Supabase
        const { data, error } = await supabase
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
            setConnectionError("Error al conectar con la base de datos. Por favor, intente nuevamente.")
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
      } else if (authData.session) {
        // Autenticación exitosa con Auth
        console.log("Usuario autenticado correctamente con Auth:", authData.user?.email)

        // Obtener datos completos del usuario
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select()
          .eq("email", formData.email)
          .single()

        if (userError) {
          console.error("Error al obtener datos del usuario:", userError)
        }

        // Guardar sesión
        if (userData) {
          const user = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            password: userData.password, // No deberíamos almacenar esto en producción
            company: userData.company || "",
            rnc: userData.rnc || "",
            address: userData.address || undefined,
            phone: userData.phone || undefined,
            createdAt: new Date(userData.created_at),
          }
          localStorage.setItem("currentUser", JSON.stringify(user))
        } else {
          // Guardar datos mínimos si no se pudo obtener el perfil completo
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              id: authData.user?.id || "",
              email: authData.user?.email || "",
            }),
          )
        }

        // Redirigir al dashboard
        console.log("Redirigiendo al dashboard...")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error inesperado de inicio de sesión:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al iniciar sesión. Por favor, intente nuevamente.",
        variant: "destructive",
      })
      setConnectionError("Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = () => {
    router.push("/register")
  }

  // Modo de demostración para desarrollo
  const handleDemoLogin = () => {
    setFormData({
      email: "demo@example.com",
      password: "password123",
    })
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de conexión</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

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
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={handleDemoLogin}
          >
            Usar cuenta de demostración
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
