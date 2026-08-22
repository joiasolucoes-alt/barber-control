import { CalendarDays, Scissors, UsersRound } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Skeleton } from '@/components/ui/skeleton'
import { formatarNumero } from '@/lib/format'

interface DashboardHeroProps {
  atendidosHoje: number
  clientesAtivos: number
  carregando?: boolean
}

function obterSaudacao(data: Date) {
  const hora = data.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function DashboardHero({ atendidosHoje, clientesAtivos, carregando }: DashboardHeroProps) {
  const agora = new Date()
  const dataExtenso = capitalizar(format(agora, "EEEE, d 'de' MMMM", { locale: ptBR }))

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-br from-graphite-950 via-graphite-900 to-graphite-800 p-5 text-white shadow-lg shadow-black/10 sm:p-6">
      <div
        aria-hidden
        className="absolute -right-14 -top-20 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl"
      />
      <Scissors
        aria-hidden
        className="absolute -right-3 top-1/2 h-28 w-28 -translate-y-1/2 rotate-[-12deg] text-white/[0.035]"
        strokeWidth={1.25}
      />

      <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold-300">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(212,170,56,0.8)]" />
            Visão geral
          </span>
          <h1 className="heading-display mt-3 text-[2rem] font-bold leading-[0.95] text-white sm:text-4xl">
            {obterSaudacao(agora)}, André.
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-graphite-200">
            <CalendarDays aria-hidden className="h-4 w-4 text-gold-400" />
            {dataExtenso}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:min-w-72">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-graphite-300">Atendidos hoje</p>
            {carregando ? (
              <Skeleton className="mt-2 h-7 w-12 bg-white/10" />
            ) : (
              <p className="metric-number mt-1 text-2xl text-white">{formatarNumero(atendidosHoje)}</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-graphite-300">
              <UsersRound aria-hidden className="h-3.5 w-3.5 text-gold-400" /> Ativos
            </p>
            {carregando ? (
              <Skeleton className="mt-2 h-7 w-12 bg-white/10" />
            ) : (
              <p className="metric-number mt-1 text-2xl text-white">{formatarNumero(clientesAtivos)}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
