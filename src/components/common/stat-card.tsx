import * as React from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarPercentual } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ComparacaoStatCard {
  percentual: number | null
  textoAnterior: string
}

interface StatCardProps {
  rotulo: string
  valor: string
  descricao?: string
  icone: React.ReactNode
  carregando?: boolean
  destaque?: boolean
  /** null indica que o período selecionado não possui comparação anterior. */
  comparacao?: ComparacaoStatCard | null
}

export function StatCard({
  rotulo,
  valor,
  descricao,
  icone,
  carregando,
  destaque,
  comparacao,
}: StatCardProps) {
  const variacao = comparacao?.percentual
  const variacaoPositiva = variacao !== null && variacao !== undefined && variacao > 0
  const variacaoNegativa = variacao !== null && variacao !== undefined && variacao < 0
  const IconeVariacao = variacaoPositiva ? TrendingUp : variacaoNegativa ? TrendingDown : Minus

  return (
    <Card className={cn('overflow-hidden transition-colors', destaque && 'border-primary/40 bg-primary/[0.04]')}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{rotulo}</p>
          {carregando ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="metric-number text-3xl leading-none">{valor}</p>
          )}
          {descricao ? <p className="text-xs text-muted-foreground">{descricao}</p> : null}
          {comparacao !== undefined ? (
            carregando ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-semibold tabular-nums',
                    variacaoPositiva && 'text-emerald-600 dark:text-emerald-400',
                    variacaoNegativa && 'text-destructive',
                    !variacaoPositiva && !variacaoNegativa && 'text-muted-foreground',
                  )}
                >
                  <IconeVariacao aria-hidden className="h-3.5 w-3.5" />
                  {comparacao === null
                    ? 'Sem comparação'
                    : comparacao.percentual === null
                      ? 'Sem base anterior'
                      : `${comparacao.percentual > 0 ? '+' : ''}${formatarPercentual(comparacao.percentual)}`}
                </span>
                {comparacao ? <span className="text-muted-foreground">· {comparacao.textoAnterior}</span> : null}
              </div>
            )
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:h-5 [&_svg]:w-5',
            destaque && 'bg-primary/15 text-primary',
          )}
          aria-hidden
        >
          {icone}
        </div>
      </CardContent>
    </Card>
  )
}
