import type { VisitaDetalhada } from '@/types'

/** Soma os valores congelados no momento em que a visita foi registrada. */
export function valorDaVisita(visita: VisitaDetalhada): number {
  return visita.servicos.reduce(
    (total, servico) => total + (servico.preco_cobrado ?? 0),
    0,
  )
}
