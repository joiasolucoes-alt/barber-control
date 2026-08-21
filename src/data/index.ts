import { LocalRepository } from '@/data/local-repository'
import type { BarberRepository } from '@/data/repository'
import { supabaseConfigurado } from '@/data/supabase-client'
import { SupabaseRepository } from '@/data/supabase-repository'

/**
 * Ponto único de escolha da fonte de dados.
 * Basta preencher o `.env` com as credenciais para migrar do mock ao Supabase.
 */
export const repository: BarberRepository = supabaseConfigurado
  ? new SupabaseRepository()
  : new LocalRepository()

export const usandoSupabase = supabaseConfigurado

export type { BarberRepository }
