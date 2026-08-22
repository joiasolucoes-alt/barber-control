import { format, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { DataISO } from '@/types'

/** Converte 'YYYY-MM-DD' em Date local, sem o deslocamento de fuso do parse UTC. */
export function dataISOParaDate(valor: DataISO): Date {
  const [ano, mes, dia] = valor.split('-').map(Number)
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1)
}

/** Converte um Date em 'YYYY-MM-DD' usando o fuso local. */
export function dateParaDataISO(valor: Date): DataISO {
  return format(valor, 'yyyy-MM-dd')
}

/** 05/03/2025 */
export function formatarData(valor: DataISO | null | undefined): string {
  if (!valor) return '—'
  const data = dataISOParaDate(valor)
  return isValid(data) ? format(data, 'dd/MM/yyyy', { locale: ptBR }) : '—'
}

/** 05 de março de 2025 */
export function formatarDataExtensa(valor: DataISO | null | undefined): string {
  if (!valor) return '—'
  const data = dataISOParaDate(valor)
  return isValid(data) ? format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—'
}

/** qua., 05/03 */
export function formatarDataCurta(valor: DataISO): string {
  return format(dataISOParaDate(valor), "EEE, dd/MM", { locale: ptBR })
}

/** 05/03/2025 às 14:32 */
export function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const data = parseISO(valor)
  return isValid(data) ? format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'
}

/** R$ 45,00 */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

/** 1.234 */
export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor)
}

/** 45 min · 1h 30min */
export function formatarDuracao(minutos: number | null | undefined): string {
  if (!minutos) return '—'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}min`
}

/** (11) 98888-7777 — aplica máscara conforme o usuário digita. */
export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Iniciais para o avatar do cliente. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

/** Normaliza texto para busca (remove acentos e caixa). */
export function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return quantidade === 1 ? singular : plural
}

/**
 * Compara telefone ignorando a máscara: buscar "11987" encontra "(11) 98765-4321".
 * Retorna false quando o cliente não tem telefone cadastrado.
 */
export function telefoneCombina(telefone: string | null | undefined, termo: string): boolean {
  if (!telefone) return false
  const digitosTermo = apenasDigitos(termo)
  if (!digitosTermo) return false
  return apenasDigitos(telefone).includes(digitosTermo)
}

/** Telefone para exibição, com marcador quando o campo está vazio. */
export function exibirTelefone(telefone: string | null | undefined): string {
  return telefone && telefone.trim() ? telefone : 'Sem telefone'
}
