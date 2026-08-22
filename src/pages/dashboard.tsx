import * as React from 'react'
import { CalendarCheck, DollarSign, Scissors, TrendingUp, Users } from 'lucide-react'

import { AtendimentosRecentes } from '@/components/dashboard/atendimentos-recentes'
import { DashboardHero } from '@/components/dashboard/dashboard-hero'
import { DistribuicaoSituacoes } from '@/components/dashboard/distribuicao-situacoes'
import { GraficoClientes } from '@/components/dashboard/grafico-clientes'
import { GraficoNovosClientes } from '@/components/dashboard/grafico-novos-clientes'
import { GraficoServicos } from '@/components/dashboard/grafico-servicos'
import { PeriodoFiltro } from '@/components/dashboard/periodo-filtro'
import { RankingClientes } from '@/components/dashboard/ranking-clientes'
import { TaxasRetorno } from '@/components/dashboard/taxas-retorno'
import { ErrorState } from '@/components/common/data-state'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { useBarberData } from '@/hooks/use-barber-data'
import {
  analisarClientes,
  rankingClientesPorFrequencia,
  resumirSituacoes,
} from '@/lib/clientes-analise'
import { dateParaDataISO, formatarData, formatarMoeda, formatarNumero } from '@/lib/format'
import {
  calcularTaxasRetorno,
  calcularIndicadores,
  compararIndicadores,
  filtrarVisitasPorPeriodo,
  intervaloAnteriorDoPeriodo,
  intervaloDoPeriodo,
  rankingServicos,
  serieDiariaClientes,
  serieNovosClientesPorMes,
} from '@/lib/metrics'
import { obterPeriodo, type PeriodoChave } from '@/types/periodo'

export function DashboardPage() {
  const { clientes, visitas, carregando, erro, recarregar } = useBarberData()
  const [periodoChave, setPeriodoChave] = React.useState<PeriodoChave>('total')

  const periodo = obterPeriodo(periodoChave)

  const {
    indicadores,
    comparativos,
    serie,
    ranking,
    recentes,
    novosClientes,
    taxasRetorno,
    resumoSituacoes,
    rankingClientes,
    rotuloIntervalo,
  } = React.useMemo(() => {
    const hoje = new Date()
    const intervalo = intervaloDoPeriodo(periodo, visitas)
    const visitasDoPeriodo = filtrarVisitasPorPeriodo(visitas, intervalo)
    const intervaloAnterior = intervaloAnteriorDoPeriodo(periodo, intervalo)
    const visitasDoPeriodoAnterior = intervaloAnterior
      ? filtrarVisitasPorPeriodo(visitas, intervaloAnterior)
      : []
    const indicadoresAtuais = calcularIndicadores(clientes, visitasDoPeriodo, visitas)
    const indicadoresAnteriores = intervaloAnterior
      ? calcularIndicadores(clientes, visitasDoPeriodoAnterior, visitas)
      : null
    const analisesAtivas = analisarClientes(clientes, visitas, hoje).filter(
      (analise) => analise.cliente.status === 'ativo',
    )

    return {
      indicadores: indicadoresAtuais,
      comparativos: compararIndicadores(indicadoresAtuais, indicadoresAnteriores),
      serie: serieDiariaClientes(visitasDoPeriodo, intervalo),
      ranking: rankingServicos(visitasDoPeriodo),
      recentes: visitasDoPeriodo.slice(0, 6),
      novosClientes: serieNovosClientesPorMes(visitas, hoje),
      taxasRetorno: calcularTaxasRetorno(visitas, hoje),
      resumoSituacoes: resumirSituacoes(analisesAtivas),
      rankingClientes: rankingClientesPorFrequencia(analisesAtivas),
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
      <DashboardHero
        atendidosHoje={indicadores.atendidosHoje}
        clientesAtivos={indicadores.clientesAtivos}
        carregando={carregando}
      />

      <PeriodoFiltro valor={periodoChave} aoMudar={setPeriodoChave} />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          rotulo="Clientes atendidos"
          valor={formatarNumero(indicadores.clientesUnicosNoPeriodo)}
          descricao="Clientes distintos no período"
          icone={<Users />}
          carregando={carregando}
          comparacao={
            comparativos
              ? {
                  percentual: comparativos.clientesUnicosNoPeriodo.percentual,
                  textoAnterior: `${formatarNumero(comparativos.clientesUnicosNoPeriodo.valorAnterior)} antes`,
                }
              : null
          }
        />
        <StatCard
          rotulo="Visitas no período"
          valor={formatarNumero(indicadores.visitasNoPeriodo)}
          descricao={`${formatarNumero(indicadores.atendidosHoje)} clientes atendidos hoje`}
          icone={<CalendarCheck />}
          carregando={carregando}
          comparacao={
            comparativos
              ? {
                  percentual: comparativos.visitasNoPeriodo.percentual,
                  textoAnterior: `${formatarNumero(comparativos.visitasNoPeriodo.valorAnterior)} antes`,
                }
              : null
          }
        />
        <StatCard
          rotulo="Serviços realizados"
          valor={formatarNumero(indicadores.servicosRealizados)}
          descricao={`Ticket médio ${formatarMoeda(indicadores.ticketMedio)}`}
          icone={<Scissors />}
          carregando={carregando}
          comparacao={
            comparativos
              ? {
                  percentual: comparativos.servicosRealizados.percentual,
                  textoAnterior: `${formatarNumero(comparativos.servicosRealizados.valorAnterior)} antes`,
                }
              : null
          }
        />
        <StatCard
          rotulo="Faturamento estimado"
          valor={formatarMoeda(indicadores.faturamentoEstimado)}
          descricao="Soma dos serviços realizados"
          icone={<DollarSign />}
          carregando={carregando}
          destaque
          comparacao={
            comparativos
              ? {
                  percentual: comparativos.faturamentoEstimado.percentual,
                  textoAnterior: `${formatarMoeda(comparativos.faturamentoEstimado.valorAnterior)} antes`,
                }
              : null
          }
        />
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp aria-hidden className="h-4 w-4 text-primary" />
            {periodo.rotulo} · {rotuloIntervalo}
          </span>
          <span className="text-muted-foreground">
            <strong className="text-foreground">{formatarNumero(indicadores.totalClientes)}</strong> cadastrados ·{' '}
            <strong className="text-foreground">{formatarNumero(indicadores.clientesAtivos)}</strong> ativos
          </span>
        </CardContent>
      </Card>

      <section aria-label="Aquisição e retorno" className="grid gap-4 lg:grid-cols-3">
        <GraficoNovosClientes dados={novosClientes} carregando={carregando} />
        <TaxasRetorno taxas={taxasRetorno} carregando={carregando} />
      </section>

      <section aria-label="Retenção e frequência" className="grid gap-4 lg:grid-cols-3">
        <DistribuicaoSituacoes resumo={resumoSituacoes} carregando={carregando} />
        <RankingClientes clientes={rankingClientes} carregando={carregando} />
      </section>

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
