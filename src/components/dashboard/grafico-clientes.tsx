import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/components/dashboard/chart-tooltip'
import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PontoSerieDiaria } from '@/lib/metrics'
import { LineChart } from 'lucide-react'

interface GraficoClientesProps {
  dados: PontoSerieDiaria[]
  carregando?: boolean
  descricao: string
}

/** Evolução diária da quantidade de clientes atendidos. */
export function GraficoClientes({ dados, carregando, descricao }: GraficoClientesProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Clientes atendidos por dia</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <Skeleton className="h-[280px] w-full" />
        ) : dados.length === 0 ? (
          <EmptyState
            icone={<LineChart />}
            titulo="Sem atendimentos no período"
            descricao="Registre visitas para acompanhar a evolução diária."
          />
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradienteClientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a227" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#c9a227" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis
                  dataKey="rotulo"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
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
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#c9a227', strokeOpacity: 0.3 }} />
                <Area
                  type="monotone"
                  dataKey="clientes"
                  name="Clientes"
                  stroke="#c9a227"
                  strokeWidth={2}
                  fill="url(#gradienteClientes)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
