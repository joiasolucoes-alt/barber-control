import { Database, FileDown, HardDrive } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useBarberData } from '@/hooks/use-barber-data'
import { baixarBackup } from '@/lib/backup'
import { cn } from '@/lib/utils'

interface DataSourceCardProps {
  className?: string
  mostrarOrientacao?: boolean
  mostrarBackup?: boolean
}

/** Resumo reutilizável da origem e persistência dos dados do aplicativo. */
export function DataSourceCard({ className, mostrarOrientacao = true, mostrarBackup = true }: DataSourceCardProps) {
  const { fonte, usandoSupabase, clientes, servicos, visitas } = useBarberData()
  const Icone = usandoSupabase ? Database : HardDrive

  function exportar() {
    const resumo = baixarBackup({ fonte, clientes, servicos, visitas })
    toast.success('Backup exportado', {
      description: `${resumo.clientes} clientes e ${resumo.visitas} visitas salvos.`,
    })
  }

  return (
    <div className={cn('rounded-lg border border-border bg-muted/40 p-3', className)}>
      <p className="flex items-center gap-2 text-xs font-medium">
        <Icone aria-hidden className="h-3.5 w-3.5 text-primary" />
        Fonte de dados
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{fonte}</p>
      {mostrarOrientacao && !usandoSupabase ? (
        <p className="ui-meta mt-2">
          Os registros ficam guardados neste navegador. Faça backups periódicos em Dados e segurança.
        </p>
      ) : null}
      {mostrarBackup ? (
        <Button type="button" variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={exportar}>
          <FileDown aria-hidden /> Exportar backup
        </Button>
      ) : null}
    </div>
  )
}
