import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export interface Employee {
  id: string
  full_name: string
  role: string
  created_at: string
}

export interface Order {
  id: number
  client_name: string
  product: string
  amount: number
  status: string
  created_at: string
}
