"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createUser, getUserByEmail } from "@/lib/db"

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    rnc: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Verificar si el correo ya existe
      const existingUser = await getUserByEmail(formData.email)

      if (existingUser) {
        toast({
          title: "Error",
          description: "Este correo electrónico ya está registrado",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Crear usuario
      const newUser = await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company,
        rnc: formData.rnc,
      })

      toast({
        title: "Registro exitoso",
        description: "Su cuenta ha sido creada correctamente",
      })

      // Redirigir al login
      router.push("/")
    } catch (error) {
      console.error("Error de registro:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar la cuenta. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    router.push("/")
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>Complete el formulario para registrarse en el sistema</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              name="name"
              placeholder="Juan Pérez"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
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
            <Label htmlFor="company">Nombre de la Empresa</Label>
            <Input
              id="company"
              name="company"
              placeholder="Mi Empresa S.R.L."
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rnc">RNC</Label>
            <Input id="rnc" name="rnc" placeholder="000000000" value={formData.rnc} onChange={handleChange} required />
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrarse"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={handleLogin}>
            Ya tengo una cuenta
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

