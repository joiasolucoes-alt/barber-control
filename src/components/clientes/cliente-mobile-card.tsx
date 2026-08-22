import { Link } from 'react-router-dom'
import { Eye, MoreVertical, Pencil, Trash2, UserCheck, UserRoundX } from 'lucide-react'

import { BotaoWhatsApp } from '@/components/clientes/botao-whatsapp'
import { SituacaoBadge } from '@/components/clientes/situacao-badge'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
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
import {
  DESCRICOES_SITUACAO,
  mensagemRetorno,
  type AnaliseCliente,
} from '@/lib/clientes-analise'
import { exibirTelefone, formatarData } from '@/lib/format'

interface ClienteMobileCardProps {
  analise: AnaliseCliente
  aoEditar: () => void
  aoInativar: () => void
  aoReativar: () => void
  aoExcluir: () => void
}

/** Resumo acionável do cliente, otimizado para leitura e toque no celular. */
export function ClienteMobileCard({ analise, aoEditar, aoInativar, aoReativar, aoExcluir }: ClienteMobileCardProps) {
  const { cliente } = analise

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <ClienteAvatar nome={cliente.nome} className="h-11 w-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link to={`/clientes/${cliente.id}`} className="block truncate font-semibold hover:text-primary">
              {cliente.nome}
            </Link>
            <p className="truncate text-sm text-muted-foreground">{exibirTelefone(cliente.telefone)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <SituacaoBadge situacao={analise.situacao} titulo={DESCRICOES_SITUACAO[analise.situacao]} />
              <StatusBadge status={cliente.status} />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label={`Ações de ${cliente.nome}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/clientes/${cliente.id}`}>
                  <Eye aria-hidden /> Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={aoEditar}>
                <Pencil aria-hidden /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {cliente.status === 'ativo' ? (
                <DropdownMenuItem destructive onSelect={aoInativar}>
                  <UserRoundX aria-hidden /> Inativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={aoReativar}>
                  <UserCheck aria-hidden /> Reativar
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
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Visitas</dt>
            <dd className="mt-1 font-semibold tabular-nums">{analise.totalVisitas}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Última</dt>
            <dd className="mt-1 text-xs font-semibold">{formatarData(analise.ultimaVisita)}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Ritmo</dt>
            <dd className="mt-1 text-xs font-semibold">
              {analise.intervaloMedioDias ? `${analise.intervaloMedioDias} dias` : '—'}
            </dd>
          </div>
        </dl>

        <BotaoWhatsApp
          cliente={cliente}
          mensagem={
            analise.situacao === 'em-risco' || analise.situacao === 'perdido'
              ? mensagemRetorno(cliente)
              : undefined
          }
          rotulo="Conversar no WhatsApp"
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
