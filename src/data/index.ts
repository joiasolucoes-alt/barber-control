import { LocalRepository } from '@/data/local-repository'
import type { BarberRepository } from '@/data/repository'

/**
 * Ponto único de escolha da fonte de dados.
 * Sem credenciais do Supabase, os dados começam vazios e ficam neste aparelho.
 */
export const usandoSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const repositoryPromise: Promise<BarberRepository> = usandoSupabase
  ? import('@/data/supabase-repository').then(({ SupabaseRepository }) => new SupabaseRepository())
  : Promise.resolve(new LocalRepository())

/** O módulo pesado do Supabase só é baixado quando a conexão estiver configurada. */
export function obterRepository(): Promise<BarberRepository> {
  return repositoryPromise
}

export type { BarberRepository }
