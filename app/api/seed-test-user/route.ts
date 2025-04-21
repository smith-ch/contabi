import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Verificar si ya existe algún usuario
    const { count, error: countError } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`Error al verificar usuarios existentes: ${countError.message}`)
    }

    // Si ya hay usuarios, no crear uno nuevo
    if (count && count > 0) {
      return NextResponse.json({
        success: true,
        message: "Ya existen usuarios en el sistema",
        created: false,
      })
    }

    // Crear usuario de prueba
    const testUser = {
      name: "Usuario de Prueba",
      email: "test@example.com",
      password: "password123",
      company: "Empresa de Prueba S.R.L.",
      rnc: "123456789",
      address: "Calle Principal #123, Santo Domingo",
      phone: "+1809555-1234",
    }

    const { data, error } = await supabaseAdmin.from("users").insert(testUser).select()

    if (error) {
      throw new Error(`Error al crear usuario de prueba: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Usuario de prueba creado exitosamente",
      created: true,
      user: {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
      },
    })
  } catch (error: any) {
    console.error("Error en seed-test-user:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Error al crear usuario de prueba",
      },
      { status: 500 },
    )
  }
}
