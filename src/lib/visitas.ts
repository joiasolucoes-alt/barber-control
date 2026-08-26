import type { Servico, VisitaDetalhada } from '@/types'

/** Soma os valores congelados no momento em que a visita foi registrada. */
export function valorDaVisita(visita: VisitaDetalhada): number {
  return visita.servicos.reduce(
    (total, servico) => total + (servico.preco_cobrado ?? 0),
    0,
  )
}

/** Ordena serviços pelo uso histórico, com nome como desempate estável. */
export function ordenarServicosPorFrequencia(
  servicos: Servico[],
  visitas: VisitaDetalhada[],
): Servico[] {
  const usos = new Map<string, number>()
  visitas.forEach((visita) => {
    visita.servicos.forEach((servico) => usos.set(servico.id, (usos.get(servico.id) ?? 0) + 1))
  })

  return [...servicos].sort(
    (a, b) => (usos.get(b.id) ?? 0) - (usos.get(a.id) ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR'),
  )
}

/** Atendimento mais recente do cliente, ignorando opcionalmente uma visita em edição. */
export function ultimaVisitaDoCliente(
  visitas: VisitaDetalhada[],
  clienteId: string,
  ignorarVisitaId?: string,
): VisitaDetalhada | null {
  return (
    visitas
      .filter((visita) => visita.cliente_id === clienteId && visita.id !== ignorarVisitaId)
      .sort(
        (a, b) =>
          b.data_atendimento.localeCompare(a.data_atendimento) || b.created_at.localeCompare(a.created_at),
      )[0] ?? null
  )
}
