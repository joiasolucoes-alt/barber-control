import * as React from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  titulo: string
  descricao?: string
  acoes?: React.ReactNode
  className?: string
}

export function PageHeader({ titulo, descricao, acoes, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="heading-display text-[1.75rem] font-bold leading-none sm:text-3xl">{titulo}</h1>
        {descricao ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{descricao}</p> : null}
      </div>
      {acoes ? (
        <div className="grid w-full gap-2 [&>*]:w-full sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:[&>*]:w-auto">
          {acoes}
        </div>
      ) : null}
    </header>
  )
}
