import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatarDataExtensa, formatarMoeda, pluralizar } from '@/lib/format'
import type { ResumoAgendaDia } from '@/lib/agenda'
import { valorDaVisita } from '@/lib/visitas'
import type { VisitaDetalhada } from '@/types'

interface AgendaDiaDialogProps {
  resumo: ResumoAgendaDia | null
  aoFechar: () => void
  aoAbrirVisita: (visita: VisitaDetalhada) => void
}

export function AgendaDiaDialog({ resumo, aoFechar, aoAbrirVisita }: AgendaDiaDialogProps) {
  return (
    <Dialog open={Boolean(resumo)} onOpenChange={(aberto) => (!aberto ? aoFechar() : undefined)}>
      <DialogContent className="sm:max-w-xl">
        {resumo ? (
          <>
            <DialogHeader>
              <DialogTitle>Resumo do dia</DialogTitle>
              <DialogDescription>
                {formatarDataExtensa(resumo.data)}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-muted/20">
              <div className="min-w-0 p-3 text-center">
                <dt className="ui-eyebrow">Clientes</dt>
                <dd className="metric-number mt-1 text-xl">{resumo.clientes}</dd>
              </div>
              <div className="min-w-0 border-x border-border p-3 text-center">
                <dt className="ui-eyebrow">Visitas</dt>
                <dd className="metric-number mt-1 text-xl">{resumo.atendimentos}</dd>
              </div>
              <div className="min-w-0 p-3 text-center">
                <dt className="ui-eyebrow">Receita</dt>
                <dd className="metric-number mt-1 whitespace-nowrap text-[13px] sm:text-xl">{formatarMoeda(resumo.receita)}</dd>
              </div>
            </dl>

            {resumo.visitas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="font-medium">Nenhum atendimento neste dia</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quando uma visita for registrada nesta data, ela aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {resumo.atendimentos} {pluralizar(resumo.atendimentos, 'atendimento', 'atendimentos')}
                </p>
                <ul className="space-y-3">
                  {resumo.visitas.map((visita) => (
                    <li key={visita.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start gap-3">
                        <ClienteAvatar nome={visita.cliente.nome} />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              to={`/clientes/${visita.cliente_id}`}
                              onClick={aoFechar}
                              className="min-w-0 truncate font-semibold hover:text-primary hover:underline"
                            >
                              {visita.cliente.nome}
                            </Link>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-control shrink-0 px-2 text-primary"
                              onClick={() => aoAbrirVisita(visita)}
                            >
                              <Eye aria-hidden />
                              <span className="metric-number">{formatarMoeda(valorDaVisita(visita))}</span>
                            </Button>
                          </div>
                          <VisitaServicosTags servicos={visita.servicos} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
