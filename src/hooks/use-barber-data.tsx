import * as React from 'react'

import { repository, usandoSupabase } from '@/data'
import type {
  Cliente,
  ClienteInput,
  Servico,
  ServicoInput,
  StatusRegistro,
  VisitaDetalhada,
  VisitaInput,
} from '@/types'

interface EstadoDados {
  clientes: Cliente[]
  servicos: Servico[]
  visitas: VisitaDetalhada[]
  carregando: boolean
  erro: string | null
}

interface ContextoDados extends EstadoDados {
  fonte: string
  usandoSupabase: boolean
  recarregar: () => Promise<void>
  criarCliente: (input: ClienteInput) => Promise<Cliente>
  atualizarCliente: (id: string, input: ClienteInput) => Promise<Cliente>
  alterarStatusCliente: (id: string, status: StatusRegistro) => Promise<Cliente>
  excluirCliente: (id: string) => Promise<void>
  criarServico: (input: ServicoInput) => Promise<Servico>
  atualizarServico: (id: string, input: ServicoInput) => Promise<Servico>
  alterarStatusServico: (id: string, status: StatusRegistro) => Promise<Servico>
  excluirServico: (id: string) => Promise<void>
  criarVisita: (input: VisitaInput) => Promise<VisitaDetalhada>
  atualizarVisita: (id: string, input: VisitaInput) => Promise<VisitaDetalhada>
  excluirVisita: (id: string) => Promise<void>
}

const BarberDataContext = React.createContext<ContextoDados | null>(null)

const ESTADO_INICIAL: EstadoDados = {
  clientes: [],
  servicos: [],
  visitas: [],
  carregando: true,
  erro: null,
}

/**
 * Estado global da aplicação. Carrega tudo uma vez e mantém a base em memória;
 * as mutações delegam ao repositório e recarregam apenas o que mudou.
 */
export function BarberDataProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = React.useState<EstadoDados>(ESTADO_INICIAL)

  const carregarTudo = React.useCallback(async () => {
    setEstado((anterior) => ({ ...anterior, carregando: true, erro: null }))
    try {
      const [clientes, servicos, visitas] = await Promise.all([
        repository.listarClientes(),
        repository.listarServicos(),
        repository.listarVisitas(),
      ])
      setEstado({ clientes, servicos, visitas, carregando: false, erro: null })
    } catch (erro) {
      setEstado((anterior) => ({
        ...anterior,
        carregando: false,
        erro: erro instanceof Error ? erro.message : 'Não foi possível carregar os dados.',
      }))
    }
  }, [])

  React.useEffect(() => {
    void carregarTudo()
  }, [carregarTudo])

  const recarregarClientes = React.useCallback(async () => {
    const clientes = await repository.listarClientes()
    setEstado((anterior) => ({ ...anterior, clientes }))
  }, [])

  const recarregarServicos = React.useCallback(async () => {
    const servicos = await repository.listarServicos()
    setEstado((anterior) => ({ ...anterior, servicos }))
  }, [])

  const recarregarVisitas = React.useCallback(async () => {
    const visitas = await repository.listarVisitas()
    setEstado((anterior) => ({ ...anterior, visitas }))
  }, [])

  const valor = React.useMemo<ContextoDados>(
    () => ({
      ...estado,
      fonte: repository.nome,
      usandoSupabase,
      recarregar: carregarTudo,

      criarCliente: async (input) => {
        const cliente = await repository.criarCliente(input)
        await recarregarClientes()
        return cliente
      },
      atualizarCliente: async (id, input) => {
        const cliente = await repository.atualizarCliente(id, input)
        await Promise.all([recarregarClientes(), recarregarVisitas()])
        return cliente
      },
      alterarStatusCliente: async (id, status) => {
        const cliente = await repository.alterarStatusCliente(id, status)
        await Promise.all([recarregarClientes(), recarregarVisitas()])
        return cliente
      },
      excluirCliente: async (id) => {
        await repository.excluirCliente(id)
        await Promise.all([recarregarClientes(), recarregarVisitas()])
      },

      criarServico: async (input) => {
        const servico = await repository.criarServico(input)
        await recarregarServicos()
        return servico
      },
      atualizarServico: async (id, input) => {
        const servico = await repository.atualizarServico(id, input)
        await Promise.all([recarregarServicos(), recarregarVisitas()])
        return servico
      },
      alterarStatusServico: async (id, status) => {
        const servico = await repository.alterarStatusServico(id, status)
        await Promise.all([recarregarServicos(), recarregarVisitas()])
        return servico
      },
      excluirServico: async (id) => {
        await repository.excluirServico(id)
        await Promise.all([recarregarServicos(), recarregarVisitas()])
      },

      criarVisita: async (input) => {
        const visita = await repository.criarVisita(input)
        await recarregarVisitas()
        return visita
      },
      atualizarVisita: async (id, input) => {
        const visita = await repository.atualizarVisita(id, input)
        await recarregarVisitas()
        return visita
      },
      excluirVisita: async (id) => {
        await repository.excluirVisita(id)
        await recarregarVisitas()
      },
    }),
    [estado, carregarTudo, recarregarClientes, recarregarServicos, recarregarVisitas],
  )

  return <BarberDataContext.Provider value={valor}>{children}</BarberDataContext.Provider>
}

export function useBarberData(): ContextoDados {
  const contexto = React.useContext(BarberDataContext)
  if (!contexto) {
    throw new Error('useBarberData precisa estar dentro de <BarberDataProvider>.')
  }
  return contexto
}
