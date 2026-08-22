/**
 * Modelo de dominio do Barber Control.
 *
 * Os nomes dos campos seguem exatamente o schema do banco (snake_case em
 * portugues), para que a troca do repositorio local pelo Supabase nao exija
 * nenhuma conversao adicional.
 */

export type StatusRegistro = 'ativo' | 'inativo'

/** Data no formato ISO curto: YYYY-MM-DD. */
export type DataISO = string

/** Timestamp ISO completo. */
export type TimestampISO = string

export interface Cliente {
  id: string
  nome: string
  /** Telefone/WhatsApp — opcional. */
  telefone: string | null
  data_nascimento: DataISO | null
  observacoes: string | null
  status: StatusRegistro
  created_at: TimestampISO
  updated_at: TimestampISO
}

export interface Servico {
  id: string
  nome: string
  descricao: string | null
  /** Preco em reais. */
  preco: number | null
  /** Duracao estimada em minutos. */
  duracao_estimada: number | null
  status: StatusRegistro
  created_at: TimestampISO
  updated_at: TimestampISO
}

export interface Visita {
  id: string
  cliente_id: string
  /** Data do atendimento que ja aconteceu. */
  data_atendimento: DataISO
  observacoes: string | null
  created_at: TimestampISO
  updated_at: TimestampISO
}

export interface VisitaServico {
  id: string
  visita_id: string
  servico_id: string
}

/** Visita com cliente e servicos ja resolvidos, usada nas telas. */
export interface VisitaDetalhada extends Visita {
  cliente: Cliente
  servicos: Servico[]
}

export type ClienteInput = {
  nome: string
  telefone?: string | null
  data_nascimento?: DataISO | null
  observacoes?: string | null
  status?: StatusRegistro
}

export type ServicoInput = {
  nome: string
  descricao?: string | null
  preco?: number | null
  duracao_estimada?: number | null
  status?: StatusRegistro
}

export type VisitaInput = {
  cliente_id: string
  data_atendimento: DataISO
  observacoes?: string | null
  servico_ids: string[]
}
