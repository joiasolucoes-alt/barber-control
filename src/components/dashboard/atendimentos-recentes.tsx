import { CalendarRange } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { EmptyState } from '@/components/common/empty-state'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarData, formatarMoeda } from '@/lib/format'
import { valorDaVisita } from '@/lib/visitas'
import type { VisitaDetalhada } from '@/types'

interface AtendimentosRecentesProps {
  visitas: VisitaDetalhada[]
  carregando?: boolean
  descricao?: string
}

export function AtendimentosRecentes({
  visitas,
  carregando,
  descricao = 'Últimas visitas registradas.',
}: AtendimentosRecentesProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Atendimentos recentes</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/visitas">Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, indice) => (
              <Skeleton key={indice} className="h-14 w-full" />
            ))}
          </div>
        ) : visitas.length === 0 ? (
          <EmptyState
            icone={<CalendarRange />}
            titulo="Nenhum atendimento no período"
            descricao="Ajuste o filtro de período ou registre uma nova visita."
          />
        ) : (
          <ul className="divide-y divide-border">
            {visitas.map((visita) => (
              <li key={visita.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <ClienteAvatar nome={visita.cliente.nome} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link
                      to={`/clientes/${visita.cliente_id}`}
                      className="truncate text-sm font-medium hover:text-primary hover:underline"
                    >
                      {visita.cliente.nome}
                    </Link>
                    <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      <strong className="block font-semibold text-foreground">{formatarMoeda(valorDaVisita(visita))}</strong>
                      {formatarData(visita.data_atendimento)}
                    </span>
                  </div>
                  <VisitaServicosTags servicos={visita.servicos} limite={3} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
