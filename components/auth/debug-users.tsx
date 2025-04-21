"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  email: string
  password: string
  name: string
}

export function DebugUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    if (showUsers) {
      fetchUsers()
    }
  }, [showUsers])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient.from("users").select("id, email, password, name").limit(5)

      if (error) {
        throw error
      }

      setUsers(data || [])
    } catch (err: any) {
      console.error("Error al obtener usuarios:", err)
      setError(err.message || "Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  if (!showUsers) {
    return (
      <div className="mt-4 text-center">
        <Button variant="outline" onClick={() => setShowUsers(true)}>
          Mostrar usuarios disponibles
        </Button>
      </div>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Usuarios disponibles para pruebas</CardTitle>
        <CardDescription>Utilice cualquiera de estos usuarios para iniciar sesión</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : users.length === 0 ? (
          <p>No hay usuarios disponibles. Por favor, registre un nuevo usuario.</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="p-3 border rounded-md">
                <p>
                  <strong>Nombre:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Contraseña:</strong> {user.password}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
