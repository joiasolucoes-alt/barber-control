import { differenceInCalendarDays } from 'date-fns'

import { apenasDigitos, dataISOParaDate, dateParaDataISO } from '@/lib/format'
import { rankingServicos, type ItemRankingServico } from '@/lib/metrics'
import type { Cliente, DataISO, VisitaDetalhada } from '@/types'

/**
 * Situação do cliente derivada do próprio histórico — não é um campo do banco.
 * Difere do `status` (ativo/inativo), que é uma decisão manual do responsável.
 */
export type SituacaoCliente = 'sem-visitas' | 'novo' | 'recorrente' | 'em-risco' | 'perdido'

/** Referência usada enquanto o cliente ainda não tem ritmo próprio (1 visita só). */
export const INTERVALO_PADRAO_DIAS = 45

/** Limites de sanidade para o ritmo calculado, evitando extremos. */
const INTERVALO_MINIMO_DIAS = 7
const INTERVALO_MAXIMO_DIAS = 120

/** Multiplicadores aplicados sobre o ritmo do cliente. */
const FATOR_RISCO = 1.5
const FATOR_PERDIDO = 3

export interface AnaliseCliente {
  cliente: Cliente
  totalVisitas: number
  primeiraVisita: DataISO | null
  ultimaVisita: DataISO | null
  diasDesdeUltimaVisita: number | null
  /** Média de dias entre visitas; null quando há menos de 2 visitas. */
  intervaloMedioDias: number | null
  /** Ritmo usado nos cálculos: o do cliente, ou o padrão quando não há histórico. */
  intervaloReferenciaDias: number
  /** Data em que o cliente deveria voltar, mantido o ritmo dele. */
  previsaoRetorno: DataISO | null
  /** Dias de atraso em relação à previsão; negativo quando ainda está no prazo. */
  diasDeAtraso: number | null
  situacao: SituacaoCliente
  totalGasto: number
  servicosFrequentes: ItemRankingServico[]
  visitas: VisitaDetalhada[]
}

export const ROTULOS_SITUACAO: Record<SituacaoCliente, string> = {
  'sem-visitas': 'Sem visitas',
  novo: 'Novo',
  recorrente: 'Recorrente',
  'em-risco': 'Em risco',
  perdido: 'Perdido',
}

export const DESCRICOES_SITUACAO: Record<SituacaoCliente, string> = {
  'sem-visitas': 'Cadastrado, mas ainda sem nenhum atendimento registrado.',
  novo: 'Veio uma única vez e ainda está dentro do prazo esperado para voltar.',
  recorrente: 'Está voltando dentro do ritmo habitual dele.',
  'em-risco': 'Passou do ritmo habitual e ainda não voltou.',
  perdido: 'Está há muito tempo sem aparecer.',
}

function mediaIntervalo(datas: DataISO[]): number | null {
  if (datas.length < 2) return null
  const ordenadas = [...datas].sort()
  let soma = 0
  for (let i = 1; i < ordenadas.length; i += 1) {
    soma += differenceInCalendarDays(dataISOParaDate(ordenadas[i]), dataISOParaDate(ordenadas[i - 1]))
  }
  const media = soma / (ordenadas.length - 1)
  return Math.max(1, Math.round(media))
}

function limitar(valor: number): number {
  return Math.min(INTERVALO_MAXIMO_DIAS, Math.max(INTERVALO_MINIMO_DIAS, valor))
}

/** Consolida histórico, ritmo e situação de um cliente. */
export function analisarCliente(
  cliente: Cliente,
  visitasDoCliente: VisitaDetalhada[],
  hoje = new Date(),
): AnaliseCliente {
  const visitas = [...visitasDoCliente].sort((a, b) => b.data_atendimento.localeCompare(a.data_atendimento))
  const datas = visitas.map((visita) => visita.data_atendimento)

  const ultimaVisita = datas[0] ?? null
  const primeiraVisita = datas[datas.length - 1] ?? null

  const intervaloMedioDias = mediaIntervalo(datas)
  const intervaloReferenciaDias = limitar(intervaloMedioDias ?? INTERVALO_PADRAO_DIAS)

  const diasDesdeUltimaVisita = ultimaVisita
    ? differenceInCalendarDays(hoje, dataISOParaDate(ultimaVisita))
    : null

  const previsaoRetorno = ultimaVisita
    ? dateParaDataISO(
        new Date(dataISOParaDate(ultimaVisita).getTime() + intervaloReferenciaDias * 86400000),
      )
    : null

  const diasDeAtraso =
    diasDesdeUltimaVisita === null ? null : diasDesdeUltimaVisita - intervaloReferenciaDias

  let situacao: SituacaoCliente = 'sem-visitas'
  if (diasDesdeUltimaVisita !== null) {
    const limiteRisco = intervaloReferenciaDias * FATOR_RISCO
    const limitePerdido = intervaloReferenciaDias * FATOR_PERDIDO

    if (diasDesdeUltimaVisita > limitePerdido) {
      situacao = 'perdido'
    } else if (diasDesdeUltimaVisita > limiteRisco) {
      situacao = 'em-risco'
    } else {
      situacao = visitas.length === 1 ? 'novo' : 'recorrente'
    }
  }

  const totalGasto = visitas.reduce(
    (total, visita) => total + visita.servicos.reduce((soma, servico) => soma + (servico.preco ?? 0), 0),
    0,
  )

  return {
    cliente,
    totalVisitas: visitas.length,
    primeiraVisita,
    ultimaVisita,
    diasDesdeUltimaVisita,
    intervaloMedioDias,
    intervaloReferenciaDias,
    previsaoRetorno,
    diasDeAtraso,
    situacao,
    totalGasto,
    servicosFrequentes: rankingServicos(visitas).slice(0, 5),
    visitas,
  }
}

/** Analisa todos os clientes de uma vez, agrupando as visitas em um único passo. */
export function analisarClientes(
  clientes: Cliente[],
  visitas: VisitaDetalhada[],
  hoje = new Date(),
): AnaliseCliente[] {
  const porCliente = new Map<string, VisitaDetalhada[]>()
  visitas.forEach((visita) => {
    const lista = porCliente.get(visita.cliente_id)
    if (lista) lista.push(visita)
    else porCliente.set(visita.cliente_id, [visita])
  })

  return clientes.map((cliente) => analisarCliente(cliente, porCliente.get(cliente.id) ?? [], hoje))
}

/**
 * Clientes que valem uma mensagem: em risco ou perdidos, ainda ativos.
 * Ordena por relevância — quem vinha com mais frequência aparece primeiro,
 * para que a lista continue curta e acionável.
 */
export function clientesParaRecuperar(analises: AnaliseCliente[]): AnaliseCliente[] {
  return analises
    .filter(
      (analise) =>
        analise.cliente.status === 'ativo' &&
        (analise.situacao === 'em-risco' || analise.situacao === 'perdido'),
    )
    .sort((a, b) => {
      if (b.totalVisitas !== a.totalVisitas) return b.totalVisitas - a.totalVisitas
      return (b.diasDeAtraso ?? 0) - (a.diasDeAtraso ?? 0)
    })
}

export interface Aniversariante {
  cliente: Cliente
  dia: number
  mes: number
  /** Idade que completa neste aniversário. */
  idade: number | null
  ehHoje: boolean
}

/** Clientes que fazem aniversário no mês informado, em ordem de dia. */
export function aniversariantesDoMes(clientes: Cliente[], hoje = new Date()): Aniversariante[] {
  const mesAlvo = hoje.getMonth() + 1

  return clientes
    .filter((cliente) => cliente.status === 'ativo' && cliente.data_nascimento)
    .map((cliente) => {
      const [ano, mes, dia] = (cliente.data_nascimento as string).split('-').map(Number)
      return {
        cliente,
        dia,
        mes,
        idade: ano ? hoje.getFullYear() - ano : null,
        ehHoje: mes === mesAlvo && dia === hoje.getDate(),
      }
    })
    .filter((item) => item.mes === mesAlvo)
    .sort((a, b) => a.dia - b.dia)
}

export interface ResumoSituacoes {
  total: number
  porSituacao: Record<SituacaoCliente, number>
}

export function resumirSituacoes(analises: AnaliseCliente[]): ResumoSituacoes {
  const porSituacao: Record<SituacaoCliente, number> = {
    'sem-visitas': 0,
    novo: 0,
    recorrente: 0,
    'em-risco': 0,
    perdido: 0,
  }
  analises.forEach((analise) => {
    porSituacao[analise.situacao] += 1
  })
  return { total: analises.length, porSituacao }
}

/** Clientes ativos com mais visitas no histórico; gasto desempata frequências iguais. */
export function rankingClientesPorFrequencia(
  analises: AnaliseCliente[],
  limite = 6,
): AnaliseCliente[] {
  return analises
    .filter((analise) => analise.cliente.status === 'ativo' && analise.totalVisitas > 0)
    .sort((a, b) => {
      if (b.totalVisitas !== a.totalVisitas) return b.totalVisitas - a.totalVisitas
      if (b.totalGasto !== a.totalGasto) return b.totalGasto - a.totalGasto
      return a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR')
    })
    .slice(0, Math.max(0, limite))
}

/**
 * Monta o link de conversa no WhatsApp. Retorna null quando o cliente não tem
 * telefone cadastrado — o campo é opcional.
 */
export function linkWhatsApp(cliente: Cliente, mensagem?: string): string | null {
  if (!cliente.telefone) return null
  const digitos = apenasDigitos(cliente.telefone)
  if (digitos.length < 10) return null
  const numero = digitos.startsWith('55') ? digitos : `55${digitos}`
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${numero}${texto}`
}

/** Primeiro nome, usado nas mensagens. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}

export function mensagemRetorno(cliente: Cliente): string {
  return `Olá, ${primeiroNome(cliente.nome)}! Aqui é da barbearia. Faz um tempo que você não passa por aqui — que tal dar um trato no visual?`
}
