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
      <CardContent className="flex items-start justify-between gap-2 p-3 sm:gap-4 sm:p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">{rotulo}</p>
          {carregando ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p
              className={cn(
                'metric-number truncate text-2xl leading-none sm:text-3xl',
                valor.length >= 10 && 'text-sm min-[360px]:text-base min-[390px]:text-lg sm:text-2xl',
              )}
              title={valor}
            >
              {valor}
            </p>
          )}
          {descricao ? <p className="hidden text-xs text-muted-foreground sm:block">{descricao}</p> : null}
          {comparacao ? (
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
                  {comparacao.percentual === null
                    ? 'Sem base anterior'
                    : `${comparacao.percentual > 0 ? '+' : ''}${formatarPercentual(comparacao.percentual)}`}
                </span>
                <span className="hidden text-muted-foreground sm:inline">· {comparacao.textoAnterior}</span>
              </div>
            )
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4 sm:h-11 sm:w-11 sm:[&_svg]:h-5 sm:[&_svg]:w-5',
            destaque && 'bg-primary/15 text-primary',
            valor.length >= 10 && 'hidden sm:flex',
          )}
          aria-hidden
        >
          {icone}
        </div>
      </CardContent>
    </Card>
  )
}
