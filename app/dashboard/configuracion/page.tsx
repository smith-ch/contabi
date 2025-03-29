import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { updateUser, type User } from "@/lib/db"
import { FileUpload } from "@/components/ui/file-upload"
import { STORAGE_BUCKETS } from "@/lib/storage"
import { ThemeColorSelector } from "@/components/theme-color-selector"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    rnc: "",
    address: "",
    phone: "",
    logo: "",  // Esta propiedad debe ser opcional en el User
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setFormData({
          name: userData.name || "",
          company: userData.company || "",
          rnc: userData.rnc || "",
          address: userData.address || "",
          phone: userData.phone || "",
          logo: userData.logo || "",  // Aquí también debe ser opcional
        })
        setLogoUrl(userData.logoUrl || null)
      }
      setLoading(false)
    }

    loadUserData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUploaded = (path: string, url: string) => {
    setFormData((prev) => ({ ...prev, logo: path }))
    setLogoUrl(url)
  }

  const handleFileDeleted = () => {
    setFormData((prev) => ({ ...prev, logo: "" }))
    setLogoUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "No se encontró información del usuario",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const updatedUser = await updateUser({
        ...user,
        name: formData.name,
        company: formData.company,
        rnc: formData.rnc,
        address: formData.address,
        phone: formData.phone,
         // Ahora es válido porque "logo" está en User
      })

      // Actualizar el usuario en localStorage
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          ...updatedUser,
          logoUrl: logoUrl,
        }),
      )

      setUser(updatedUser)

      toast({
        title: "Configuración actualizada",
        description: "La configuración ha sido actualizada exitosamente",
      })
    } catch (error) {
      console.error("Error al actualizar configuración:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la configuración",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-800"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Actualice su información personal y de la empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Su nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Nombre de su empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rnc">RNC</Label>
                <Input
                  id="rnc"
                  name="rnc"
                  value={formData.rnc}
                  onChange={handleInputChange}
                  placeholder="Registro Nacional del Contribuyente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Dirección de la empresa"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo de la empresa</Label>
                {user && (
                  <FileUpload
                    bucket={STORAGE_BUCKETS.LOGOS}
                    userId={user.id}
                    onFileUploaded={handleFileUploaded}
                    onFileDeleted={handleFileDeleted}
                    initialFilePath={formData.logo}
                    initialFileUrl={logoUrl ?? undefined} // Evita el error de null
                    allowedTypes={["image/jpeg", "image/png", "image/webp"]}
                    maxSizeBytes={2 * 1024 * 1024}
                    label="Subir logo"
                    previewSize="medium"
                  />
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personalización</CardTitle>
            <CardDescription>Personalice la apariencia de su sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Tema de color</Label>
                <ThemeColorSelector />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
