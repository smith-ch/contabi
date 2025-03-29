"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadFile, getFileUrl, deleteFile } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X, FileIcon } from "lucide-react"

interface FileUploadProps {
  bucket: string
  userId: string
  onFileUploaded: (filePath: string, fileUrl: string) => void
  onFileDeleted?: () => void
  existingFilePath?: string
  accept?: string
  maxSizeMB?: number
  className?: string
  label?: string
  buttonText?: string
}

export function FileUpload({
  bucket,
  userId,
  onFileUploaded,
  onFileDeleted,
  existingFilePath,
  accept = "*",
  maxSizeMB = 5,
  className = "",
  label = "Archivo",
  buttonText = "Subir archivo",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  // Nuevo estado para identificar si el archivo es una imagen
  const [fileIsImage, setFileIsImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Función para verificar si el archivo es imagen
  const isImage = (file: File) => {
    return file.type.startsWith("image/")
  }

  // Formatea el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Cargar archivo existente si está disponible
  const loadExistingFile = async () => {
    if (existingFilePath) {
      try {
        const url = await getFileUrl(bucket, existingFilePath)
        if (url) {
          setPreviewUrl(url)
          // Extraer nombre de archivo a partir de la ruta
          const fileName = existingFilePath.split("/").pop() || "archivo"
          setFileName(fileName)
          // Opcional: determinar si es imagen a partir de la extensión
          const extension = fileName.split(".").pop()?.toLowerCase() || ""
          const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]
          setFileIsImage(imageExtensions.includes(extension))
        }
      } catch (error) {
        console.error("Error loading existing file:", error)
      }
    }
  }

  // Llama a loadExistingFile cuando cambie existingFilePath
  useState(() => {
    loadExistingFile()
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar tamaño del archivo
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast({
        title: "Error",
        description: `El archivo es demasiado grande. El tamaño máximo es ${maxSizeMB}MB.`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Generar un nombre único para el archivo
      const timestamp = new Date().getTime()
      const extension = file.name.split(".").pop() || ""
      const uniqueFileName = `${timestamp}.${extension}`

      // Subir el archivo
      const filePath = await uploadFile(bucket, uniqueFileName, file, userId)

      if (filePath) {
        // Obtener la URL pública
        const fileUrl = await getFileUrl(bucket, filePath)

        if (fileUrl) {
          // Si es imagen, establece la URL de vista previa
          if (isImage(file)) {
            setPreviewUrl(fileUrl)
            setFileIsImage(true)
          } else {
            setPreviewUrl(null)
            setFileIsImage(false)
          }

          setFileName(file.name)

          // Notifica al componente padre
          onFileUploaded(filePath, fileUrl)

          toast({
            title: "Archivo subido",
            description: "El archivo se ha subido correctamente.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo subir el archivo. Inténtelo de nuevo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al subir el archivo.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingFilePath) return

    setIsDeleting(true)

    try {
      const success = await deleteFile(bucket, existingFilePath)

      if (success) {
        setPreviewUrl(null)
        setFileName(null)
        setFileIsImage(false)

        // Reinicia el input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Notifica al componente padre
        if (onFileDeleted) {
          onFileDeleted()
        }

        toast({
          title: "Archivo eliminado",
          description: "El archivo se ha eliminado correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el archivo. Inténtelo de nuevo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el archivo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={className}>
      <Label htmlFor="file-upload">{label}</Label>

      {/* Vista previa del archivo o botón de subir */}
      <div className="mt-2">
        {previewUrl && fileIsImage ? (
          <div className="relative rounded-md border overflow-hidden">
            <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-h-40 w-auto object-contain" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-primary" />
              <span className="text-sm truncate max-w-[200px]">{fileName}</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-md border-2 border-dashed p-6">
            <label htmlFor="file-upload" className="flex flex-col items-center gap-2 cursor-pointer">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
              <span className="text-sm text-muted-foreground">{isUploading ? "Subiendo..." : buttonText}</span>
              <span className="text-xs text-muted-foreground">Máximo {maxSizeMB}MB</span>
            </label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  )
}
