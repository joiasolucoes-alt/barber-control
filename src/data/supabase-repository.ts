import { z } from 'zod'

import { RepositoryError, type BarberRepository } from '@/data/repository'
import { obterSupabase } from '@/data/supabase-client'
import type {
  Cliente,
  ClienteInput,
  Servico,
  ServicoInput,
  ServicoRealizado,
  StatusRegistro,
  VisitaDetalhada,
  VisitaInput,
} from '@/types'

const statusSchema = z.enum(['ativo', 'inativo'])
const clienteRegistroSchema: z.ZodType<Cliente> = z.object({
  id: z.string(),
  nome: z.string(),
  telefone: z.string().nullable(),
  data_nascimento: z.string().nullable(),
  observacoes: z.string().nullable(),
  status: statusSchema,
  created_at: z.string(),
  updated_at: z.string(),
})
const servicoRegistroSchema: z.ZodType<Servico> = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  preco: z.coerce.number().nullable(),
  duracao_estimada: z.coerce.number().nullable(),
  status: statusSchema,
  created_at: z.string(),
  updated_at: z.string(),
})
const visitaRegistroSchema = z.object({
  id: z.string(),
  cliente_id: z.string(),
  data_atendimento: z.string(),
  observacoes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
const visitaComRelacoesSchema = visitaRegistroSchema.extend({
  cliente: clienteRegistroSchema.nullable(),
  visita_servicos: z
    .array(
      z.object({
        preco_cobrado: z.coerce.number().nullable(),
        servico: servicoRegistroSchema.nullable(),
      }),
    )
    .nullable(),
})

type VisitaComRelacoes = z.infer<typeof visitaComRelacoesSchema>

const SELECT_VISITA = `
  id, cliente_id, data_atendimento, observacoes, created_at, updated_at,
  cliente:clientes(*),
  visita_servicos:visita_servicos(preco_cobrado, servico:servicos(*))
`

const TAMANHO_PAGINA = 1000

function validarResposta<T>(schema: z.ZodType<T>, dados: unknown, mensagem: string): T {
  const resultado = schema.safeParse(dados)
  if (!resultado.success) throw new RepositoryError(mensagem, resultado.error)
  return resultado.data
}

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
    if (!registro.cliente) {
      throw new RepositoryError('A visita está vinculada a um cliente inexistente.')
    }

    const servicos = (registro.visita_servicos ?? [])
      .map((vinculo) =>
        vinculo.servico ? { ...vinculo.servico, preco_cobrado: vinculo.preco_cobrado } : null,
      )
      .filter((servico): servico is ServicoRealizado => Boolean(servico))

    return {
      id: registro.id,
      cliente_id: registro.cliente_id,
      data_atendimento: registro.data_atendimento,
      observacoes: registro.observacoes,
      created_at: registro.created_at,
      updated_at: registro.updated_at,
      cliente: registro.cliente,
      servicos,
    }
  }

  private async buscarVisita(id: string): Promise<VisitaDetalhada> {
    const { data, error } = await this.db.from('visitas').select(SELECT_VISITA).eq('id', id).single()
    if (error) throw new RepositoryError('Não foi possível carregar a visita.', error)
    return this.mapearVisita(validarResposta(visitaComRelacoesSchema, data, 'A visita recebida é inválida.'))
  }

  private async sincronizarServicos(
    visitaId: string,
    servicoIds: string[],
    precosCobrados: Record<string, number | null> = {},
  ) {
    const idsDesejados = [...new Set(servicoIds)]
    const { data: vinculosAtuais, error: erroLeitura } = await this.db
      .from('visita_servicos')
      .select('servico_id')
      .eq('visita_id', visitaId)
    if (erroLeitura) throw new RepositoryError('Não foi possível conferir os serviços da visita.', erroLeitura)

    const vinculos = validarResposta(
      z.array(z.object({ servico_id: z.string() })),
      vinculosAtuais ?? [],
      'Os vínculos de serviços recebidos são inválidos.',
    )
    const idsAtuais = new Set(vinculos.map((vinculo) => vinculo.servico_id))
    const paraAdicionar = idsDesejados.filter((id) => !idsAtuais.has(id))
    const paraRemover = [...idsAtuais].filter((id) => !idsDesejados.includes(id))

    // Adiciona primeiro: uma falha nunca apaga os vínculos que já existiam.
    if (paraAdicionar.length > 0) {
      const { data: servicos, error: erroServicos } = await this.db
        .from('servicos')
        .select('id, preco')
        .in('id', paraAdicionar)
      if (erroServicos) throw new RepositoryError('Não foi possível consultar os preços dos serviços.', erroServicos)

      const precos = validarResposta(
        z.array(z.object({ id: z.string(), preco: z.coerce.number().nullable() })),
        servicos ?? [],
        'Os preços dos serviços recebidos são inválidos.',
      )
      if (precos.length !== paraAdicionar.length) {
        throw new RepositoryError('Um dos serviços selecionados não existe mais.')
      }
      const precoPorServico = new Map(precos.map((servico) => [servico.id, servico.preco]))

      const { error } = await this.db
        .from('visita_servicos')
        .insert(
          paraAdicionar.map((servicoId) => ({
            visita_id: visitaId,
            servico_id: servicoId,
            preco_cobrado: Object.hasOwn(precosCobrados, servicoId)
              ? precosCobrados[servicoId]
              : (precoPorServico.get(servicoId) ?? null),
          })),
        )
      if (error) throw new RepositoryError('Não foi possível vincular os serviços à visita.', error)
    }

    if (paraRemover.length > 0) {
      const { error } = await this.db
        .from('visita_servicos')
        .delete()
        .eq('visita_id', visitaId)
        .in('servico_id', paraRemover)
      if (error) throw new RepositoryError('Não foi possível remover serviços antigos da visita.', error)
    }

    const paraAtualizar = idsDesejados.filter(
      (servicoId) => idsAtuais.has(servicoId) && Object.hasOwn(precosCobrados, servicoId),
    )
    if (paraAtualizar.length > 0) {
      const resultados = await Promise.all(
        paraAtualizar.map((servicoId) =>
          this.db
            .from('visita_servicos')
            .update({ preco_cobrado: precosCobrados[servicoId] })
            .eq('visita_id', visitaId)
            .eq('servico_id', servicoId),
        ),
      )
      const falha = resultados.find((resultado) => resultado.error)
      if (falha?.error) throw new RepositoryError('Não foi possível atualizar o valor cobrado.', falha.error)
    }
  }

  async listarClientes(): Promise<Cliente[]> {
    const { data, error } = await this.db.from('clientes').select('*').order('nome')
    if (error) throw new RepositoryError('Não foi possível carregar os clientes.', error)
    return validarResposta(z.array(clienteRegistroSchema), data ?? [], 'Os clientes recebidos são inválidos.')
  }

  async criarCliente(input: ClienteInput): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .insert({ ...input, status: input.status ?? 'ativo' })
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível cadastrar o cliente.', error)
    return validarResposta(clienteRegistroSchema, data, 'O cliente salvo é inválido.')
  }

  async atualizarCliente(id: string, input: ClienteInput): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível atualizar o cliente.', error)
    return validarResposta(clienteRegistroSchema, data, 'O cliente atualizado é inválido.')
  }

  async alterarStatusCliente(id: string, status: StatusRegistro): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível alterar o status do cliente.', error)
    return validarResposta(clienteRegistroSchema, data, 'O cliente atualizado é inválido.')
  }

  async excluirCliente(id: string): Promise<void> {
    const { count, error: erroContagem } = await this.db
      .from('visitas')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', id)
    if (erroContagem) throw new RepositoryError('Não foi possível verificar o histórico do cliente.', erroContagem)
    if ((count ?? 0) > 0) {
      throw new RepositoryError('Este cliente possui atendimentos. Inative-o para preservar o histórico.')
    }

    const { error } = await this.db.from('clientes').delete().eq('id', id)
    if (error) throw new RepositoryError('Não foi possível excluir o cliente.', error)
  }

  async listarServicos(): Promise<Servico[]> {
    const { data, error } = await this.db.from('servicos').select('*').order('nome')
    if (error) throw new RepositoryError('Não foi possível carregar os serviços.', error)
    return validarResposta(z.array(servicoRegistroSchema), data ?? [], 'Os serviços recebidos são inválidos.')
  }

  async criarServico(input: ServicoInput): Promise<Servico> {
    const { data, error } = await this.db
      .from('servicos')
      .insert({ ...input, status: input.status ?? 'ativo' })
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível cadastrar o serviço.', error)
    return validarResposta(servicoRegistroSchema, data, 'O serviço salvo é inválido.')
  }

  async atualizarServico(id: string, input: ServicoInput): Promise<Servico> {
    const { data, error } = await this.db
      .from('servicos')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível atualizar o serviço.', error)
    return validarResposta(servicoRegistroSchema, data, 'O serviço atualizado é inválido.')
  }

  async alterarStatusServico(id: string, status: StatusRegistro): Promise<Servico> {
    const { data, error } = await this.db
      .from('servicos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new RepositoryError('Não foi possível alterar o status do serviço.', error)
    return validarResposta(servicoRegistroSchema, data, 'O serviço atualizado é inválido.')
  }

  async excluirServico(id: string): Promise<void> {
    const { count, error: erroContagem } = await this.db
      .from('visita_servicos')
      .select('id', { count: 'exact', head: true })
      .eq('servico_id', id)
    if (erroContagem) throw new RepositoryError('Não foi possível verificar o histórico do serviço.', erroContagem)
    if ((count ?? 0) > 0) {
      throw new RepositoryError('Este serviço possui atendimentos. Inative-o para preservar o histórico.')
    }

    const { error } = await this.db.from('servicos').delete().eq('id', id)
    if (error) throw new RepositoryError('Não foi possível excluir o serviço.', error)
  }

  async listarVisitas(): Promise<VisitaDetalhada[]> {
    const registros: VisitaComRelacoes[] = []
    let inicio = 0
    let totalEsperado: number | null = null

    // O Data API limita a quantidade de linhas por resposta. Paginar mantém os
    // indicadores históricos corretos mesmo depois de milhares de visitas.
    while (totalEsperado === null || registros.length < totalEsperado) {
      const { data, error, count } = await this.db
        .from('visitas')
        .select(SELECT_VISITA, { count: 'exact' })
        .order('data_atendimento', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(inicio, inicio + TAMANHO_PAGINA - 1)

      if (error) throw new RepositoryError('Não foi possível carregar as visitas.', error)

      const pagina = validarResposta(
        z.array(visitaComRelacoesSchema),
        data ?? [],
        'As visitas recebidas são inválidas.',
      )
      if (totalEsperado === null && count !== null) totalEsperado = count
      if (pagina.length === 0) break

      registros.push(...pagina)
      inicio += pagina.length

      // Fallback para projetos que não devolvem contagem no cabeçalho.
      if (totalEsperado === null && pagina.length < TAMANHO_PAGINA) break
    }

    return registros.map((registro) => this.mapearVisita(registro))
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

    const visitaId = validarResposta(z.object({ id: z.string() }), data, 'A visita salva é inválida.').id
    try {
      await this.sincronizarServicos(visitaId, input.servico_ids, input.precos_cobrados)
      return await this.buscarVisita(visitaId)
    } catch (falha) {
      // Evita deixar uma visita incompleta quando o vínculo dos serviços falha.
      await this.db.from('visitas').delete().eq('id', visitaId)
      throw falha
    }
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

    await this.sincronizarServicos(id, input.servico_ids, input.precos_cobrados)
    return this.buscarVisita(id)
  }

  async excluirVisita(id: string): Promise<void> {
    const { error } = await this.db.from('visitas').delete().eq('id', id)
    if (error) throw new RepositoryError('Não foi possível excluir a visita.', error)
  }
}
