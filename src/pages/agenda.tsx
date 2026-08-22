import * as React from 'react'
import { startOfMonth } from 'date-fns'
import { CalendarCheck2, ReceiptText, Users } from 'lucide-react'

import { AgendaCalendar } from '@/components/agenda/agenda-calendar'
import { AgendaDiaDialog } from '@/components/agenda/agenda-dia-dialog'
import { ErrorState } from '@/components/common/data-state'
import { PageHeader } from '@/components/common/page-header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBarberData } from '@/hooks/use-barber-data'
import { resumirAgendaDia, resumirAgendaMes } from '@/lib/agenda'
import { formatarMoeda, pluralizar } from '@/lib/format'
import type { DataISO } from '@/types'

export function AgendaPage() {
  const { visitas, carregando, erro, recarregar } = useBarberData()
  const [mes, setMes] = React.useState(() => startOfMonth(new Date()))
  const [dataSelecionada, setDataSelecionada] = React.useState<DataISO | null>(null)

  const resumoMes = React.useMemo(() => resumirAgendaMes(visitas, mes), [visitas, mes])
  const resumoDia = React.useMemo(
    () => (dataSelecionada ? resumirAgendaDia(visitas, dataSelecionada) : null),
    [visitas, dataSelecionada],
  )

  function mudarMes(novoMes: Date) {
    setMes(startOfMonth(novoMes))
    setDataSelecionada(null)
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Agenda" descricao="Histórico diário dos atendimentos realizados." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        titulo="Agenda"
        descricao="Consulte os atendimentos já realizados. Toque em um dia para ver clientes, serviços e valores."
      />

      {carregando ? (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {Array.from({ length: 3 }).map((_, indice) => (
              <Skeleton key={indice} className="h-24 rounded-xl sm:h-28" />
            ))}
          </div>
          <Skeleton className="h-[31rem] rounded-xl" />
        </>
      ) : (
        <>
          <section aria-label="Resumo do mês" className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
            <Card className="p-3 sm:p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Clientes</span>
              </div>
              <p className="metric-number mt-2 text-2xl sm:text-3xl">{resumoMes.clientes}</p>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">pessoas diferentes</p>
            </Card>

            <Card className="p-3 sm:p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarCheck2 aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Visitas</span>
              </div>
              <p className="metric-number mt-2 text-2xl sm:text-3xl">{resumoMes.atendimentos}</p>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                {pluralizar(resumoMes.atendimentos, 'atendimento', 'atendimentos')}
              </p>
            </Card>

            <Card className="col-span-2 p-3 sm:col-span-1 sm:p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ReceiptText aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Receita</span>
              </div>
              <p className="metric-number mt-2 text-2xl sm:text-3xl">{formatarMoeda(resumoMes.receita)}</p>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">valor registrado</p>
            </Card>
          </section>

          <Card className="overflow-hidden">
            <AgendaCalendar
              mes={mes}
              dias={resumoMes.dias}
              dataSelecionada={dataSelecionada}
              aoMudarMes={mudarMes}
              aoSelecionarData={setDataSelecionada}
            />
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <span aria-hidden className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full bg-primary/20 ring-1 ring-primary/40" />
            O número dourado em cada dia mostra apenas a quantidade de atendimentos realizados.
          </div>
        </>
      )}

      <AgendaDiaDialog resumo={resumoDia} aoFechar={() => setDataSelecionada(null)} />
    </div>
  )
}
