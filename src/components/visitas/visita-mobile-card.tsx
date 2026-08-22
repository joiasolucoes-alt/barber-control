import { Link } from 'react-router-dom'
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatarDataExtensa } from '@/lib/format'
import type { VisitaDetalhada } from '@/types'

interface VisitaMobileCardProps {
  visita: VisitaDetalhada
  aoVisualizar: () => void
  aoEditar: () => void
  aoExcluir: () => void
}

export function VisitaMobileCard({ visita, aoVisualizar, aoEditar, aoExcluir }: VisitaMobileCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <ClienteAvatar nome={visita.cliente.nome} className="h-11 w-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link to={`/clientes/${visita.cliente_id}`} className="block truncate font-semibold hover:text-primary">
              {visita.cliente.nome}
            </Link>
            <p className="text-xs text-muted-foreground">{formatarDataExtensa(visita.data_atendimento)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label={`Ações da visita de ${visita.cliente.nome}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={aoVisualizar}>
                <Eye aria-hidden /> Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={aoEditar}>
                <Pencil aria-hidden /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={aoExcluir}>
                <Trash2 aria-hidden /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <VisitaServicosTags servicos={visita.servicos} limite={4} />
        {visita.observacoes ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{visita.observacoes}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
