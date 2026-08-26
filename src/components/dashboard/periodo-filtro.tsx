import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PERIODOS, type PeriodoChave } from '@/types/periodo'

interface PeriodoFiltroProps {
  valor: PeriodoChave
  aoMudar: (valor: PeriodoChave) => void
  className?: string
}

/** Filtros rápidos: 7, 30, 90, 365 dias e período total. */
export function PeriodoFiltro({ valor, aoMudar, className }: PeriodoFiltroProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar período"
      className={cn('grid grid-cols-5 gap-1 rounded-lg border border-border bg-card p-1 sm:flex sm:flex-wrap', className)}
    >
      {PERIODOS.map((periodo) => {
        const ativo = periodo.chave === valor
        return (
          <Button
            key={periodo.chave}
            type="button"
            size="sm"
            variant={ativo ? 'default' : 'ghost'}
            aria-pressed={ativo}
            title={periodo.rotulo}
            onClick={() => aoMudar(periodo.chave)}
            className={cn('min-w-0 px-1 text-xs tracking-tight sm:flex-none sm:px-3', !ativo && 'text-muted-foreground')}
          >
            {periodo.rotuloCurto}
          </Button>
        )
      })}
    </div>
  )
}
