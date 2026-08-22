import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { exibirTelefone, formatarDataExtensa, formatarDataHora, formatarMoeda } from '@/lib/format'
import type { VisitaDetalhada } from '@/types'

interface VisitaDetalheDialogProps {
  visita: VisitaDetalhada | null
  aoFechar: () => void
  aoEditar: (visita: VisitaDetalhada) => void
}

export function VisitaDetalheDialog({ visita, aoFechar, aoEditar }: VisitaDetalheDialogProps) {
  const total = visita?.servicos.reduce((soma, servico) => soma + (servico.preco ?? 0), 0) ?? 0

  return (
    <Dialog open={Boolean(visita)} onOpenChange={(aberto) => (!aberto ? aoFechar() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        {visita ? (
          <>
            <DialogHeader>
              <DialogTitle>Detalhes da visita</DialogTitle>
              <DialogDescription>{formatarDataExtensa(visita.data_atendimento)}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <ClienteAvatar nome={visita.cliente.nome} />
                <div className="min-w-0">
                  <Link
                    to={`/clientes/${visita.cliente_id}`}
                    onClick={aoFechar}
                    className="block truncate font-medium hover:text-primary hover:underline"
                  >
                    {visita.cliente.nome}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{exibirTelefone(visita.cliente.telefone)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Serviços realizados</p>
                <VisitaServicosTags servicos={visita.servicos} />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Observações</p>
                <p className="text-sm">{visita.observacoes ?? 'Nenhuma observação registrada.'}</p>
              </div>

              <Separator />

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-muted-foreground">Valor dos serviços</dt>
                  <dd className="font-medium">{formatarMoeda(total)}</dd>
                </div>
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-muted-foreground">Registrado em</dt>
                  <dd className="font-medium">{formatarDataHora(visita.created_at)}</dd>
                </div>
              </dl>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={aoFechar}>
                Fechar
              </Button>
              <Button onClick={() => aoEditar(visita)}>
                <Pencil aria-hidden /> Editar visita
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
