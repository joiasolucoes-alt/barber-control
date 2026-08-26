import { Database, HardDrive } from 'lucide-react'

import { useBarberData } from '@/hooks/use-barber-data'
import { cn } from '@/lib/utils'

interface DataSourceCardProps {
  className?: string
  mostrarOrientacao?: boolean
}

/** Resumo reutilizável da origem e persistência dos dados do aplicativo. */
export function DataSourceCard({ className, mostrarOrientacao = true }: DataSourceCardProps) {
  const { fonte, usandoSupabase } = useBarberData()
  const Icone = usandoSupabase ? Database : HardDrive

  return (
    <div className={cn('rounded-lg border border-border bg-muted/40 p-3', className)}>
      <p className="flex items-center gap-2 text-xs font-medium">
        <Icone aria-hidden className="h-3.5 w-3.5 text-primary" />
        Fonte de dados
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{fonte}</p>
      {mostrarOrientacao && !usandoSupabase ? (
        <p className="ui-meta mt-2">
          Os dados desta demonstração ficam neste aparelho. A sincronização segura poderá ser configurada depois.
        </p>
      ) : null}
    </div>
  )
}
