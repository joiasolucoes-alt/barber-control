import * as React from 'react'
import { CalendarCheck, Scissors, TrendingUp, UserCheck, Users } from 'lucide-react'

import { AtendimentosRecentes } from '@/components/dashboard/atendimentos-recentes'
import { GraficoClientes } from '@/components/dashboard/grafico-clientes'
import { GraficoServicos } from '@/components/dashboard/grafico-servicos'
import { PeriodoFiltro } from '@/components/dashboard/periodo-filtro'
import { ErrorState } from '@/components/common/data-state'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { useBarberData } from '@/hooks/use-barber-data'
import { dateParaDataISO, formatarData, formatarMoeda, formatarNumero } from '@/lib/format'
import {
  calcularIndicadores,
  filtrarVisitasPorPeriodo,
  intervaloDoPeriodo,
  rankingServicos,
  serieDiariaClientes,
} from '@/lib/metrics'
import { obterPeriodo, type PeriodoChave } from '@/types/periodo'

export function DashboardPage() {
  const { clientes, visitas, carregando, erro, recarregar } = useBarberData()
  const [periodoChave, setPeriodoChave] = React.useState<PeriodoChave>('30d')

  const periodo = obterPeriodo(periodoChave)

  const { indicadores, serie, ranking, recentes, rotuloIntervalo } = React.useMemo(() => {
    const intervalo = intervaloDoPeriodo(periodo, visitas)
    const visitasDoPeriodo = filtrarVisitasPorPeriodo(visitas, intervalo)

    return {
      indicadores: calcularIndicadores(clientes, visitasDoPeriodo, visitas),
      serie: serieDiariaClientes(visitasDoPeriodo, intervalo),
      ranking: rankingServicos(visitasDoPeriodo),
      recentes: visitasDoPeriodo.slice(0, 6),
      rotuloIntervalo: intervalo.inicio
        ? `${formatarData(dateParaDataISO(intervalo.inicio))} até ${formatarData(dateParaDataISO(intervalo.fim))}`
        : 'Todo o histórico registrado',
    }
  }, [clientes, visitas, periodo])

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Dashboard" descricao="Indicadores dos atendimentos já realizados." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Dashboard"
        descricao="Acompanhe os atendimentos já realizados na barbearia. Os números mudam conforme o período selecionado."
      />

      <PeriodoFiltro valor={periodoChave} aoMudar={setPeriodoChave} />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          rotulo="Clientes cadastrados"
          valor={formatarNumero(indicadores.totalClientes)}
          descricao={`${formatarNumero(indicadores.clientesAtivos)} ativos`}
          icone={<Users />}
          carregando={carregando}
        />
        <StatCard
          rotulo="Atendidos hoje"
          valor={formatarNumero(indicadores.atendidosHoje)}
          descricao="Clientes distintos com visita hoje"
          icone={<UserCheck />}
          carregando={carregando}
          destaque
        />
        <StatCard
          rotulo="Visitas no período"
          valor={formatarNumero(indicadores.visitasNoPeriodo)}
          descricao={`${formatarNumero(indicadores.clientesUnicosNoPeriodo)} clientes distintos`}
          icone={<CalendarCheck />}
          carregando={carregando}
        />
        <StatCard
          rotulo="Serviços realizados"
          valor={formatarNumero(indicadores.servicosRealizados)}
          descricao={`Ticket médio ${formatarMoeda(indicadores.ticketMedio)}`}
          icone={<Scissors />}
          carregando={carregando}
        />
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp aria-hidden className="h-4 w-4 text-primary" />
            {periodo.rotulo} · {rotuloIntervalo}
          </span>
          <span className="text-muted-foreground">
            Receita estimada no período:{' '}
            <strong className="text-foreground">{formatarMoeda(indicadores.faturamentoEstimado)}</strong>
          </span>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        <GraficoClientes
          dados={serie}
          carregando={carregando}
          descricao={
            serie.length > 90
              ? 'Clientes distintos atendidos, agrupados por bloco de dias.'
              : 'Clientes distintos atendidos a cada dia do período.'
          }
        />
        <GraficoServicos dados={ranking} carregando={carregando} />
      </section>

      <AtendimentosRecentes visitas={recentes} carregando={carregando} />
    </div>
  )
}
