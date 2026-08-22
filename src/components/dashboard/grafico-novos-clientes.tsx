import { UserPlus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/components/dashboard/chart-tooltip'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PontoNovosClientesMes } from '@/lib/metrics'

interface GraficoNovosClientesProps {
  dados: PontoNovosClientesMes[]
  carregando?: boolean
}

/** Aquisição mensal baseada na data da primeira visita de cada cliente. */
export function GraficoNovosClientes({ dados, carregando }: GraficoNovosClientesProps) {
  const possuiDados = dados.some((item) => item.total > 0)

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Novos clientes por mês</CardTitle>
        <CardDescription>Primeiras visitas nos últimos 12 meses — cadastro sem atendimento não entra.</CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !possuiDados ? (
          <EmptyState
            icone={<UserPlus />}
            titulo="Ainda não há primeiras visitas"
            descricao="O histórico de aquisição aparece depois que novos clientes são atendidos."
          />
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis
                  dataKey="rotulo"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={12}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                <Bar dataKey="total" name="Novos clientes" fill="#c9a227" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
