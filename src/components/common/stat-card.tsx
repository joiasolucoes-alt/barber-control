import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  rotulo: string
  valor: string
  descricao?: string
  icone: React.ReactNode
  carregando?: boolean
  destaque?: boolean
}

export function StatCard({ rotulo, valor, descricao, icone, carregando, destaque }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-colors', destaque && 'border-primary/40 bg-primary/[0.04]')}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{rotulo}</p>
          {carregando ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="heading-display text-3xl font-semibold leading-none">{valor}</p>
          )}
          {descricao ? <p className="truncate text-xs text-muted-foreground">{descricao}</p> : null}
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
