"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAlert } from "@/components/ui/alert-provider"
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  FileQuestion,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react"

export default function SupportPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { addAlert } = useAlert()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Simulamos el envío del formulario
      await new Promise((resolve) => setTimeout(resolve, 1500))

      addAlert({
        type: "success",
        title: "Mensaje enviado",
        message: "Su mensaje ha sido enviado correctamente. Nos pondremos en contacto pronto.",
        duration: 5000,
      })

      // Limpiar el formulario
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
    } catch (error) {
      addAlert({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al enviar su mensaje. Por favor intente nuevamente.",
        duration: 5000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const faqItems = [
    {
      question: "¿Cómo puedo generar una factura?",
      answer:
        "Para generar una factura, vaya a la sección 'Facturas' en el panel de navegación, luego haga clic en el botón 'Nueva Factura'. Complete los datos requeridos y haga clic en 'Guardar'.",
    },
    {
      question: "¿Cómo puedo marcar una factura como pagada?",
      answer:
        "Para marcar una factura como pagada, vaya a la sección 'Facturas', encuentre la factura que desea marcar como pagada, haga clic en el menú de opciones (tres puntos) y seleccione 'Marcar como Pagada'.",
    },
    {
      question: "¿Cómo puedo generar reportes financieros?",
      answer:
        "Para generar reportes financieros, vaya a la sección 'Reportes' en el panel de navegación. Allí encontrará diferentes opciones de reportes, incluyendo el Reporte 606 para la DGII.",
    },
    {
      question: "¿Cómo puedo actualizar mi información de perfil?",
      answer:
        "Para actualizar su información de perfil, haga clic en su nombre de usuario en la esquina superior derecha, seleccione 'Perfil' y luego podrá editar su información personal, incluyendo su logo y datos fiscales.",
    },
    {
      question: "¿Cómo puedo registrar un nuevo cliente?",
      answer:
        "Para registrar un nuevo cliente, vaya a la sección 'Clientes' en el panel de navegación, luego haga clic en el botón 'Nuevo Cliente'. Complete los datos requeridos y haga clic en 'Guardar'.",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Soporte Técnico</h2>
        <p className="text-muted-foreground">Estamos aquí para ayudarle con cualquier consulta o problema técnico</p>
      </div>

      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 p-1 rounded-lg">
          <TabsTrigger
            value="contact"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <Mail className="mr-2 h-4 w-4" />
            Contacto
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Preguntas Frecuentes
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <Clock className="mr-2 h-4 w-4" />
            Estado del Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <motion.div className="grid gap-6 md:grid-cols-2" variants={container} initial="hidden" animate="show">
            <motion.div variants={item}>
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-t-lg border-b border-blue-200 dark:border-blue-800">
                  <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <MessageSquare className="h-5 w-5" />
                    Formulario de Contacto
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-400">
                    Envíenos un mensaje y nos pondremos en contacto a la brevedad
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-blue-700 dark:text-blue-400">
                        Nombre
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Su nombre"
                        required
                        className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-700 dark:text-blue-400">
                        Correo Electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Su correo electrónico"
                        required
                        className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-blue-700 dark:text-blue-400">
                        Asunto
                      </Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Asunto de su mensaje"
                        required
                        className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-blue-700 dark:text-blue-400">
                        Mensaje
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describa su consulta o problema"
                        required
                        className="min-h-[120px] bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                    <motion.div className="pt-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Mensaje
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow h-full">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-t-lg border-b border-purple-200 dark:border-purple-800">
                  <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                    <Phone className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-400">
                    Otras formas de contactarnos
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
                    <motion.div
                      className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shadow-sm"
                      variants={item}
                    >
                      <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-purple-800 dark:text-purple-300">Correo Electrónico</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                          <a href="mailto:smithrodriguez345@gmail.com" className="hover:underline">
                            smithrodriguez345@gmail.com
                          </a>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Respuesta en 24-48 horas hábiles</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shadow-sm"
                      variants={item}
                    >
                      <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-purple-800 dark:text-purple-300">Teléfono</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                          <a href="tel:+18091234567" className="hover:underline">
                            +1 (809) 123-4567
                          </a>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Lunes a Viernes, 9:00 AM - 6:00 PM</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shadow-sm"
                      variants={item}
                    >
                      <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-purple-800 dark:text-purple-300">Chat en Vivo</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                          Disponible en horario laboral
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Haga clic en el ícono de chat en la esquina inferior derecha
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-t border-purple-200 dark:border-purple-800 px-6 py-4">
                  <p className="text-sm text-center w-full text-purple-700 dark:text-purple-400">
                    Estamos comprometidos a brindarle el mejor soporte posible
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="faq">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-t-lg border-b border-amber-200 dark:border-amber-800">
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <FileQuestion className="h-5 w-5" />
                Preguntas Frecuentes
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-400">
                Respuestas a las preguntas más comunes sobre nuestro sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AccordionItem value={`item-${index}`} className="border-amber-200 dark:border-amber-800">
                        <AccordionTrigger className="text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-amber-700 dark:text-amber-400">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </motion.div>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-t border-amber-200 dark:border-amber-800 px-6 py-4">
              <p className="text-sm text-center w-full text-amber-700 dark:text-amber-400">
                ¿No encuentra lo que busca? Contáctenos a través del formulario de soporte.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 border-green-200 dark:border-green-800 shadow-md">
            <CardHeader className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-t-lg border-b border-green-200 dark:border-green-800">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <Clock className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-400">
                Información sobre el estado actual de nuestros servicios
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
                <motion.div
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 shadow-sm"
                  variants={item}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-300">Aplicación Principal</span>
                  </div>
                  <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                    Operativo
                  </span>
                </motion.div>

                <motion.div
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 shadow-sm"
                  variants={item}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-300">Base de Datos</span>
                  </div>
                  <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                    Operativo
                  </span>
                </motion.div>

                <motion.div
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 shadow-sm"
                  variants={item}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-300">API</span>
                  </div>
                  <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                    Operativo
                  </span>
                </motion.div>

                <motion.div
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-800 shadow-sm"
                  variants={item}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-300">Generación de PDF</span>
                  </div>
                  <span className="text-sm px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded-full">
                    Rendimiento Reducido
                  </span>
                </motion.div>
              </motion.div>

              <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">Últimas Actualizaciones</h3>
                <div className="space-y-4">
                  <div className="border-l-2 border-green-400 dark:border-green-600 pl-4">
                    <p className="text-xs text-muted-foreground">29 de marzo, 2025 - 14:30</p>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Se ha implementado el nuevo módulo de Reporte 606 con formato actualizado según los requerimientos
                      de la DGII.
                    </p>
                  </div>
                  <div className="border-l-2 border-yellow-400 dark:border-yellow-600 pl-4">
                    <p className="text-xs text-muted-foreground">28 de marzo, 2025 - 10:15</p>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Estamos trabajando en mejorar el rendimiento del servicio de generación de PDF. Se espera
                      normalizar en las próximas horas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/50 dark:to-teal-950/50 border-t border-green-200 dark:border-green-800 px-6 py-4">
              <p className="text-sm text-center w-full text-green-700 dark:text-green-400">
                Última actualización: 29 de marzo, 2025 - 20:17
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
