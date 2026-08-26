import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Indica se as credenciais do Supabase estão configuradas neste ambiente. */
export const supabaseConfigurado = Boolean(url && anonKey)

let cliente: SupabaseClient | null = null

export function obterSupabase(): SupabaseClient {
  if (!supabaseConfigurado) {
    throw new Error('A conexão com a base de dados não está disponível neste ambiente.')
  }
  if (!cliente) {
    cliente = createClient(url as string, anonKey as string)
  }
  return cliente
}
