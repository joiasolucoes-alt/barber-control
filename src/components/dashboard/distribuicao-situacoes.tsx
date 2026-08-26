import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROTULOS_SITUACAO, type ResumoSituacoes, type SituacaoCliente } from '@/lib/clientes-analise'
import { formatarNumero, formatarPercentual } from '@/lib/format'

const SITUACOES: Array<{ chave: SituacaoCliente; cor: string }> = [
  { chave: 'recorrente', cor: '#16a34a' },
  { chave: 'novo', cor: '#3b82f6' },
  { chave: 'em-risco', cor: '#d97706' },
  { chave: 'perdido', cor: '#dc2626' },
  { chave: 'sem-visitas', cor: '#9a9aa4' },
]

interface DistribuicaoSituacoesProps {
  resumo: ResumoSituacoes
  carregando?: boolean
}

export function DistribuicaoSituacoes({ resumo, carregando }: DistribuicaoSituacoesProps) {
  const dados = SITUACOES.map((item) => ({
    ...item,
    nome: ROTULOS_SITUACAO[item.chave],
    total: resumo.porSituacao[item.chave],
  })).filter((item) => item.total > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Situação da carteira</CardTitle>
        <CardDescription>Distribuição atual dos clientes ativos pelo ritmo de retorno.</CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <Skeleton className="h-[280px] w-full" />
        ) : resumo.total === 0 ? (
          <EmptyState
            icone={<PieChartIcon />}
            titulo="Nenhum cliente ativo"
            descricao="Ative ou cadastre clientes para acompanhar a saúde da carteira."
          />
        ) : (
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.85fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(160px,0.85fr)]">
            <div className="relative h-[190px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dados}
                    dataKey="total"
                    nameKey="nome"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {dados.map((item) => (
                      <Cell key={item.chave} fill={item.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(valor: number, nome: string) => [formatarNumero(Number(valor)), nome]}
                    contentStyle={{
                      borderRadius: '0.65rem',
                      borderColor: 'hsl(var(--border))',
                      backgroundColor: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: '0.75rem',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <strong className="metric-number text-2xl">{formatarNumero(resumo.total)}</strong>
                <span className="text-meta text-muted-foreground">ativos</span>
              </div>
            </div>

            <ul className="space-y-2.5">
              {SITUACOES.map((item) => {
                const total = resumo.porSituacao[item.chave]
                return (
                  <li key={item.chave} className="flex items-center gap-2 text-sm">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
                    <span className="min-w-0 flex-1 truncate">{ROTULOS_SITUACAO[item.chave]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatarPercentual(resumo.total > 0 ? (total / resumo.total) * 100 : 0, 0)}
                    </span>
                    <strong className="w-6 text-right tabular-nums">{formatarNumero(total)}</strong>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
