"use server"
import { redirect } from "next/navigation"

export async function auth() {
  const supabase = createServerSupabaseClient()
  try {
    await supabase.auth.getSession()
  } catch (e) {
    console.error("Error:", e)
    return redirect("/")
  }

  return supabase.auth.getSession()
}

import { createServerSupabaseClient } from "@/lib/supabase/server"
