import { createClient } from "@supabase/supabase-js"

export const STORAGE_BUCKETS = {
  LOGOS: "logos",
  RECEIPTS: "receipts",
  INVOICES: "invoices",
  PROFILES: "profiles",
}

export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/webp"],
  PDF: ["application/pdf"],
  ALL: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
}

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

export interface StorageInitResult {
  success: boolean
  error?: string
  buckets?: string[]
}

// Cliente Supabase para operaciones de almacenamiento
let supabaseStorageClient: ReturnType<typeof createClient> | null = null

// Inicializar cliente de almacenamiento
function getStorageClient() {
  if (supabaseStorageClient) return supabaseStorageClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  supabaseStorageClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseStorageClient
}

/**
 * Inicializa los buckets de almacenamiento necesarios
 * Nota: Esta función ahora solo verifica los buckets existentes sin intentar crearlos
 * debido a las restricciones de RLS
 */
export async function initializeStorage(): Promise<StorageInitResult> {
  try {
    console.log("Verificando almacenamiento disponible...")

    const client = getStorageClient()
    const availableBuckets: string[] = []

    // Verificar qué buckets están disponibles
    for (const bucket of Object.values(STORAGE_BUCKETS)) {
      try {
        const { data, error } = await client.storage.from(bucket).list()

        if (!error) {
          console.log(`Bucket ${bucket} está disponible`)
          availableBuckets.push(bucket)
        } else {
          console.warn(`Bucket ${bucket} no está disponible:`, error.message)
        }
      } catch (err) {
        console.warn(`Error al verificar bucket ${bucket}:`, err)
      }
    }

    if (availableBuckets.length === 0) {
      return {
        success: false,
        error: "No se encontraron buckets de almacenamiento disponibles. Algunas funciones estarán limitadas.",
        buckets: [],
      }
    }

    return {
      success: true,
      buckets: availableBuckets,
    }
  } catch (error) {
    console.error("Error al verificar almacenamiento:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      buckets: [],
    }
  }
}

/**
 * Sube un archivo al almacenamiento
 */
export async function uploadFile(
  file: File,
  bucket: string,
  userId: string,
  customPath?: string,
): Promise<UploadResponse> {
  try {
    const client = getStorageClient()

    // Generar un nombre de archivo único
    const fileExt = file.name.split(".").pop()
    const fileName = customPath || `${userId}/${Date.now()}.${fileExt}`

    // Subir el archivo
    const { error: uploadError } = await client.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Error al subir archivo:", uploadError)
      throw new Error(`Error al subir archivo: ${uploadError.message}`)
    }

    // Obtener la URL pública del archivo
    const { data } = client.storage.from(bucket).getPublicUrl(fileName)

    return {
      path: fileName,
      url: data.publicUrl,
    }
  } catch (error) {
    console.error("Error en uploadFile:", error)
    throw error
  }
}

/**
 * Obtiene la URL de un archivo
 */
export async function getFileUrl(bucket: string, path: string): Promise<string | null> {
  try {
    if (!path) return null

    const client = getStorageClient()
    const { data } = client.storage.from(bucket).getPublicUrl(path)

    return data.publicUrl
  } catch (error) {
    console.error("Error en getFileUrl:", error)
    return null
  }
}

/**
 * Elimina un archivo del almacenamiento
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    if (!path) return false

    const client = getStorageClient()
    const { error } = await client.storage.from(bucket).remove([path])

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
 * Lista los archivos en un bucket para un usuario específico
 */
export async function listUserFiles(bucket: string, userId: string): Promise<string[]> {
  try {
    const client = getStorageClient()
    const { data, error } = await client.storage.from(bucket).list(`${userId}/`)

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
