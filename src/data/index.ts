import { LocalRepository } from '@/data/local-repository'
import type { BarberRepository } from '@/data/repository'
import { supabaseConfigurado } from '@/data/supabase-client'
import { SupabaseRepository } from '@/data/supabase-repository'

/**
 * Ponto único de escolha da fonte de dados.
 * Sem credenciais do Supabase, os dados começam vazios e ficam neste aparelho.
 */
export const repository: BarberRepository = supabaseConfigurado
  ? new SupabaseRepository()
  : new LocalRepository()

export const usandoSupabase = supabaseConfigurado

export type { BarberRepository }
