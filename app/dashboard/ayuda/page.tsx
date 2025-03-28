"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAlert } from "@/components/ui/alert-provider"
import { motion } from "framer-motion"
import { HelpCircle, Search, Mail, MessageSquare, FileText, Users, Receipt, BarChart3, Settings } from "lucide-react"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { addAlert } = useAlert()

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addAlert({
      type: "success",
      title: "Mensaje enviado",
      message: "Su mensaje ha sido enviado. Nos pondremos en contacto con usted pronto.",
      duration: 5000,
    })
  }

  const faqs = [
    {
      question: "¿Cómo puedo crear una nueva factura?",
      answer:
        "Para crear una nueva factura, vaya a la sección 'Facturas' y haga clic en el botón 'Nueva Factura'. Complete el formulario con la información del cliente, los productos o servicios, y guarde la factura.",
    },
    {
      question: "¿Cómo cambio el estado de una factura?",
      answer:
        "Puede cambiar el estado de una factura de dos maneras: 1) Desde la vista de detalles de la factura, editando la factura y cambiando el estado, o 2) Desde la vista Kanban, arrastrando la factura a la columna del estado deseado.",
    },
    {
      question: "¿Cómo puedo personalizar la apariencia de mis facturas?",
      answer:
        "Vaya a 'Configuración > Plantilla de Factura' para personalizar el diseño de sus facturas. Puede cambiar los colores, agregar un logo, y configurar elementos adicionales como firma, pie de página y código QR.",
    },
    {
      question: "¿Cómo agrego un nuevo cliente?",
      answer:
        "Vaya a la sección 'Clientes' y haga clic en el botón 'Nuevo Cliente'. Complete el formulario con la información del cliente y guarde los cambios.",
    },
    {
      question: "¿Cómo puedo ver mis reportes financieros?",
      answer:
        "Vaya a la sección 'Reportes' para ver gráficos y análisis de sus ingresos y gastos. Puede filtrar por diferentes períodos de tiempo para obtener información más detallada.",
    },
    {
      question: "¿Cómo cambio el tema de la aplicación?",
      answer:
        "Puede cambiar entre el tema claro y oscuro haciendo clic en el botón de tema en la barra superior. También puede personalizar el color principal en 'Configuración > Apariencia'.",
    },
    {
      question: "¿Cómo registro un nuevo gasto?",
      answer:
        "Vaya a la sección 'Gastos' y haga clic en el botón 'Nuevo Gasto'. Complete el formulario con la información del gasto y guarde los cambios.",
    },
    {
      question: "¿Cómo puedo exportar mis facturas?",
      answer:
        "Desde la vista de detalles de una factura, puede hacer clic en 'Descargar PDF' para exportar la factura en formato PDF. También puede imprimir la factura directamente desde la aplicación.",
    },
  ]

  const filteredFaqs =
    searchQuery.trim() === ""
      ? faqs
      : faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
        )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Centro de Ayuda</h2>
        <p className="text-muted-foreground">Encuentre respuestas a sus preguntas y obtenga soporte</p>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-md border border-primary/20 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en la ayuda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="bg-primary/5 p-1">
          <TabsTrigger
            value="faq"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Preguntas Frecuentes
          </TabsTrigger>
          <TabsTrigger
            value="guides"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileText className="mr-2 h-4 w-4" />
            Guías
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Contacto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="animate-slide-up">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Preguntas Frecuentes</CardTitle>
              <CardDescription>Respuestas a las preguntas más comunes</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No se encontraron resultados</h3>
                  <p className="text-muted-foreground mt-2">
                    No se encontraron preguntas que coincidan con su búsqueda. Intente con otros términos o contacte con
                    soporte.
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:text-primary">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="animate-slide-up">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Guías de Uso</CardTitle>
              <CardDescription>Aprenda a utilizar todas las funciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: FileText, title: "Facturas", description: "Aprenda a crear, editar y gestionar facturas" },
                  { icon: Users, title: "Clientes", description: "Gestione su cartera de clientes" },
                  { icon: Receipt, title: "Gastos", description: "Registre y categorice sus gastos" },
                  { icon: BarChart3, title: "Reportes", description: "Analice sus finanzas con reportes detallados" },
                  {
                    icon: Settings,
                    title: "Configuración",
                    description: "Personalice el sistema según sus necesidades",
                  },
                  {
                    icon: HelpCircle,
                    title: "Primeros pasos",
                    description: "Guía básica para comenzar a usar el sistema",
                  },
                ].map((guide, index) => (
                  <motion.div key={index} whileHover={{ y: -5 }} className="group cursor-pointer">
                    <Card className="border-primary/10 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="mb-2 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <guide.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{guide.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{guide.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="animate-slide-up">
          <Card className="border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle>Contacto de Soporte</CardTitle>
              <CardDescription>¿Necesita ayuda adicional? Contáctenos</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Nombre
                    </label>
                    <Input id="name" placeholder="Su nombre" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Correo electrónico
                    </label>
                    <Input id="email" type="email" placeholder="correo@ejemplo.com" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Asunto
                  </label>
                  <Input id="subject" placeholder="Asunto de su consulta" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describa su consulta en detalle..."
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 transition-colors">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar mensaje
                  </Button>
                </div>
              </form>

              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Información de contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>soporte@contadom.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>Chat en vivo: Lunes a Viernes, 9:00 AM - 6:00 PM</span>
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

