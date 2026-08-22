import { Ban, CheckCircle2, MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { StatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatarDuracao, formatarMoeda, formatarNumero } from '@/lib/format'
import type { Servico } from '@/types'

interface ServicoMobileCardProps {
  servico: Servico
  realizados: number
  aoEditar: () => void
  aoInativar: () => void
  aoReativar: () => void
  aoExcluir: () => void
}

export function ServicoMobileCard({
  servico,
  realizados,
  aoEditar,
  aoInativar,
  aoReativar,
  aoExcluir,
}: ServicoMobileCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{servico.nome}</p>
            {servico.descricao ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{servico.descricao}</p>
            ) : null}
          </div>
          <StatusBadge status={servico.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label={`Ações de ${servico.nome}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={aoEditar}>
                <Pencil aria-hidden /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {servico.status === 'ativo' ? (
                <DropdownMenuItem destructive onSelect={aoInativar}>
                  <Ban aria-hidden /> Inativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={aoReativar}>
                  <CheckCircle2 aria-hidden /> Reativar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={aoExcluir}>
                <Trash2 aria-hidden /> Excluir definitivamente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-border rounded-lg bg-muted/40 py-3 text-center">
          <div className="px-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Preço</dt>
            <dd className="mt-1 text-xs font-semibold">{formatarMoeda(servico.preco)}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Duração</dt>
            <dd className="mt-1 text-xs font-semibold">{formatarDuracao(servico.duracao_estimada)}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Realizados</dt>
            <dd className="mt-1 text-xs font-semibold tabular-nums">{formatarNumero(realizados)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
