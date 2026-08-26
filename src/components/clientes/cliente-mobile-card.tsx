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
import { exibirTelefone, formatarData, pluralizar } from '@/lib/format'

interface ClienteMobileCardProps {
  analise: AnaliseCliente
  aoEditar: () => void
  aoInativar: () => void
  aoReativar: () => void
  aoExcluir: () => void
}

/** Card compacto e inteiramente acessível para abrir o detalhe do cliente. */
export function ClienteMobileCard({ analise, aoEditar, aoInativar, aoReativar, aoExcluir }: ClienteMobileCardProps) {
  const { cliente } = analise
  const destino = `/clientes/${cliente.id}`

  return (
    <Card
      className="content-auto relative transition-colors hover:border-primary/40 hover:bg-muted/20 focus-within:ring-2 focus-within:ring-ring"
    >
      <Link
        to={destino}
        aria-label={`Abrir detalhes de ${cliente.nome}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none"
      />
      <CardContent className="pointer-events-none p-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <ClienteAvatar nome={cliente.nome} className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{cliente.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{exibirTelefone(cliente.telefone)}</p>
          </div>

          <div className="pointer-events-auto relative z-10 flex shrink-0 items-center gap-0.5">
            <BotaoWhatsApp
              cliente={cliente}
              mensagem={
                analise.situacao === 'em-risco' || analise.situacao === 'perdido'
                  ? mensagemRetorno(cliente)
                  : undefined
              }
              variant="ghost"
              somenteIcone
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="iconSm" aria-label={`Ações de ${cliente.nome}`}>
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={destino}>
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
        </div>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <SituacaoBadge situacao={analise.situacao} titulo={DESCRICOES_SITUACAO[analise.situacao]} />
          {cliente.status === 'inativo' ? <StatusBadge status={cliente.status} /> : null}
          <span className="whitespace-nowrap">
            {analise.totalVisitas} {pluralizar(analise.totalVisitas, 'visita', 'visitas')}
          </span>
          <span aria-hidden>·</span>
          <span className="whitespace-nowrap">Última {formatarData(analise.ultimaVisita)}</span>
          {analise.intervaloMedioDias ? (
            <>
              <span aria-hidden>·</span>
              <span className="whitespace-nowrap">Ritmo {analise.intervaloMedioDias}d</span>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
