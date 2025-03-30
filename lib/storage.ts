import { supabaseClient } from "./supabase"
import { v4 as uuidv4 } from "uuid"

// Definir los buckets de almacenamiento
export const STORAGE_BUCKETS = {
  RECEIPTS: "receipts",
  LOGOS: "logos",
  ATTACHMENTS: "attachments",
}

// Tipos de archivos permitidos por categoría
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALL: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}



// Límites de tamaño de archivo (en bytes)
export const FILE_SIZE_LIMITS = {
  LOGO: 2 * 1024 * 1024, // 2MB
  RECEIPT: 5 * 1024 * 1024, // 5MB
  ATTACHMENT: 10 * 1024 * 1024, // 10MB
}

// Interfaz para la respuesta de carga de archivos
export interface UploadResponse {
  path: string
  url: string
}

/**
 * Inicializa los buckets de almacenamiento necesarios
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Verificar y crear buckets si no existen
    for (const bucket of Object.values(STORAGE_BUCKETS)) {
      const { data: existingBucket, error: getBucketError } = await supabaseClient.storage.getBucket(bucket)

      if (getBucketError && !existingBucket) {
        const { error: createBucketError } = await supabaseClient.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: FILE_SIZE_LIMITS.ATTACHMENT,
        })

        if (createBucketError) {
          console.error(`Error al crear bucket ${bucket}:`, createBucketError)
        } else {
          console.log(`Bucket ${bucket} creado exitosamente`)
        }
      }
    }
  } catch (error) {
    console.error("Error al inicializar almacenamiento:", error)
  }
}

/**
 * Sube un archivo al almacenamiento
 * @param file Archivo a subir
 * @param bucket Bucket donde se almacenará
 * @param userId ID del usuario propietario
 * @param customPath Ruta personalizada (opcional)
 * @returns Información del archivo subido
 */
export async function uploadFile(
  file: File,
  bucket: string,
  userId: string,
  customPath?: string,
): Promise<UploadResponse> {
  try {
    // Generar un nombre de archivo único
    const fileExt = file.name.split(".").pop()
    const fileName = customPath || `${userId}/${uuidv4()}.${fileExt}`

    // Subir el archivo
    const { error: uploadError } = await supabaseClient.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Error al subir archivo:", uploadError)
      throw new Error(`Error al subir archivo: ${uploadError.message}`)
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = await supabaseClient.storage.from(bucket).createSignedUrl(fileName, 60 * 60 * 24 * 365) // URL válida por 1 año

    if (!urlData?.signedUrl) {
      throw new Error("No se pudo obtener la URL del archivo")
    }

    return {
      path: fileName,
      url: urlData.signedUrl,
    }
  } catch (error) {
    console.error("Error en uploadFile:", error)
    throw error
  }
}

/**
 * Obtiene la URL de un archivo
 * @param bucket Bucket donde está almacenado
 * @param path Ruta del archivo
 * @returns URL firmada del archivo
 */
export async function getFileUrl(bucket: string, path: string): Promise<string | null> {
  try {
    if (!path) return null

    const { data, error } = await supabaseClient.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24) // URL válida por 1 día

    if (error) {
      console.error("Error al obtener URL del archivo:", error)
      return null
    }

    return data?.signedUrl || null
  } catch (error) {
    console.error("Error en getFileUrl:", error)
    return null
  }
}

/**
 * Elimina un archivo del almacenamiento
 * @param bucket Bucket donde está almacenado
 * @param path Ruta del archivo
 * @returns true si se eliminó correctamente
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    if (!path) return false

    const { error } = await supabaseClient.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error al eliminar archivo:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error en deleteFile:", error)
    return false
  }
}

/**
 * Lista los archivos de un usuario en un bucket específico
 * @param bucket Bucket a consultar
 * @param userId ID del usuario
 * @returns Lista de archivos
 */
export async function listUserFiles(bucket: string, userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient.storage.from(bucket).list(`${userId}/`)

    if (error) {
      console.error("Error al listar archivos:", error)
      return []
    }

    return data?.map((item) => item.name) || []
  } catch (error) {
    console.error("Error en listUserFiles:", error)
    return []
  }
}

