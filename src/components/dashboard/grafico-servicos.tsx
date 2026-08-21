import { Scissors } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/components/dashboard/chart-tooltip'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarNumero } from '@/lib/format'
import type { ItemRankingServico } from '@/lib/metrics'

const CORES = ['#c9a227', '#d4aa38', '#dfbe5c', '#ebd694', '#9a9aa4', '#6f6f7b']

interface GraficoServicosProps {
  dados: ItemRankingServico[]
  carregando?: boolean
}

/** Ranking dos serviços mais realizados no período. */
export function GraficoServicos({ dados, carregando }: GraficoServicosProps) {
  const principais = dados.slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços mais realizados</CardTitle>
        <CardDescription>Quantidade de vezes que cada serviço apareceu nas visitas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando ? (
          <Skeleton className="h-[280px] w-full" />
        ) : principais.length === 0 ? (
          <EmptyState
            icone={<Scissors />}
            titulo="Nenhum serviço registrado"
            descricao="Os serviços aparecem aqui assim que forem vinculados a uma visita."
          />
        ) : (
          <>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={principais} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                  <Bar dataKey="total" name="Realizados" radius={[0, 6, 6, 0]} barSize={18}>
                    {principais.map((item, indice) => (
                      <Cell key={item.id} fill={CORES[indice % CORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <ol className="space-y-2">
              {principais.map((item, indice) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CORES[indice % CORES.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.nome}</span>
                  <span className="tabular-nums text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                  <span className="w-10 text-right font-semibold tabular-nums">{formatarNumero(item.total)}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  )
}
