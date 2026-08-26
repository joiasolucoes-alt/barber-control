import { CalendarDays, CircleDollarSign, Plus, ReceiptText, Scissors, UsersRound } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarMoeda, formatarNumero } from '@/lib/format'
import type { ResumoHoje } from '@/lib/metrics'

interface DashboardHeroProps {
  resumo: ResumoHoje
  carregando?: boolean
  aoRegistrarVisita: () => void
}

const INDICADORES = [
  { chave: 'atendimentos', rotulo: 'Atendimentos', icone: Scissors },
  { chave: 'receita', rotulo: 'Receita', icone: CircleDollarSign },
  { chave: 'ticketMedio', rotulo: 'Ticket médio', icone: ReceiptText },
  { chave: 'clientesUnicos', rotulo: 'Clientes únicos', icone: UsersRound },
] as const

function obterSaudacao(data: Date) {
  const hora = data.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function DashboardHero({ resumo, carregando, aoRegistrarVisita }: DashboardHeroProps) {
  const agora = new Date()
  const dataExtenso = capitalizar(format(agora, "EEEE, d 'de' MMMM", { locale: ptBR }))

  return (
    <section
      aria-labelledby="dashboard-hoje-titulo"
      className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-br from-graphite-950 via-graphite-900 to-graphite-800 p-4 text-white shadow-lg shadow-black/10 sm:p-6"
    >
      <div aria-hidden className="absolute -right-14 -top-20 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
      <Scissors
        aria-hidden
        className="absolute -right-3 top-1/3 h-28 w-28 rotate-[-12deg] text-white/[0.035]"
        strokeWidth={1.25}
      />

      <div className="relative space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(212,170,56,0.8)]" />
              Operação de hoje
            </span>
            <h1 id="dashboard-hoje-titulo" className="heading-display mt-3 text-[1.75rem] font-bold leading-none text-white sm:text-4xl">
              {obterSaudacao(agora)}, André.
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-graphite-200">
              <CalendarDays aria-hidden className="h-4 w-4 text-gold-400" />
              {dataExtenso}
            </p>
          </div>

          <Button type="button" size="lg" onClick={aoRegistrarVisita} className="w-full sm:w-auto">
            <Plus aria-hidden /> Registrar visita
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" role="group" aria-label="Resumo de hoje">
          {INDICADORES.map(({ chave, rotulo, icone: Icone }) => {
            const valor = resumo[chave]
            const formatado = chave === 'receita' || chave === 'ticketMedio' ? formatarMoeda(valor) : formatarNumero(valor)

            return (
              <div key={chave} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
                <p className="flex min-h-7 min-w-0 items-start gap-1.5 text-nav font-semibold uppercase leading-tight text-graphite-300 sm:min-h-0 sm:items-center sm:tracking-wide">
                  <Icone aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                  <span>{rotulo}</span>
                </p>
                {carregando ? (
                  <Skeleton className="mt-2 h-7 w-20 bg-white/10" />
                ) : (
                  <p className="metric-number mt-1 truncate text-xl text-white sm:text-2xl" title={formatado}>
                    {formatado}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
