import * as React from 'react'
import { CalendarCheck, ChevronDown, ChevronUp, DollarSign, Scissors, TrendingUp, Users } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

import { ErrorState } from '@/components/common/data-state'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { AtendimentosRecentes } from '@/components/dashboard/atendimentos-recentes'
import { DashboardHero } from '@/components/dashboard/dashboard-hero'
import { DistribuicaoSituacoes } from '@/components/dashboard/distribuicao-situacoes'
import { GraficoClientes } from '@/components/dashboard/grafico-clientes'
import { GraficoNovosClientes } from '@/components/dashboard/grafico-novos-clientes'
import { GraficoServicos } from '@/components/dashboard/grafico-servicos'
import { ProximosAniversarios, RecuperacaoPrioritaria } from '@/components/dashboard/operacao-clientes'
import { PeriodoFiltro } from '@/components/dashboard/periodo-filtro'
import { RankingClientes } from '@/components/dashboard/ranking-clientes'
import { TaxasRetorno } from '@/components/dashboard/taxas-retorno'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBarberData } from '@/hooks/use-barber-data'
import {
  analisarClientes,
  clientesParaRecuperar,
  proximosAniversariantes,
  rankingClientesPorFrequencia,
  resumirSituacoes,
} from '@/lib/clientes-analise'
import { dateParaDataISO, formatarData, formatarMoeda, formatarNumero } from '@/lib/format'
import {
  calcularIndicadores,
  calcularResumoHoje,
  calcularTaxasRetorno,
  compararIndicadores,
  filtrarVisitasPorPeriodo,
  intervaloAnteriorDoPeriodo,
  intervaloDoPeriodo,
  rankingServicos,
  serieDiariaClientes,
  serieNovosClientesPorMes,
} from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { obterPeriodo, type PeriodoChave } from '@/types/periodo'

interface AppOutletContext {
  abrirNovaVisita: () => void
}

export function DashboardPage() {
  const { clientes, visitas, carregando, erro, recarregar } = useBarberData()
  const { abrirNovaVisita } = useOutletContext<AppOutletContext>()
  const [periodoChave, setPeriodoChave] = React.useState<PeriodoChave>('total')
  const [graficosAbertos, setGraficosAbertos] = React.useState(false)
  const periodo = obterPeriodo(periodoChave)

  const dados = React.useMemo(() => {
    const hoje = new Date()
    const intervalo = intervaloDoPeriodo(periodo, visitas)
    const visitasDoPeriodo = filtrarVisitasPorPeriodo(visitas, intervalo)
    const intervaloAnterior = intervaloAnteriorDoPeriodo(periodo, intervalo)
    const visitasDoPeriodoAnterior = intervaloAnterior
      ? filtrarVisitasPorPeriodo(visitas, intervaloAnterior)
      : []
    const indicadores = calcularIndicadores(clientes, visitasDoPeriodo, visitas)
    const indicadoresAnteriores = intervaloAnterior
      ? calcularIndicadores(clientes, visitasDoPeriodoAnterior, visitas)
      : null
    const analisesAtivas = analisarClientes(clientes, visitas, hoje).filter(
      (analise) => analise.cliente.status === 'ativo',
    )
    const recentes = [...visitas]
      .sort(
        (a, b) =>
          b.data_atendimento.localeCompare(a.data_atendimento) ||
          b.created_at.localeCompare(a.created_at),
      )
      .slice(0, 3)

    return {
      resumoHoje: calcularResumoHoje(visitas, hoje),
      prioridades: clientesParaRecuperar(analisesAtivas).slice(0, 3),
      aniversarios: proximosAniversariantes(clientes, hoje, 3),
      recentes,
      indicadores,
      comparativos: compararIndicadores(indicadores, indicadoresAnteriores),
      serie: serieDiariaClientes(visitasDoPeriodo, intervalo),
      ranking: rankingServicos(visitasDoPeriodo),
      novosClientes: serieNovosClientesPorMes(visitas, hoje),
      taxasRetorno: calcularTaxasRetorno(visitas, hoje),
      resumoSituacoes: resumirSituacoes(analisesAtivas),
      rankingClientes: rankingClientesPorFrequencia(analisesAtivas),
      rotuloIntervalo: intervalo.inicio
        ? `${formatarData(dateParaDataISO(intervalo.inicio))} até ${formatarData(dateParaDataISO(intervalo.fim))}`
        : 'Todo o histórico registrado',
    }
  }, [clientes, periodo, visitas])

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
        resumo={dados.resumoHoje}
        carregando={carregando}
        aoRegistrarVisita={abrirNovaVisita}
      />

      <section aria-labelledby="dashboard-acoes-titulo" className="space-y-3">
        <div>
          <h2 id="dashboard-acoes-titulo" className="heading-display text-xl font-bold">Para agir agora</h2>
          <p className="text-sm text-muted-foreground">Contatos e registros mais importantes para o dia.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RecuperacaoPrioritaria itens={dados.prioridades} carregando={carregando} />
          <ProximosAniversarios itens={dados.aniversarios} carregando={carregando} />
          <div className="md:col-span-2 md:[&>*]:h-full xl:col-span-1">
            <AtendimentosRecentes
              visitas={dados.recentes}
              carregando={carregando}
              descricao="Últimos registros, independentemente do período."
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-historico-titulo" className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 id="dashboard-historico-titulo" className="heading-display text-xl font-bold">Análises históricas</h2>
            <p className="text-sm text-muted-foreground">Acompanhe evolução, retorno e saúde da carteira.</p>
          </div>
          <PeriodoFiltro valor={periodoChave} aoMudar={setPeriodoChave} />
        </div>

        <section aria-label="Indicadores do período" className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
          <StatCard
            rotulo="Clientes"
            valor={formatarNumero(dados.indicadores.clientesUnicosNoPeriodo)}
            descricao="Clientes distintos no período"
            icone={<Users />}
            carregando={carregando}
            comparacao={
              dados.comparativos
                ? {
                    percentual: dados.comparativos.clientesUnicosNoPeriodo.percentual,
                    textoAnterior: `${formatarNumero(dados.comparativos.clientesUnicosNoPeriodo.valorAnterior)} antes`,
                  }
                : null
            }
          />
          <StatCard
            rotulo="Visitas"
            valor={formatarNumero(dados.indicadores.visitasNoPeriodo)}
            descricao="Atendimentos registrados"
            icone={<CalendarCheck />}
            carregando={carregando}
            comparacao={
              dados.comparativos
                ? {
                    percentual: dados.comparativos.visitasNoPeriodo.percentual,
                    textoAnterior: `${formatarNumero(dados.comparativos.visitasNoPeriodo.valorAnterior)} antes`,
                  }
                : null
            }
          />
          <StatCard
            rotulo="Serviços"
            valor={formatarNumero(dados.indicadores.servicosRealizados)}
            descricao={`Ticket médio ${formatarMoeda(dados.indicadores.ticketMedio)}`}
            icone={<Scissors />}
            carregando={carregando}
            comparacao={
              dados.comparativos
                ? {
                    percentual: dados.comparativos.servicosRealizados.percentual,
                    textoAnterior: `${formatarNumero(dados.comparativos.servicosRealizados.valorAnterior)} antes`,
                  }
                : null
            }
          />
          <StatCard
            rotulo="Receita"
            valor={formatarMoeda(dados.indicadores.faturamentoEstimado)}
            descricao="Valores efetivamente cobrados"
            icone={<DollarSign />}
            carregando={carregando}
            destaque
            comparacao={
              dados.comparativos
                ? {
                    percentual: dados.comparativos.faturamentoEstimado.percentual,
                    textoAnterior: `${formatarMoeda(dados.comparativos.faturamentoEstimado.valorAnterior)} antes`,
                  }
                : null
            }
          />
        </section>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp aria-hidden className="h-4 w-4 text-primary" />
              {periodo.rotulo} · {dados.rotuloIntervalo}
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">{formatarNumero(dados.indicadores.totalClientes)}</strong> cadastrados ·{' '}
              <strong className="text-foreground">{formatarNumero(dados.indicadores.clientesAtivos)}</strong> ativos
            </span>
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="outline"
          className="w-full lg:hidden"
          aria-expanded={graficosAbertos}
          aria-controls="dashboard-graficos"
          onClick={() => setGraficosAbertos((abertos) => !abertos)}
        >
          {graficosAbertos ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
          {graficosAbertos ? 'Ocultar gráficos detalhados' : 'Ver gráficos detalhados'}
        </Button>

        <div
          id="dashboard-graficos"
          className={cn('space-y-4', !graficosAbertos && 'hidden lg:block')}
        >
          <section aria-label="Aquisição e retorno" className="grid gap-4 lg:grid-cols-3">
            <GraficoNovosClientes dados={dados.novosClientes} carregando={carregando} />
            <TaxasRetorno taxas={dados.taxasRetorno} carregando={carregando} />
          </section>

          <section aria-label="Retenção e frequência" className="grid gap-4 lg:grid-cols-3">
            <DistribuicaoSituacoes resumo={dados.resumoSituacoes} carregando={carregando} />
            <RankingClientes clientes={dados.rankingClientes} carregando={carregando} />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <GraficoClientes
              dados={dados.serie}
              carregando={carregando}
              descricao={
                dados.serie.length > 90
                  ? 'Clientes distintos atendidos, agrupados por bloco de dias.'
                  : 'Clientes distintos atendidos a cada dia do período.'
              }
            />
            <GraficoServicos dados={dados.ranking} carregando={carregando} />
          </section>
        </div>
      </section>
    </div>
  )
}
