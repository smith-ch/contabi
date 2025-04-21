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
import { Save, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

// Interfaz para los datos de Supabase
interface SupabaseInvoiceSettings {
  id: string
  user_id: string
  company_name: string | null
  company_logo: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  company_rnc: string | null
  primary_color: string | null
  secondary_color: string | null
  font_family: string | null
  font_size: number | null
  show_logo: boolean | null
  show_footer: boolean | null
  footer_text: string | null
  show_watermark: boolean | null
  watermark_text: string | null
  show_signature: boolean | null
  signature_image: string | null
  signature_name: string | null
  signature_title: string | null
  show_qr_code: boolean | null
  show_barcodes: boolean | null
  show_payment_info: boolean | null
  bank_name: string | null
  bank_account: string | null
  payment_instructions: string | null
  terms_and_conditions: string | null
  created_at: string
  updated_at: string
}

const defaultSettings: InvoiceCustomizationSettings = {
  userId: "current-user", // Esto debería venir de la autenticación
  companyName: "Mi Empresa",
  companyAddress: "Calle Principal #123, Santo Domingo",
  companyPhone: "(809) 555-1234",
  companyEmail: "info@miempresa.com",
  companyRNC: "123456789",
  primaryColor: "#0ea5e9", // Sky Blue 500
  secondaryColor: "#475569", // Slate 700
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
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient()

        // Obtener el usuario actual
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error al obtener usuario:", userError)
          throw new Error("No se pudo obtener la información del usuario")
        }

        if (!user) {
          console.warn("No hay usuario autenticado, usando configuración por defecto")
          setLoading(false)
          return
        }

        // Actualizar el userId con el ID real del usuario
        setSettings((prev) => ({
          ...prev,
          userId: user.id,
        }))

        // Buscar configuración existente
        const { data, error } = await supabase.from("invoice_settings").select("*").eq("user_id", user.id).maybeSingle()

        if (error) {
          console.error("Error al cargar configuración:", error)
          throw error
        }

        if (data) {
          // Convertir datos de la base de datos al formato de la aplicación
          const dbData = data as SupabaseInvoiceSettings

          const loadedSettings: InvoiceCustomizationSettings = {
            id: dbData.id,
            userId: dbData.user_id,
            companyName: dbData.company_name || defaultSettings.companyName,
            companyLogo: dbData.company_logo || undefined,
            companyAddress: dbData.company_address || defaultSettings.companyAddress,
            companyPhone: dbData.company_phone || defaultSettings.companyPhone,
            companyEmail: dbData.company_email || defaultSettings.companyEmail,
            companyRNC: dbData.company_rnc || defaultSettings.companyRNC,
            primaryColor: dbData.primary_color || defaultSettings.primaryColor,
            secondaryColor: dbData.secondary_color || defaultSettings.secondaryColor,
            fontFamily: dbData.font_family || defaultSettings.fontFamily,
            fontSize: dbData.font_size || defaultSettings.fontSize,
            showLogo: dbData.show_logo !== null ? dbData.show_logo : defaultSettings.showLogo,
            showFooter: dbData.show_footer !== null ? dbData.show_footer : defaultSettings.showFooter,
            footerText: dbData.footer_text || defaultSettings.footerText,
            showWatermark: dbData.show_watermark !== null ? dbData.show_watermark : defaultSettings.showWatermark,
            watermarkText: dbData.watermark_text || defaultSettings.watermarkText,
            showSignature: dbData.show_signature !== null ? dbData.show_signature : defaultSettings.showSignature,
            signatureImage: dbData.signature_image || undefined,
            signatureName: dbData.signature_name || defaultSettings.signatureName,
            signatureTitle: dbData.signature_title || defaultSettings.signatureTitle,
            showQRCode: dbData.show_qr_code !== null ? dbData.show_qr_code : defaultSettings.showQRCode,
            showBarcodes: dbData.show_barcodes !== null ? dbData.show_barcodes : defaultSettings.showBarcodes,
            showPaymentInfo:
              dbData.show_payment_info !== null ? dbData.show_payment_info : defaultSettings.showPaymentInfo,
            bankName: dbData.bank_name || defaultSettings.bankName,
            bankAccount: dbData.bank_account || defaultSettings.bankAccount,
            paymentInstructions: dbData.payment_instructions || defaultSettings.paymentInstructions,
            termsAndConditions: dbData.terms_and_conditions || defaultSettings.termsAndConditions,
            createdAt: dbData.created_at,
            updatedAt: dbData.updated_at,
          }

          setSettings(loadedSettings)

          toast({
            title: "Configuración cargada",
            description: "Se ha cargado la configuración guardada anteriormente.",
          })
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
        setError("No se pudo cargar la configuración guardada. Por favor intente nuevamente.")
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración guardada.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [toast])

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
    setError(null)
    try {
      const supabase = createClient()

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error("No se encontró un usuario autenticado")
      }

      // Asegurarse de que estamos usando el ID correcto del usuario
      const userId = user.id

      // Subir logo si existe
      let companyLogoUrl = settings.companyLogo
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop()
        const fileName = `${userId}_logo_${Date.now()}.${fileExt}`

        const { data: logoData, error: logoError } = await supabase.storage
          .from("invoice-assets")
          .upload(`logos/${fileName}`, logoFile)

        if (logoError) {
          console.error("Error al subir logo:", logoError)
          throw logoError
        } else {
          // Obtener URL pública
          const { data: logoUrl } = supabase.storage.from("invoice-assets").getPublicUrl(`logos/${fileName}`)

          if (logoUrl) {
            companyLogoUrl = logoUrl.publicUrl
          }
        }
      }

      // Subir firma si existe
      let signatureImageUrl = settings.signatureImage
      if (signatureFile) {
        const fileExt = signatureFile.name.split(".").pop()
        const fileName = `${userId}_signature_${Date.now()}.${fileExt}`

        const { data: signatureData, error: signatureError } = await supabase.storage
          .from("invoice-assets")
          .upload(`signatures/${fileName}`, signatureFile)

        if (signatureError) {
          console.error("Error al subir firma:", signatureError)
          throw signatureError
        } else {
          // Obtener URL pública
          const { data: signatureUrl } = supabase.storage.from("invoice-assets").getPublicUrl(`signatures/${fileName}`)

          if (signatureUrl) {
            signatureImageUrl = signatureUrl.publicUrl
          }
        }
      }

      // Convertir datos al formato de la base de datos
      const dbSettings = {
        user_id: userId,
        company_name: settings.companyName,
        company_logo: companyLogoUrl,
        company_address: settings.companyAddress,
        company_phone: settings.companyPhone,
        company_email: settings.companyEmail,
        company_rnc: settings.companyRNC,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        font_family: settings.fontFamily,
        font_size: settings.fontSize,
        show_logo: settings.showLogo,
        show_footer: settings.showFooter,
        footer_text: settings.footerText,
        show_watermark: settings.showWatermark,
        watermark_text: settings.watermarkText,
        show_signature: settings.showSignature,
        signature_image: signatureImageUrl,
        signature_name: settings.signatureName,
        signature_title: settings.signatureTitle,
        show_qr_code: settings.showQRCode,
        show_barcodes: settings.showBarcodes,
        show_payment_info: settings.showPaymentInfo,
        bank_name: settings.bankName,
        bank_account: settings.bankAccount,
        payment_instructions: settings.paymentInstructions,
        terms_and_conditions: settings.termsAndConditions,
        updated_at: new Date().toISOString(),
      }

      // Guardar configuración
      let query
      if (settings.id) {
        // Actualizar configuración existente
        query = supabase.from("invoice_settings").update(dbSettings).eq("id", settings.id).select()
      } else {
        // Crear nueva configuración
        query = supabase.from("invoice_settings").insert(dbSettings).select()
      }

      const { data, error } = await query

      if (error) {
        console.error("Error al guardar configuración:", error)
        throw error
      }

      if (data && data[0]) {
        // Actualizar el ID si es una nueva configuración
        if (!settings.id) {
          setSettings((prev) => ({
            ...prev,
            id: data[0].id as string,
          }))
        }

        toast({
          title: "Configuración guardada",
          description: "La personalización de facturas ha sido guardada exitosamente.",
        })
      }
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      setError("No se pudo guardar la configuración. Por favor intente nuevamente.")
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
    // Crear un objeto con solo los datos necesarios para la vista previa
    const previewSettings = {
      ...settings,
      // Convertir las imágenes de base64 a URLs si es necesario
      companyLogo: settings.companyLogo,
      signatureImage: settings.signatureImage,
    }

    // Crear URL para la vista previa
    setPreviewUrl(`/api/invoice-preview?settings=${encodeURIComponent(JSON.stringify(previewSettings))}`)

    toast({
      title: "Vista previa generada",
      description: "Se ha generado una vista previa de la factura con la configuración actual.",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-16 p-1 h-8"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Color Secundario</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border" style={{ backgroundColor: settings.secondaryColor }} />
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="w-16 p-1 h-8"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="flex-1"
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
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </>
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
