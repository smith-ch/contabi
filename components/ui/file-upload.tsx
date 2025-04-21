"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { uploadFile, deleteFile, ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from "@/lib/storage"
import { Upload, X, FileIcon, AlertCircle } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface FileUploadProps {
  bucket: string
  userId: string
  onFileUploaded?: (path: string, url: string) => void
  onFileDeleted?: () => void
  initialFilePath?: string
  initialFileUrl?: string
  allowedTypes?: string[]
  maxSizeBytes?: number
  className?: string
  label?: string
  showPreview?: boolean
  previewSize?: "small" | "medium" | "large"
  variant?: "default" | "outline" | "compact"
}

export function FileUpload({
  bucket,
  userId,
  onFileUploaded,
  onFileDeleted,
  initialFilePath,
  initialFileUrl,
  allowedTypes = ALLOWED_FILE_TYPES.ALL,
  maxSizeBytes = FILE_SIZE_LIMITS.ATTACHMENT,
  className,
  label = "Subir archivo",
  showPreview = true,
  previewSize = "medium",
  variant = "default",
}: FileUploadProps) {
  const [filePath, setFilePath] = useState<string | null>(initialFilePath || null)
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simular progreso de carga
  const simulateProgress = useCallback(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress > 95) {
        clearInterval(interval)
        progress = 95
      }
      setUploadProgress(progress)
    }, 300)
    return () => clearInterval(interval)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      setError(
        `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.map((type) => type.split("/")[1]).join(", ")}`,
      )
      return
    }

    // Validar tamaño de archivo
    if (file.size > maxSizeBytes) {
      setError(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeBytes / (1024 * 1024)}MB`)
      return
    }

    setError(null)
    setIsUploading(true)
    setFileName(file.name)

    // Iniciar simulación de progreso
    const stopProgress = simulateProgress()

    try {
      const result = await uploadFile(file, bucket, userId)
      setFilePath(result.path)
      setFileUrl(result.url)
      setUploadProgress(100)

      if (onFileUploaded) {
        onFileUploaded(result.path, result.url)
      }
    } catch (err) {
      console.error("Error al subir archivo:", err)
      setError("Error al subir el archivo. Intente nuevamente.")
    } finally {
      stopProgress()
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!filePath) return

    try {
      await deleteFile(bucket, filePath)
      setFilePath(null)
      setFileUrl(null)
      setFileName(null)

      if (onFileDeleted) {
        onFileDeleted()
      }
    } catch (err) {
      console.error("Error al eliminar archivo:", err)
      setError("Error al eliminar el archivo.")
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Determinar si el archivo es una imagen
  const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)

  // Tamaños de previsualización
  const previewSizes = {
    small: "h-16 w-16",
    medium: "h-24 w-24",
    large: "h-32 w-32",
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={allowedTypes.join(",")}
      />

      {error && (
        <div className="flex items-center text-red-500 text-sm mb-2">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="truncate max-w-[200px]">{fileName}</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {fileUrl && !isUploading && showPreview && (
        <div className="flex flex-col items-center space-y-2">
          {isImage ? (
            <div className={cn("relative rounded-md overflow-hidden border", previewSizes[previewSize])}>
              <Image src={fileUrl || "/placeholder.svg"} alt="Vista previa" fill className="object-cover" />
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center rounded-md border bg-muted/20",
                previewSizes[previewSize],
              )}
            >
              <FileIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <span className="truncate max-w-[200px]">{fileName || filePath?.split("/").pop()}</span>
          </div>

          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="mt-1">
            <X className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      )}

      {(!filePath || !showPreview) && !isUploading && (
        <div className={variant === "compact" ? "inline-block" : "block"}>
          <Button
            type="button"
            variant={variant === "outline" ? "outline" : "secondary"}
            onClick={triggerFileInput}
            className={variant === "compact" ? "h-9 px-3" : ""}
            disabled={isUploading}
          >
            <Upload className={cn("mr-1", variant === "compact" ? "h-4 w-4" : "h-5 w-5")} />
            {label}
          </Button>
        </div>
      )}
    </div>
  )
}
