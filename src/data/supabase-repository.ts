import { RepositoryError, type BarberRepository } from '@/data/repository'
import { obterSupabase } from '@/data/supabase-client'
import type {
  Cliente,
  ClienteInput,
  Servico,
  ServicoInput,
  StatusRegistro,
  Visita,
  VisitaDetalhada,
  VisitaInput,
} from '@/types'

type VisitaComRelacoes = Visita & {
  cliente: Cliente | null
  visita_servicos: Array<{ servico: Servico | null }> | null
}

const SELECT_VISITA = `
  id, cliente_id, data_atendimento, observacoes, created_at, updated_at,
  cliente:clientes(*),
  visita_servicos:visita_servicos(servico:servicos(*))
`

/**
 * Implementação do mesmo contrato usando Supabase (Postgres).
 * Ativa automaticamente quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY existem.
 * O schema correspondente está em `supabase/schema.sql`.
 */
export class SupabaseRepository implements BarberRepository {
  readonly nome = 'Supabase'

  private get db() {
    return obterSupabase()
  }

  private mapearVisita(registro: VisitaComRelacoes): VisitaDetalhada {
    const servicos = (registro.visita_servicos ?? [])
      .map((vinculo) => vinculo.servico)
      .filter((servico): servico is Servico => Boolean(servico))

    return {
      id: registro.id,
      cliente_id: registro.cliente_id,
      data_atendimento: registro.data_atendimento,
      observacoes: registro.observacoes,
      created_at: registro.created_at,
      updated_at: registro.updated_at,
      cliente: registro.cliente as Cliente,
      servicos,
    }
  }

  private async buscarVisita(id: string): Promise<VisitaDetalhada> {
    const { data, error } = await this.db.from('visitas').select(SELECT_VISITA).eq('id', id).single()
    if (error) throw new RepositoryError('Não foi possível carregar a visita.', error)
    return this.mapearVisita(data as unknown as VisitaComRelacoes)
  }

  private async sincronizarServicos(visitaId: string, servicoIds: string[]) {
    const { error: erroRemocao } = await this.db.from('visita_servicos').delete().eq('visita_id', visitaId)
    if (erroRemocao) throw new RepositoryError('Não foi possível atualizar os serviços da visita.', erroRemocao)

    if (servicoIds.length === 0) return

    const { error } = await this.db
      .from('visita_servicos')
      .insert(servicoIds.map((servicoId) => ({ visita_id: visitaId, servico_id: servicoId })))
    if (error) throw new RepositoryError('Não foi possível vincular os serviços à visita.', error)
  }

  async listarClientes(): Promise<Cliente[]> {
    const { data, error } = await this.db.from('clientes').select('*').order('nome')
    if (error) throw new RepositoryError('Não foi possível carregar os clientes.', error)
    return data as Cliente[]
  }

  async criarCliente(input: ClienteInput): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .insert({ ...input, status: input.status ?? 'ativo' })
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível cadastrar o cliente.', error)
    return data as Cliente
  }

  async atualizarCliente(id: string, input: ClienteInput): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível atualizar o cliente.', error)
    return data as Cliente
  }

  async alterarStatusCliente(id: string, status: StatusRegistro): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível alterar o status do cliente.', error)
    return data as Cliente
  }

  async listarServicos(): Promise<Servico[]> {
    const { data, error } = await this.db.from('servicos').select('*').order('nome')
    if (error) throw new RepositoryError('Não foi possível carregar os serviços.', error)
    return data as Servico[]
  }

  async criarServico(input: ServicoInput): Promise<Servico> {
    const { data, error } = await this.db
      .from('servicos')
      .insert({ ...input, status: input.status ?? 'ativo' })
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível cadastrar o serviço.', error)
    return data as Servico
  }

  async atualizarServico(id: string, input: ServicoInput): Promise<Servico> {
    const { data, error } = await this.db
      .from('servicos')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível atualizar o serviço.', error)
    return data as Servico
  }

  async alterarStatusServico(id: string, status: StatusRegistro): Promise<Servico> {
    const { data, error } = await this.db
      .from('servicos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível alterar o status do serviço.', error)
    return data as Servico
  }

  async listarVisitas(): Promise<VisitaDetalhada[]> {
    const { data, error } = await this.db
      .from('visitas')
      .select(SELECT_VISITA)
      .order('data_atendimento', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw new RepositoryError('Não foi possível carregar as visitas.', error)
    return (data as unknown as VisitaComRelacoes[]).map((registro) => this.mapearVisita(registro))
  }

  async criarVisita(input: VisitaInput): Promise<VisitaDetalhada> {
    const { data, error } = await this.db
      .from('visitas')
      .insert({
        cliente_id: input.cliente_id,
        data_atendimento: input.data_atendimento,
        observacoes: input.observacoes ?? null,
      })
      .select('id')
      .single()
    if (error) throw new RepositoryError('Não foi possível registrar a visita.', error)

    await this.sincronizarServicos(data.id as string, input.servico_ids)
    return this.buscarVisita(data.id as string)
  }

  async atualizarVisita(id: string, input: VisitaInput): Promise<VisitaDetalhada> {
    const { error } = await this.db
      .from('visitas')
      .update({
        cliente_id: input.cliente_id,
        data_atendimento: input.data_atendimento,
        observacoes: input.observacoes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw new RepositoryError('Não foi possível atualizar a visita.', error)

    await this.sincronizarServicos(id, input.servico_ids)
    return this.buscarVisita(id)
  }

  async excluirVisita(id: string): Promise<void> {
    const { error } = await this.db.from('visitas').delete().eq('id', id)
    if (error) throw new RepositoryError('Não foi possível excluir a visita.', error)
  }
}
