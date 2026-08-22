import { endOfMonth, startOfMonth } from 'date-fns'

import { dateParaDataISO } from '@/lib/format'
import { valorDaVisita } from '@/lib/visitas'
import type { DataISO, VisitaDetalhada } from '@/types'

export interface ResumoAgendaDia {
  data: DataISO
  clientes: number
  atendimentos: number
  receita: number
  visitas: VisitaDetalhada[]
}

export interface ResumoAgendaMes {
  inicio: DataISO
  fim: DataISO
  clientes: number
  atendimentos: number
  receita: number
  dias: Map<DataISO, ResumoAgendaDia>
}

export function resumirAgendaDia(
  visitas: VisitaDetalhada[],
  data: DataISO,
): ResumoAgendaDia {
  const visitasDoDia = visitas
    .filter((visita) => visita.data_atendimento === data)
    .sort((a, b) => {
      const porHorario = b.created_at.localeCompare(a.created_at)
      return porHorario || a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR')
    })

  return {
    data,
    clientes: new Set(visitasDoDia.map((visita) => visita.cliente_id)).size,
    atendimentos: visitasDoDia.length,
    receita: visitasDoDia.reduce((total, visita) => total + valorDaVisita(visita), 0),
    visitas: visitasDoDia,
  }
}

export function resumirAgendaMes(
  visitas: VisitaDetalhada[],
  mes: Date,
): ResumoAgendaMes {
  const inicio = dateParaDataISO(startOfMonth(mes))
  const fim = dateParaDataISO(endOfMonth(mes))
  const visitasDoMes = visitas.filter(
    (visita) => visita.data_atendimento >= inicio && visita.data_atendimento <= fim,
  )
  const datas = new Set(visitasDoMes.map((visita) => visita.data_atendimento))
  const dias = new Map<DataISO, ResumoAgendaDia>()

  datas.forEach((data) => dias.set(data, resumirAgendaDia(visitasDoMes, data)))

  return {
    inicio,
    fim,
    clientes: new Set(visitasDoMes.map((visita) => visita.cliente_id)).size,
    atendimentos: visitasDoMes.length,
    receita: visitasDoMes.reduce((total, visita) => total + valorDaVisita(visita), 0),
    dias,
  }
}
