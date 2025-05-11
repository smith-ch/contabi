import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export const createClientSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Faltan las variables de entorno de Supabase")
    // Devolver un cliente con valores vacíos para evitar errores de null
    return createClient("https://placeholder-url.supabase.co", "placeholder-key")
  }

  try {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (...args) => {
          return fetch(...args)
        },
      },
    })
    return supabaseClient
  } catch (error) {
    console.error("Error al crear cliente de Supabase:", error)
    // Devolver un cliente con valores vacíos para evitar errores de null
    return createClient("https://placeholder-url.supabase.co", "placeholder-key")
  }
}

// Función para verificar la conexión con Supabase
export const checkSupabaseConnection = async () => {
  try {
    const supabase = createClientSupabaseClient()
    const { error } = await supabase.from("users").select("count").limit(1)
    return { success: !error, error: error?.message }
  } catch (error) {
    return { success: false, error: "Error al conectar con Supabase" }
  }
}
