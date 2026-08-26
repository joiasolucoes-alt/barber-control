/** Períodos disponíveis nos filtros rápidos do dashboard. */
export type PeriodoChave = '7d' | '30d' | '90d' | '365d' | 'total'

export interface PeriodoOpcao {
  chave: PeriodoChave
  rotulo: string
  rotuloCurto: string
  /** Número de dias considerados; null representa o período total. */
  dias: number | null
}

export const PERIODOS: PeriodoOpcao[] = [
  { chave: '7d', rotulo: 'Últimos 7 dias', rotuloCurto: '7 dias', dias: 7 },
  { chave: '30d', rotulo: 'Últimos 30 dias', rotuloCurto: '30 dias', dias: 30 },
  { chave: '90d', rotulo: 'Últimos 90 dias', rotuloCurto: '90 dias', dias: 90 },
  { chave: '365d', rotulo: 'Últimos 365 dias', rotuloCurto: '365 dias', dias: 365 },
  { chave: 'total', rotulo: 'Todos os períodos', rotuloCurto: 'Todos', dias: null },
]

export function obterPeriodo(chave: PeriodoChave): PeriodoOpcao {
  return PERIODOS.find((periodo) => periodo.chave === chave) ?? PERIODOS[PERIODOS.length - 1]
}
