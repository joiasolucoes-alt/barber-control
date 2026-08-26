import type { Cliente, Servico, Visita, VisitaServico } from '@/types'

export interface BaseLocal {
  clientes: Cliente[]
  servicos: Servico[]
  visitas: Visita[]
  visitaServicos: VisitaServico[]
}

export function criarBaseLocalVazia(): BaseLocal {
  return {
    clientes: [],
    servicos: [],
    visitas: [],
    visitaServicos: [],
  }
}

const ID_CLIENTE_DEMONSTRACAO = /^cli-(?:[1-9]|1\d|2[0-8])$/
const ID_SERVICO_DEMONSTRACAO = /^srv-[1-6]$/
const ID_VISITA_DEMONSTRACAO = /^vis-\d+$/
const ID_VINCULO_DEMONSTRACAO = /^vs-\d+-\d+$/

/**
 * Remove exclusivamente os registros gerados pela antiga base demonstrativa.
 * Cadastros reais usam UUID e são mantidos, inclusive durante a atualização do PWA.
 */
export function removerDadosDemonstracao(base: BaseLocal): BaseLocal {
  const clientesRemovidos = new Set(
    base.clientes.filter((cliente) => ID_CLIENTE_DEMONSTRACAO.test(cliente.id)).map((cliente) => cliente.id),
  )
  const servicosRemovidos = new Set(
    base.servicos.filter((servico) => ID_SERVICO_DEMONSTRACAO.test(servico.id)).map((servico) => servico.id),
  )
  const visitasRemovidas = new Set(
    base.visitas
      .filter((visita) => ID_VISITA_DEMONSTRACAO.test(visita.id) || clientesRemovidos.has(visita.cliente_id))
      .map((visita) => visita.id),
  )

  return {
    clientes: base.clientes.filter((cliente) => !clientesRemovidos.has(cliente.id)),
    servicos: base.servicos.filter((servico) => !servicosRemovidos.has(servico.id)),
    visitas: base.visitas.filter((visita) => !visitasRemovidas.has(visita.id)),
    visitaServicos: base.visitaServicos.filter(
      (vinculo) =>
        !ID_VINCULO_DEMONSTRACAO.test(vinculo.id) &&
        !visitasRemovidas.has(vinculo.visita_id) &&
        !servicosRemovidos.has(vinculo.servico_id),
    ),
  }
}
