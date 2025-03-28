"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ThemeColorSelector } from "@/components/theme-color-selector"
import { Save, User, Building, Palette, Check } from "lucide-react"
import { motion } from "framer-motion"
import { updateUser, type User as UserType } from "@/lib/db"

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyData, setCompanyData] = useState({
    name: "",
    rnc: "",
    address: "",
    phone: "",
    email: "",
  })
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (!storedUser) return

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Inicializar formularios
        setCompanyData({
          name: userData.company || "",
          rnc: userData.rnc || "",
          address: userData.address || "",
          phone: userData.phone || "",
          email: userData.email || "",
        })

        setUserData({
          name: userData.name || "",
          email: userData.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (user) {
        const updatedUser = {
          ...user,
          company: companyData.name,
          rnc: companyData.rnc,
          address: companyData.address,
          phone: companyData.phone,
          email: companyData.email,
        }

        // Actualizar en IndexedDB
        await updateUser(updatedUser)

        // Actualizar en localStorage
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setUser(updatedUser)

        setSaveSuccess("company")
        setTimeout(() => setSaveSuccess(null), 3000)

        toast({
          title: "Información actualizada",
          description: "Los datos de la empresa han sido actualizados correctamente",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error al guardar datos:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los datos",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (userData.newPassword !== userData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    try {
      if (user) {
        const updatedUser = {
          ...user,
          name: userData.name,
          email: userData.email,
        }

        if (userData.newPassword && userData.currentPassword === user.password) {
          updatedUser.password = userData.newPassword
        } else if (userData.newPassword) {
          toast({
            title: "Error",
            description: "La contraseña actual es incorrecta",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        // Actualizar en IndexedDB
        await updateUser(updatedUser)

        // Actualizar en localStorage
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setUser(updatedUser)

        // Limpiar campos de contraseña
        setUserData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))

        setSaveSuccess("user")
        setTimeout(() => setSaveSuccess(null), 3000)

        toast({
          title: "Información actualizada",
          description: "Los datos del usuario han sido actualizados correctamente",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error al guardar datos:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los datos",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-primary animate-pulse">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Administre la configuración de su cuenta y empresa</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-primary/5 p-1">
          <TabsTrigger
            value="company"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building className="mr-2 h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="mr-2 h-4 w-4" />
            Cuenta
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Palette className="mr-2 h-4 w-4" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="animate-slide-up">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Actualice la información de su empresa que aparecerá en las facturas</CardDescription>
            </CardHeader>
            <form onSubmit={handleCompanySubmit}>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      name="name"
                      value={companyData.name}
                      onChange={handleCompanyChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRnc">RNC</Label>
                    <Input
                      id="companyRnc"
                      name="rnc"
                      value={companyData.rnc}
                      onChange={handleCompanyChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    name="address"
                    value={companyData.address}
                    onChange={handleCompanyChange}
                    className="border-primary/20 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Teléfono</Label>
                    <Input
                      id="companyPhone"
                      name="phone"
                      value={companyData.phone}
                      onChange={handleCompanyChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Correo Electrónico</Label>
                    <Input
                      id="companyEmail"
                      name="email"
                      type="email"
                      value={companyData.email}
                      onChange={handleCompanyChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <div className="ml-auto flex items-center gap-2">
                  {saveSuccess === "company" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 text-success text-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Guardado</span>
                    </motion.div>
                  )}
                  <Button type="submit" className="group" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="animate-slide-up">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Información de la Cuenta</CardTitle>
              <CardDescription>Actualice su información personal y contraseña</CardDescription>
            </CardHeader>
            <form onSubmit={handleUserSubmit}>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Nombre</Label>
                    <Input
                      id="userName"
                      name="name"
                      value={userData.name}
                      onChange={handleUserChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Correo Electrónico</Label>
                    <Input
                      id="userEmail"
                      name="email"
                      type="email"
                      value={userData.email}
                      onChange={handleUserChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={userData.currentPassword}
                    onChange={handleUserChange}
                    className="border-primary/20 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={userData.newPassword}
                      onChange={handleUserChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={userData.confirmPassword}
                      onChange={handleUserChange}
                      className="border-primary/20 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <div className="ml-auto flex items-center gap-2">
                  {saveSuccess === "user" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 text-success text-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Guardado</span>
                    </motion.div>
                  )}
                  <Button type="submit" className="group" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                        Actualizar Cuenta
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="animate-slide-up">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Personalización</CardTitle>
              <CardDescription>Personalice la apariencia del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-3">
                <Label>Color del tema</Label>
                <ThemeColorSelector />
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccione un color para personalizar la apariencia del sistema.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Vista previa</Label>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <Card className="border-primary/20">
                    <CardHeader className="bg-primary/5 pb-2">
                      <CardTitle className="text-sm">Ejemplo de tarjeta</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-xs">
                        Contenido de ejemplo con <span className="text-primary font-medium">color primario</span>.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Button className="w-full">Botón primario</Button>
                    <Button variant="outline" className="w-full">
                      Botón secundario
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Input placeholder="Campo de texto" className="border-primary/20" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary"></div>
                      <span className="text-xs">Color primario</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-secondary"></div>
                      <span className="text-xs">Color secundario</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

