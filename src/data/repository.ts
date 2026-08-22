import type {
  Cliente,
  ClienteInput,
  Servico,
  ServicoInput,
  StatusRegistro,
  VisitaDetalhada,
  VisitaInput,
} from '@/types'

/**
 * Contrato único da camada de dados.
 *
 * A UI nunca conhece a origem dos dados: hoje o `LocalRepository` (mock +
 * localStorage) implementa este contrato e o `SupabaseRepository` assume o
 * lugar assim que as variáveis de ambiente forem preenchidas.
 */
export interface BarberRepository {
  readonly nome: string

  listarClientes(): Promise<Cliente[]>
  criarCliente(input: ClienteInput): Promise<Cliente>
  atualizarCliente(id: string, input: ClienteInput): Promise<Cliente>
  alterarStatusCliente(id: string, status: StatusRegistro): Promise<Cliente>
  excluirCliente(id: string): Promise<void>

  listarServicos(): Promise<Servico[]>
  criarServico(input: ServicoInput): Promise<Servico>
  atualizarServico(id: string, input: ServicoInput): Promise<Servico>
  alterarStatusServico(id: string, status: StatusRegistro): Promise<Servico>
  excluirServico(id: string): Promise<void>

  listarVisitas(): Promise<VisitaDetalhada[]>
  criarVisita(input: VisitaInput): Promise<VisitaDetalhada>
  atualizarVisita(id: string, input: VisitaInput): Promise<VisitaDetalhada>
  excluirVisita(id: string): Promise<void>
}

export class RepositoryError extends Error {
  constructor(mensagem: string, readonly causa?: unknown) {
    super(mensagem)
    this.name = 'RepositoryError'
  }
}

export function novoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export function agora(): string {
  return new Date().toISOString()
}
