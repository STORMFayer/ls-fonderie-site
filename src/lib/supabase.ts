import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export type Role = 'admin' | 'employe'
export type OrderType = 'legal' | 'black'
export type OrderStatut = 'en_attente' | 'en_cours' | 'livree' | 'annulee'
export type JournalCategory = 'commande' | 'paiement' | 'alerte' | 'avance' | 'reset'

export interface Employee {
  id: string
  full_name: string
  role: Role
  discord: string | null
  total_minerais: number
  total_paid: number
  created_at: string
}

export interface Price {
  key: string
  type: 'mineral' | 'legal' | 'black'
  label: string
  price: number
}

export interface OrderItem {
  key: string
  label: string
  qty: number
  price: number
}

export interface Order {
  id: number
  numero: string
  nom: string
  contact: string
  items: OrderItem[]
  total: number
  type: OrderType
  statut: OrderStatut
  message: string
  created_at: string
}

export interface Submission {
  id: number
  employee_id: string
  minerais: number
  created_at: string
}

export interface JournalEntry {
  id: number
  category: JournalCategory
  action: string
  details: string
  utilisateur: string
  created_at: string
}

export type NoteCategory = 'general' | 'avertissement' | 'rendement'

export interface EmployeeNote {
  id: number
  employee_id: string
  category: NoteCategory
  content: string
  author: string
  created_at: string
}

export const QUOTA_HEBDO = 1600
export const MAX_AVANCE = 20000
