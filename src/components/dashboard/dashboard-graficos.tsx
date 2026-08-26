import * as React from 'react'

import { DistribuicaoSituacoes } from '@/components/dashboard/distribuicao-situacoes'
import { GraficoClientes } from '@/components/dashboard/grafico-clientes'
import { GraficoNovosClientes } from '@/components/dashboard/grafico-novos-clientes'
import { GraficoServicos } from '@/components/dashboard/grafico-servicos'
import { RankingClientes } from '@/components/dashboard/ranking-clientes'
import { TaxasRetorno } from '@/components/dashboard/taxas-retorno'
import {
  rankingClientesPorFrequencia,
  resumirSituacoes,
  type AnaliseCliente,
} from '@/lib/clientes-analise'
import {
  calcularTaxasRetorno,
  rankingServicos,
  serieDiariaClientes,
  serieNovosClientesPorMes,
  type IntervaloPeriodo,
} from '@/lib/metrics'
import type { VisitaDetalhada } from '@/types'

interface DashboardGraficosProps {
  visitas: VisitaDetalhada[]
  visitasDoPeriodo: VisitaDetalhada[]
  intervalo: IntervaloPeriodo
  analisesAtivas: AnaliseCliente[]
  carregando: boolean
}

/** Gráficos pesados: este módulo só é carregado quando eles ficam visíveis. */
export function DashboardGraficos({
  visitas,
  visitasDoPeriodo,
  intervalo,
  analisesAtivas,
  carregando,
}: DashboardGraficosProps) {
  const dados = React.useMemo(
    () => ({
      serie: serieDiariaClientes(visitasDoPeriodo, intervalo),
      ranking: rankingServicos(visitasDoPeriodo),
      novosClientes: serieNovosClientesPorMes(visitas, new Date()),
      taxasRetorno: calcularTaxasRetorno(visitas, new Date()),
      resumoSituacoes: resumirSituacoes(analisesAtivas),
      rankingClientes: rankingClientesPorFrequencia(analisesAtivas),
    }),
    [analisesAtivas, intervalo, visitas, visitasDoPeriodo],
  )

  return (
    <>
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
    </>
  )
}
