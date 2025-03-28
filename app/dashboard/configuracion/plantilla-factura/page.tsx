"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "@/components/ui/color-picker"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { Upload, ImageIcon, Save } from "lucide-react"

export default function InvoiceTemplatePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [templateConfig, setTemplateConfig] = useState({
    logo: "",
    primaryColor: "#4f46e5",
    secondaryColor: "#e5e7eb",
    showLogo: true,
    showFooter: true,
    footerText:
      "Gracias por su preferencia. Este documento es una factura fiscal válida según las regulaciones de la República Dominicana.",
    showSignature: false,
    signatureText: "Firma autorizada",
    showWatermark: false,
    watermarkText: "PAGADO",
    showQRCode: false,
  })

  useEffect(() => {
    // Cargar configuración guardada
    const savedConfig = localStorage.getItem("invoiceTemplateConfig")
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      setTemplateConfig(config)
      if (config.logo) {
        setLogoPreview(config.logo)
      }
    }
    setLoading(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTemplateConfig((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setTemplateConfig((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleColorChange = (name: string, color: string) => {
    setTemplateConfig((prev) => ({
      ...prev,
      [name]: color,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setLogoPreview(base64String)
        setTemplateConfig((prev) => ({
          ...prev,
          logo: base64String,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    localStorage.setItem("invoiceTemplateConfig", JSON.stringify(templateConfig))
    toast({
      title: "Plantilla guardada",
      description: "La configuración de la plantilla ha sido guardada exitosamente",
    })
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Plantilla de Factura</h2>
        <p className="text-muted-foreground">Personalice el diseño de sus facturas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Personalice los elementos principales de su factura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo de la empresa</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-md border flex items-center justify-center overflow-hidden bg-gray-50">
                    {logoPreview ? (
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <Button asChild variant="outline" size="sm">
                      <label className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Subir logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">Recomendado: PNG o JPG, 300x100px</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color primario</Label>
                  <ColorPicker
                    color={templateConfig.primaryColor}
                    onChange={(color) => handleColorChange("primaryColor", color)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color secundario</Label>
                  <ColorPicker
                    color={templateConfig.secondaryColor}
                    onChange={(color) => handleColorChange("secondaryColor", color)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showLogo">Mostrar logo</Label>
                  <Switch
                    id="showLogo"
                    checked={templateConfig.showLogo}
                    onCheckedChange={(checked) => handleSwitchChange("showLogo", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Elementos Adicionales</CardTitle>
              <CardDescription>Configure elementos opcionales para su factura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showFooter">Mostrar pie de página</Label>
                  <Switch
                    id="showFooter"
                    checked={templateConfig.showFooter}
                    onCheckedChange={(checked) => handleSwitchChange("showFooter", checked)}
                  />
                </div>
                {templateConfig.showFooter && (
                  <Textarea
                    name="footerText"
                    value={templateConfig.footerText}
                    onChange={handleInputChange}
                    placeholder="Texto del pie de página"
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showSignature">Mostrar firma</Label>
                  <Switch
                    id="showSignature"
                    checked={templateConfig.showSignature}
                    onCheckedChange={(checked) => handleSwitchChange("showSignature", checked)}
                  />
                </div>
                {templateConfig.showSignature && (
                  <Input
                    name="signatureText"
                    value={templateConfig.signatureText}
                    onChange={handleInputChange}
                    placeholder="Texto de la firma"
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showWatermark">Mostrar marca de agua</Label>
                  <Switch
                    id="showWatermark"
                    checked={templateConfig.showWatermark}
                    onCheckedChange={(checked) => handleSwitchChange("showWatermark", checked)}
                  />
                </div>
                {templateConfig.showWatermark && (
                  <Input
                    name="watermarkText"
                    value={templateConfig.watermarkText}
                    onChange={handleInputChange}
                    placeholder="Texto de la marca de agua"
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showQRCode">Mostrar código QR</Label>
                  <Switch
                    id="showQRCode"
                    checked={templateConfig.showQRCode}
                    onCheckedChange={(checked) => handleSwitchChange("showQRCode", checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  El código QR contendrá la información de la factura para facilitar su lectura digital.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Guardar configuración
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Así se verá su factura</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[800px]">
              <InvoicePreview config={templateConfig} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

