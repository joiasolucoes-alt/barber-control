import { differenceInCalendarDays, eachDayOfInterval, startOfDay, subDays } from 'date-fns'

import { dataISOParaDate, dateParaDataISO } from '@/lib/format'
import type { Cliente, DataISO, VisitaDetalhada } from '@/types'
import type { PeriodoOpcao } from '@/types/periodo'

export interface IntervaloPeriodo {
  /** null quando o período é "total" e ainda não há visitas. */
  inicio: Date | null
  fim: Date
}

/** Resolve o intervalo de datas de um período, considerando a base existente. */
export function intervaloDoPeriodo(periodo: PeriodoOpcao, visitas: VisitaDetalhada[]): IntervaloPeriodo {
  const fim = startOfDay(new Date())

  if (periodo.dias !== null) {
    return { inicio: subDays(fim, periodo.dias - 1), fim }
  }

  if (visitas.length === 0) return { inicio: null, fim }

  const maisAntiga = visitas.reduce(
    (menor, visita) => (visita.data_atendimento < menor ? visita.data_atendimento : menor),
    visitas[0].data_atendimento,
  )
  return { inicio: startOfDay(dataISOParaDate(maisAntiga)), fim }
}

export function visitaDentroDoIntervalo(visita: VisitaDetalhada, intervalo: IntervaloPeriodo): boolean {
  const data = dataISOParaDate(visita.data_atendimento)
  if (data > intervalo.fim) return false
  if (intervalo.inicio && data < intervalo.inicio) return false
  return true
}

export function filtrarVisitasPorPeriodo(
  visitas: VisitaDetalhada[],
  intervalo: IntervaloPeriodo,
): VisitaDetalhada[] {
  return visitas.filter((visita) => visitaDentroDoIntervalo(visita, intervalo))
}

export interface Indicadores {
  totalClientes: number
  clientesAtivos: number
  atendidosHoje: number
  visitasNoPeriodo: number
  clientesUnicosNoPeriodo: number
  servicosRealizados: number
  ticketMedio: number
  faturamentoEstimado: number
}

/**
 * "Clientes atendidos" = clientes distintos com pelo menos uma visita no período;
 * o mesmo cliente nunca é contado duas vezes no mesmo atendimento.
 */
export function calcularIndicadores(
  clientes: Cliente[],
  visitasDoPeriodo: VisitaDetalhada[],
  todasAsVisitas: VisitaDetalhada[],
): Indicadores {
  const hoje = dateParaDataISO(new Date())

  const atendidosHoje = new Set(
    todasAsVisitas.filter((visita) => visita.data_atendimento === hoje).map((visita) => visita.cliente_id),
  ).size

  const clientesUnicos = new Set(visitasDoPeriodo.map((visita) => visita.cliente_id)).size
  const servicosRealizados = visitasDoPeriodo.reduce((total, visita) => total + visita.servicos.length, 0)

  const faturamentoEstimado = visitasDoPeriodo.reduce(
    (total, visita) => total + visita.servicos.reduce((soma, servico) => soma + (servico.preco ?? 0), 0),
    0,
  )

  return {
    totalClientes: clientes.length,
    clientesAtivos: clientes.filter((cliente) => cliente.status === 'ativo').length,
    atendidosHoje,
    visitasNoPeriodo: visitasDoPeriodo.length,
    clientesUnicosNoPeriodo: clientesUnicos,
    servicosRealizados,
    faturamentoEstimado,
    ticketMedio: visitasDoPeriodo.length > 0 ? faturamentoEstimado / visitasDoPeriodo.length : 0,
  }
}

export interface PontoSerieDiaria {
  data: DataISO
  rotulo: string
  clientes: number
  visitas: number
}

/**
 * Série diária de clientes atendidos. Em períodos longos os dias são agrupados
 * em blocos para manter o gráfico legível.
 */
export function serieDiariaClientes(
  visitas: VisitaDetalhada[],
  intervalo: IntervaloPeriodo,
): PontoSerieDiaria[] {
  if (!intervalo.inicio) return []

  const dias = eachDayOfInterval({ start: intervalo.inicio, end: intervalo.fim })
  const totalDias = dias.length
  const tamanhoBloco = totalDias > 180 ? 7 : totalDias > 60 ? 3 : 1

  const porDia = new Map<DataISO, { clientes: Set<string>; visitas: number }>()
  visitas.forEach((visita) => {
    const registro = porDia.get(visita.data_atendimento) ?? { clientes: new Set<string>(), visitas: 0 }
    registro.clientes.add(visita.cliente_id)
    registro.visitas += 1
    porDia.set(visita.data_atendimento, registro)
  })

  const pontos: PontoSerieDiaria[] = []

  for (let indice = 0; indice < dias.length; indice += tamanhoBloco) {
    const bloco = dias.slice(indice, indice + tamanhoBloco)
    const clientes = new Set<string>()
    let quantidadeVisitas = 0

    bloco.forEach((dia) => {
      const chave = dateParaDataISO(dia)
      const registro = porDia.get(chave)
      if (!registro) return
      registro.clientes.forEach((clienteId) => clientes.add(clienteId))
      quantidadeVisitas += registro.visitas
    })

    const primeiroDia = bloco[0]
    pontos.push({
      data: dateParaDataISO(primeiroDia),
      rotulo: rotuloDoBloco(primeiroDia, bloco[bloco.length - 1], tamanhoBloco),
      clientes: clientes.size,
      visitas: quantidadeVisitas,
    })
  }

  return pontos
}

function rotuloDoBloco(inicio: Date, fim: Date, tamanhoBloco: number): string {
  const formatarDia = (data: Date) =>
    `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`
  if (tamanhoBloco === 1 || differenceInCalendarDays(fim, inicio) === 0) return formatarDia(inicio)
  return `${formatarDia(inicio)} - ${formatarDia(fim)}`
}

export interface ItemRankingServico {
  id: string
  nome: string
  total: number
  percentual: number
  receita: number
}

export function rankingServicos(visitas: VisitaDetalhada[]): ItemRankingServico[] {
  const acumulado = new Map<string, ItemRankingServico>()

  visitas.forEach((visita) => {
    visita.servicos.forEach((servico) => {
      const atual = acumulado.get(servico.id) ?? {
        id: servico.id,
        nome: servico.nome,
        total: 0,
        percentual: 0,
        receita: 0,
      }
      atual.total += 1
      atual.receita += servico.preco ?? 0
      acumulado.set(servico.id, atual)
    })
  })

  const itens = [...acumulado.values()].sort((a, b) => b.total - a.total)
  const totalGeral = itens.reduce((soma, item) => soma + item.total, 0)

  return itens.map((item) => ({
    ...item,
    percentual: totalGeral > 0 ? (item.total / totalGeral) * 100 : 0,
  }))
}

/** Agrupa as visitas de uma data específica (visualização diária). */
export function visitasDaData(visitas: VisitaDetalhada[], data: DataISO): VisitaDetalhada[] {
  return visitas
    .filter((visita) => visita.data_atendimento === data)
    .sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'))
}
