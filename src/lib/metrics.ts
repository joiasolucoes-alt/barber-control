import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

/** Período imediatamente anterior, com a mesma quantidade de dias. */
export function intervaloAnteriorDoPeriodo(
  periodo: PeriodoOpcao,
  intervaloAtual: IntervaloPeriodo,
): IntervaloPeriodo | null {
  if (periodo.dias === null || !intervaloAtual.inicio) return null

  return {
    inicio: subDays(intervaloAtual.inicio, periodo.dias),
    fim: subDays(intervaloAtual.inicio, 1),
  }
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

export interface VariacaoIndicador {
  valorAnterior: number
  /** null quando o período anterior era zero e não existe uma base percentual válida. */
  percentual: number | null
}

export interface ComparativoIndicadores {
  clientesUnicosNoPeriodo: VariacaoIndicador
  visitasNoPeriodo: VariacaoIndicador
  servicosRealizados: VariacaoIndicador
  faturamentoEstimado: VariacaoIndicador
}

function compararValor(valorAtual: number, valorAnterior: number): VariacaoIndicador {
  if (valorAnterior === 0) {
    return { valorAnterior, percentual: valorAtual === 0 ? 0 : null }
  }

  return {
    valorAnterior,
    percentual: ((valorAtual - valorAnterior) / valorAnterior) * 100,
  }
}

/** Compara os quatro indicadores controlados pelo filtro com o período anterior. */
export function compararIndicadores(
  atuais: Indicadores,
  anteriores: Indicadores | null,
): ComparativoIndicadores | null {
  if (!anteriores) return null

  return {
    clientesUnicosNoPeriodo: compararValor(
      atuais.clientesUnicosNoPeriodo,
      anteriores.clientesUnicosNoPeriodo,
    ),
    visitasNoPeriodo: compararValor(atuais.visitasNoPeriodo, anteriores.visitasNoPeriodo),
    servicosRealizados: compararValor(atuais.servicosRealizados, anteriores.servicosRealizados),
    faturamentoEstimado: compararValor(atuais.faturamentoEstimado, anteriores.faturamentoEstimado),
  }
}

export interface PontoNovosClientesMes {
  mes: string
  rotulo: string
  total: number
}

/**
 * Aquisição mensal medida pela primeira visita, não apenas pela data de cadastro.
 * Mantém meses sem aquisição na série para o gráfico não esconder lacunas.
 */
export function serieNovosClientesPorMes(
  visitas: VisitaDetalhada[],
  hoje = new Date(),
  quantidadeMeses = 12,
): PontoNovosClientesMes[] {
  const fim = startOfMonth(hoje)
  const inicio = startOfMonth(subMonths(fim, Math.max(1, quantidadeMeses) - 1))
  const primeiraVisitaPorCliente = new Map<string, DataISO>()

  visitas.forEach((visita) => {
    const atual = primeiraVisitaPorCliente.get(visita.cliente_id)
    if (!atual || visita.data_atendimento < atual) {
      primeiraVisitaPorCliente.set(visita.cliente_id, visita.data_atendimento)
    }
  })

  const totais = new Map<string, number>()
  primeiraVisitaPorCliente.forEach((data) => {
    const mes = data.slice(0, 7)
    totais.set(mes, (totais.get(mes) ?? 0) + 1)
  })

  return eachMonthOfInterval({ start: inicio, end: fim }).map((data) => {
    const mes = format(data, 'yyyy-MM')
    return {
      mes,
      rotulo: format(data, "MMM/yy", { locale: ptBR }).replace('.', ''),
      total: totais.get(mes) ?? 0,
    }
  })
}

export interface TaxaRetorno {
  dias: 30 | 60 | 90
  elegiveis: number
  retornaram: number
  /** null quando ainda não há clientes com janela completa para análise. */
  percentual: number | null
}

/**
 * Retenção por coorte: só entra no denominador quem já teve a janela inteira
 * para voltar. Uma segunda visita no mesmo dia não é considerada retorno.
 */
export function calcularTaxasRetorno(
  visitas: VisitaDetalhada[],
  hoje = new Date(),
): TaxaRetorno[] {
  const datasPorCliente = new Map<string, Set<DataISO>>()
  visitas.forEach((visita) => {
    const datas = datasPorCliente.get(visita.cliente_id) ?? new Set<DataISO>()
    datas.add(visita.data_atendimento)
    datasPorCliente.set(visita.cliente_id, datas)
  })

  const historicos = [...datasPorCliente.values()]
    .map((datas) => [...datas].sort())
    .filter((datas) => datas.length > 0 && dataISOParaDate(datas[0]) <= hoje)

  return ([30, 60, 90] as const).map((dias) => {
    let elegiveis = 0
    let retornaram = 0

    historicos.forEach((datas) => {
      const primeira = dataISOParaDate(datas[0])
      if (differenceInCalendarDays(hoje, primeira) < dias) return

      elegiveis += 1
      const retornou = datas.slice(1).some((data) => {
        const intervalo = differenceInCalendarDays(dataISOParaDate(data), primeira)
        return intervalo > 0 && intervalo <= dias
      })
      if (retornou) retornaram += 1
    })

    return {
      dias,
      elegiveis,
      retornaram,
      percentual: elegiveis > 0 ? (retornaram / elegiveis) * 100 : null,
    }
  })
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
