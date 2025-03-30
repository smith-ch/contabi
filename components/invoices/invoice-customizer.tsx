"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase-client"

interface InvoiceCustomizationSettings {
  id?: string
  userId: string
  companyName: string
  companyLogo?: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyRNC: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: number
  showLogo: boolean
  showFooter: boolean
  footerText: string
  showWatermark: boolean
  watermarkText: string
  showSignature: boolean
  signatureImage?: string
  signatureName: string
  signatureTitle: string
  showQRCode: boolean
  showBarcodes: boolean
  showPaymentInfo: boolean
  bankName: string
  bankAccount: string
  paymentInstructions: string
  termsAndConditions: string
  createdAt?: string
  updatedAt?: string
}

const defaultSettings: InvoiceCustomizationSettings = {
  userId: "current-user", // Esto debería venir de la autenticación
  companyName: "Mi Empresa",
  companyAddress: "Calle Principal #123, Santo Domingo",
  companyPhone: "(809) 555-1234",
  companyEmail: "info@miempresa.com",
  companyRNC: "123456789",
  primaryColor: "#3b82f6",
  secondaryColor: "#6b7280",
  fontFamily: "Inter",
  fontSize: 12,
  showLogo: true,
  showFooter: true,
  footerText: "Gracias por su preferencia",
  showWatermark: false,
  watermarkText: "PAGADO",
  showSignature: true,
  signatureName: "Juan Pérez",
  signatureTitle: "Gerente General",
  showQRCode: false,
  showBarcodes: false,
  showPaymentInfo: true,
  bankName: "Banco Popular",
  bankAccount: "123456789",
  paymentInstructions: "Favor realizar el pago dentro de los próximos 30 días.",
  termsAndConditions: "Todos los precios incluyen ITBIS. Pago a 30 días.",
}

export function InvoiceCustomizer() {
  const [settings, setSettings] = useState<InvoiceCustomizationSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("invoice_settings")
          .select("*")
          .eq("userId", settings.userId)
          .single()

        if (error) {
          console.error("Error al cargar configuración:", error)
          return
        }

        if (data) {
          setSettings(data as unknown as InvoiceCustomizationSettings)
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Manejar cambios en los campos
  const handleChange = (field: keyof InvoiceCustomizationSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Manejar cambio de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Crear URL para previsualización
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          handleChange("companyLogo", reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Manejar cambio de firma
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSignatureFile(file)

      // Crear URL para previsualización
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          handleChange("signatureImage", reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Guardar configuración
  const saveSettings = async () => {
    setSaving(true)
    try {
      const supabase = createClient()

      // Subir logo si existe
      if (logoFile) {
        const { data: logoData, error: logoError } = await supabase.storage
          .from("invoice-assets")
          .upload(`logos/${settings.userId}_${Date.now()}`, logoFile)

        if (logoError) {
          console.error("Error al subir logo:", logoError)
        } else {
          // Obtener URL pública
          const { data: logoUrl } = supabase.storage.from("invoice-assets").getPublicUrl(logoData.path)

          if (logoUrl) {
            handleChange("companyLogo", logoUrl.publicUrl)
          }
        }
      }

      // Subir firma si existe
      if (signatureFile) {
        const { data: signatureData, error: signatureError } = await supabase.storage
          .from("invoice-assets")
          .upload(`signatures/${settings.userId}_${Date.now()}`, signatureFile)

        if (signatureError) {
          console.error("Error al subir firma:", signatureError)
        } else {
          // Obtener URL pública
          const { data: signatureUrl } = supabase.storage.from("invoice-assets").getPublicUrl(signatureData.path)

          if (signatureUrl) {
            handleChange("signatureImage", signatureUrl.publicUrl)
          }
        }
      }

      // Guardar configuración
      const { data, error } = await supabase
        .from("invoice_settings")
        .upsert({
          ...settings,
          updatedAt: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error("Error al guardar configuración:", error)
        toast({
          title: "Error",
          description: "No se pudo guardar la configuración. Intente nuevamente.",
          variant: "destructive",
        })
        return
      }

      if (data && data[0]) {
        setSettings(data[0] as unknown as InvoiceCustomizationSettings)
        toast({
          title: "Configuración guardada",
          description: "La personalización de facturas ha sido guardada exitosamente.",
        })
      }
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la configuración.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Generar vista previa
  const generatePreview = () => {
    // Aquí se generaría una vista previa de la factura con la configuración actual
    setPreviewUrl("/api/invoice-preview?settings=" + encodeURIComponent(JSON.stringify(settings)))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalización de Facturas</CardTitle>
          <CardDescription>Personalice la apariencia de sus facturas según sus preferencias</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="company">Información de Empresa</TabsTrigger>
              <TabsTrigger value="appearance">Apariencia</TabsTrigger>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="payment">Información de Pago</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyRNC">RNC</Label>
                  <Input
                    id="companyRNC"
                    value={settings.companyRNC}
                    onChange={(e) => handleChange("companyRNC", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => handleChange("companyAddress", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Teléfono</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => handleChange("companyPhone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Correo Electrónico</Label>
                  <Input
                    id="companyEmail"
                    value={settings.companyEmail}
                    onChange={(e) => handleChange("companyEmail", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLogo">Logo de la Empresa</Label>
                  <div className="flex items-center gap-4">
                    <Input id="companyLogo" type="file" accept="image/*" onChange={handleLogoChange} />
                    {settings.companyLogo && (
                      <div className="h-10 w-10 overflow-hidden rounded border">
                        <img
                          src={settings.companyLogo || "/placeholder.svg"}
                          alt="Logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color Principal</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border" style={{ backgroundColor: settings.primaryColor }} />
                    <Input
                      id="primaryColor"
                      value={settings.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Color Secundario</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border" style={{ backgroundColor: settings.secondaryColor }} />
                    <Input
                      id="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Tipo de Letra</Label>
                  <Select value={settings.fontFamily} onValueChange={(value) => handleChange("fontFamily", value)}>
                    <SelectTrigger id="fontFamily">
                      <SelectValue placeholder="Seleccionar tipo de letra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Tamaño de Letra: {settings.fontSize}pt</Label>
                  <Slider
                    id="fontSize"
                    min={8}
                    max={16}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(value) => handleChange("fontSize", value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLogo">Mostrar Logo</Label>
                    <Switch
                      id="showLogo"
                      checked={settings.showLogo}
                      onCheckedChange={(checked) => handleChange("showLogo", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showFooter">Mostrar Pie de Página</Label>
                    <Switch
                      id="showFooter"
                      checked={settings.showFooter}
                      onCheckedChange={(checked) => handleChange("showFooter", checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footerText">Texto de Pie de Página</Label>
                  <Input
                    id="footerText"
                    value={settings.footerText}
                    onChange={(e) => handleChange("footerText", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showWatermark">Mostrar Marca de Agua</Label>
                    <Switch
                      id="showWatermark"
                      checked={settings.showWatermark}
                      onCheckedChange={(checked) => handleChange("showWatermark", checked)}
                    />
                  </div>
                </div>

                {settings.showWatermark && (
                  <div className="space-y-2">
                    <Label htmlFor="watermarkText">Texto de Marca de Agua</Label>
                    <Input
                      id="watermarkText"
                      value={settings.watermarkText}
                      onChange={(e) => handleChange("watermarkText", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSignature">Mostrar Firma</Label>
                    <Switch
                      id="showSignature"
                      checked={settings.showSignature}
                      onCheckedChange={(checked) => handleChange("showSignature", checked)}
                    />
                  </div>
                </div>

                {settings.showSignature && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signatureImage">Imagen de Firma</Label>
                      <div className="flex items-center gap-4">
                        <Input id="signatureImage" type="file" accept="image/*" onChange={handleSignatureChange} />
                        {settings.signatureImage && (
                          <div className="h-10 w-20 overflow-hidden rounded border">
                            <img
                              src={settings.signatureImage || "/placeholder.svg"}
                              alt="Firma"
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signatureName">Nombre de Firma</Label>
                      <Input
                        id="signatureName"
                        value={settings.signatureName}
                        onChange={(e) => handleChange("signatureName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signatureTitle">Cargo</Label>
                      <Input
                        id="signatureTitle"
                        value={settings.signatureTitle}
                        onChange={(e) => handleChange("signatureTitle", e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showQRCode">Mostrar Código QR</Label>
                    <Switch
                      id="showQRCode"
                      checked={settings.showQRCode}
                      onCheckedChange={(checked) => handleChange("showQRCode", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBarcodes">Mostrar Códigos de Barras</Label>
                    <Switch
                      id="showBarcodes"
                      checked={settings.showBarcodes}
                      onCheckedChange={(checked) => handleChange("showBarcodes", checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showPaymentInfo">Mostrar Información de Pago</Label>
                    <Switch
                      id="showPaymentInfo"
                      checked={settings.showPaymentInfo}
                      onCheckedChange={(checked) => handleChange("showPaymentInfo", checked)}
                    />
                  </div>
                </div>

                {settings.showPaymentInfo && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Nombre del Banco</Label>
                      <Input
                        id="bankName"
                        value={settings.bankName}
                        onChange={(e) => handleChange("bankName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Número de Cuenta</Label>
                      <Input
                        id="bankAccount"
                        value={settings.bankAccount}
                        onChange={(e) => handleChange("bankAccount", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="paymentInstructions">Instrucciones de Pago</Label>
                      <Input
                        id="paymentInstructions"
                        value={settings.paymentInstructions}
                        onChange={(e) => handleChange("paymentInstructions", e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="termsAndConditions">Términos y Condiciones</Label>
                  <Input
                    id="termsAndConditions"
                    value={settings.termsAndConditions}
                    onChange={(e) => handleChange("termsAndConditions", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="flex justify-between">
            <Button variant="outline" onClick={generatePreview}>
              Vista Previa
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <iframe src={previewUrl} className="w-full h-[600px]" title="Vista previa de factura" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

