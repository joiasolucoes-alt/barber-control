import { agora, novoId, type BarberRepository } from '@/data/repository'
import { gerarBaseSimulada, type BaseSimulada } from '@/data/seed'
import type {
  Cliente,
  ClienteInput,
  Servico,
  ServicoInput,
  StatusRegistro,
  Visita,
  VisitaDetalhada,
  VisitaInput,
  VisitaServico,
} from '@/types'

const CHAVE_STORAGE = 'barber-control:v1'
/** Pequena latência artificial para exercitar os estados de carregamento. */
const LATENCIA_MS = 180

function esperar<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), LATENCIA_MS))
}

function persistir(base: BaseSimulada): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(base))
  } catch {
    // Sem persistência (modo privado, cota cheia): a sessão continua em memória.
  }
}

function carregar(): BaseSimulada {
  if (typeof window === 'undefined') return gerarBaseSimulada()
  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE)
    if (bruto) {
      const dados = JSON.parse(bruto) as BaseSimulada
      if (dados.clientes && dados.servicos && dados.visitas && dados.visitaServicos) {
        return dados
      }
    }
  } catch {
    // Storage corrompido ou indisponível: recomeça a partir da base simulada.
  }
  const base = gerarBaseSimulada()
  persistir(base)
  return base
}

/**
 * Repositório local: mantém a base simulada em `localStorage`.
 * Implementação padrão enquanto o Supabase não está conectado.
 */
export class LocalRepository implements BarberRepository {
  readonly nome = 'Dados locais (demonstração)'

  private base: BaseSimulada

  constructor() {
    this.base = carregar()
  }

  private salvar() {
    persistir(this.base)
  }

  private detalhar(visita: Visita): VisitaDetalhada {
    const cliente = this.base.clientes.find((item) => item.id === visita.cliente_id)
    const vinculos = this.base.visitaServicos.filter((item) => item.visita_id === visita.id)
    const servicos = vinculos
      .map((vinculo) => this.base.servicos.find((servico) => servico.id === vinculo.servico_id))
      .filter((servico): servico is Servico => Boolean(servico))

    return {
      ...visita,
      cliente: cliente ?? {
        id: visita.cliente_id,
        nome: 'Cliente removido',
        telefone: null,
        data_nascimento: null,
        observacoes: null,
        status: 'inativo',
        created_at: visita.created_at,
        updated_at: visita.updated_at,
      },
      servicos,
    }
  }

  private trocarServicos(visitaId: string, servicoIds: string[]) {
    this.base.visitaServicos = this.base.visitaServicos.filter((item) => item.visita_id !== visitaId)
    const novos: VisitaServico[] = servicoIds.map((servicoId) => ({
      id: novoId(),
      visita_id: visitaId,
      servico_id: servicoId,
    }))
    this.base.visitaServicos.push(...novos)
  }

  async listarClientes(): Promise<Cliente[]> {
    return esperar([...this.base.clientes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
  }

  async criarCliente(input: ClienteInput): Promise<Cliente> {
    const timestamp = agora()
    const cliente: Cliente = {
      id: novoId(),
      nome: input.nome.trim(),
      telefone: input.telefone?.trim() || null,
      data_nascimento: input.data_nascimento || null,
      observacoes: input.observacoes?.trim() || null,
      status: input.status ?? 'ativo',
      created_at: timestamp,
      updated_at: timestamp,
    }
    this.base.clientes.push(cliente)
    this.salvar()
    return esperar(cliente)
  }

  async atualizarCliente(id: string, input: ClienteInput): Promise<Cliente> {
    const indice = this.base.clientes.findIndex((cliente) => cliente.id === id)
    if (indice < 0) throw new Error('Cliente não encontrado.')
    const atual = this.base.clientes[indice]
    const atualizado: Cliente = {
      ...atual,
      nome: input.nome.trim(),
      telefone: input.telefone?.trim() || null,
      data_nascimento: input.data_nascimento || null,
      observacoes: input.observacoes?.trim() || null,
      status: input.status ?? atual.status,
      updated_at: agora(),
    }
    this.base.clientes[indice] = atualizado
    this.salvar()
    return esperar(atualizado)
  }

  async alterarStatusCliente(id: string, status: StatusRegistro): Promise<Cliente> {
    const indice = this.base.clientes.findIndex((cliente) => cliente.id === id)
    if (indice < 0) throw new Error('Cliente não encontrado.')
    const atualizado = { ...this.base.clientes[indice], status, updated_at: agora() }
    this.base.clientes[indice] = atualizado
    this.salvar()
    return esperar(atualizado)
  }

  async listarServicos(): Promise<Servico[]> {
    return esperar([...this.base.servicos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
  }

  async criarServico(input: ServicoInput): Promise<Servico> {
    const timestamp = agora()
    const servico: Servico = {
      id: novoId(),
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      preco: input.preco ?? null,
      duracao_estimada: input.duracao_estimada ?? null,
      status: input.status ?? 'ativo',
      created_at: timestamp,
      updated_at: timestamp,
    }
    this.base.servicos.push(servico)
    this.salvar()
    return esperar(servico)
  }

  async atualizarServico(id: string, input: ServicoInput): Promise<Servico> {
    const indice = this.base.servicos.findIndex((servico) => servico.id === id)
    if (indice < 0) throw new Error('Serviço não encontrado.')
    const atual = this.base.servicos[indice]
    const atualizado: Servico = {
      ...atual,
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      preco: input.preco ?? null,
      duracao_estimada: input.duracao_estimada ?? null,
      status: input.status ?? atual.status,
      updated_at: agora(),
    }
    this.base.servicos[indice] = atualizado
    this.salvar()
    return esperar(atualizado)
  }

  async alterarStatusServico(id: string, status: StatusRegistro): Promise<Servico> {
    const indice = this.base.servicos.findIndex((servico) => servico.id === id)
    if (indice < 0) throw new Error('Serviço não encontrado.')
    const atualizado = { ...this.base.servicos[indice], status, updated_at: agora() }
    this.base.servicos[indice] = atualizado
    this.salvar()
    return esperar(atualizado)
  }

  async listarVisitas(): Promise<VisitaDetalhada[]> {
    const detalhadas = this.base.visitas
      .map((visita) => this.detalhar(visita))
      .sort((a, b) => {
        if (a.data_atendimento === b.data_atendimento) {
          return b.created_at.localeCompare(a.created_at)
        }
        return b.data_atendimento.localeCompare(a.data_atendimento)
      })
    return esperar(detalhadas)
  }

  async criarVisita(input: VisitaInput): Promise<VisitaDetalhada> {
    const timestamp = agora()
    const visita: Visita = {
      id: novoId(),
      cliente_id: input.cliente_id,
      data_atendimento: input.data_atendimento,
      observacoes: input.observacoes?.trim() || null,
      created_at: timestamp,
      updated_at: timestamp,
    }
    this.base.visitas.push(visita)
    this.trocarServicos(visita.id, input.servico_ids)
    this.salvar()
    return esperar(this.detalhar(visita))
  }

  async atualizarVisita(id: string, input: VisitaInput): Promise<VisitaDetalhada> {
    const indice = this.base.visitas.findIndex((visita) => visita.id === id)
    if (indice < 0) throw new Error('Visita não encontrada.')
    const atualizada: Visita = {
      ...this.base.visitas[indice],
      cliente_id: input.cliente_id,
      data_atendimento: input.data_atendimento,
      observacoes: input.observacoes?.trim() || null,
      updated_at: agora(),
    }
    this.base.visitas[indice] = atualizada
    this.trocarServicos(id, input.servico_ids)
    this.salvar()
    return esperar(this.detalhar(atualizada))
  }

  async excluirVisita(id: string): Promise<void> {
    this.base.visitas = this.base.visitas.filter((visita) => visita.id !== id)
    this.base.visitaServicos = this.base.visitaServicos.filter((item) => item.visita_id !== id)
    this.salvar()
    return esperar(undefined)
  }
}

/** Utilitário exposto na UI para recriar a base de demonstração. */
export function reiniciarBaseLocal(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAVE_STORAGE)
}
