import { createClient } from "@supabase/supabase-js"

// Environment variables are already available in the application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Client-side Supabase client (limited permissions)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with admin privileges (for server components and server actions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Type definitions for our database
export type Tables = {
  users: {
    id: string
    name: string
    email: string
    password: string
    company: string | null
    rnc: string | null
    address: string | null
    phone: string | null
    created_at: string
  }
  clients: {
    id: string
    user_id: string
    name: string
    rnc: string
    address: string | null
    email: string | null
    phone: string | null
    created_at: string
  }
  invoices: {
    id: string
    user_id: string
    client_id: string
    invoice_number: string
    date: string
    due_date: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    status: "pending" | "paid" | "overdue" | "cancelled"
    notes: string | null
    created_at: string
  }
  invoice_items: {
    id: string
    invoice_id: string
    description: string
    quantity: number
    price: number
    taxable: boolean
    amount: number
    created_at: string
  }
  expenses: {
    id: string
    user_id: string
    category: string
    description: string
    amount: number
    date: string
    receipt: string | null
    created_at: string
  }
  notifications: {
    id: string
    user_id: string
    title: string
    message: string
    type: "info" | "warning" | "success" | "error"
    related_id: string | null
    related_type: string | null
    read: boolean
    created_at: string
  }
}
