export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          rnc: string
          address: string
          phone: string
          email: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          rnc: string
          address?: string
          phone?: string
          email?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          rnc?: string
          address?: string
          phone?: string
          email?: string
          user_id?: string
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          client_id: string
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: "pendiente" | "parcialmente pagada" | "pagada" | "vencida" | "cancelada"
          notes: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          client_id: string
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: "pendiente" | "parcialmente pagada" | "pagada" | "vencida" | "cancelada"
          notes?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          client_id?: string
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          status?: "pendiente" | "parcialmente pagada" | "pagada" | "vencida" | "cancelada"
          notes?: string | null
          user_id?: string
          created_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          price: number
          amount: number
          taxable: boolean
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          price: number
          amount: number
          taxable: boolean
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          price?: number
          amount?: number
          taxable?: boolean
          created_at?: string
        }
      }
    }
  }
}
