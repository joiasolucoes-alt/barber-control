import * as React from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icone: React.ReactNode
  titulo: string
  descricao?: string
  acao?: React.ReactNode
  className?: string
}

export function EmptyState({ icone, titulo, descricao, acao, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:h-6 [&_svg]:w-6">
        {icone}
      </div>
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        {descricao ? <p className="mx-auto max-w-md text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acao ? <div className="pt-1">{acao}</div> : null}
    </div>
  )
}
