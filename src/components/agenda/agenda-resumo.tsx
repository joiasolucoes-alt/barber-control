import { CalendarCheck2, ReceiptText, Users } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { formatarMoeda, pluralizar } from '@/lib/format'
import type { ResumoAgendaPeriodo } from '@/lib/agenda'

interface AgendaResumoProps {
  resumo: ResumoAgendaPeriodo
  rotulo?: string
}

export function AgendaResumo({ resumo, rotulo = 'período selecionado' }: AgendaResumoProps) {
  return (
    <section aria-label={`Resumo do ${rotulo}`} className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
      <Card className="p-3 sm:p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users aria-hidden className="h-4 w-4 shrink-0 text-primary" />
          <span className="ui-eyebrow truncate tracking-tight sm:tracking-wide">Clientes</span>
        </div>
        <p className="metric-number mt-2 text-2xl sm:text-3xl">{resumo.clientes}</p>
        <p className="mt-1 hidden text-xs text-muted-foreground sm:block">pessoas diferentes</p>
      </Card>

      <Card className="p-3 sm:p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarCheck2 aria-hidden className="h-4 w-4 shrink-0 text-primary" />
          <span className="ui-eyebrow truncate tracking-tight sm:tracking-wide">Visitas</span>
        </div>
        <p className="metric-number mt-2 text-2xl sm:text-3xl">{resumo.atendimentos}</p>
        <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
          {pluralizar(resumo.atendimentos, 'atendimento', 'atendimentos')}
        </p>
      </Card>

      <Card className="col-span-2 p-3 sm:col-span-1 sm:p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ReceiptText aria-hidden className="h-4 w-4 shrink-0 text-primary" />
          <span className="ui-eyebrow truncate tracking-tight sm:tracking-wide">Receita</span>
        </div>
        <p className="metric-number mt-2 text-xl sm:text-3xl">{formatarMoeda(resumo.receita)}</p>
        <p className="mt-1 hidden text-xs text-muted-foreground sm:block">valor registrado</p>
      </Card>
    </section>
  )
}
