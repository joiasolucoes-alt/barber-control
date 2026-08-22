import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { EmptyState } from '@/components/common/empty-state'
import { SituacaoBadge } from '@/components/clientes/situacao-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarMoeda, formatarNumero, pluralizar } from '@/lib/format'
import type { AnaliseCliente } from '@/lib/clientes-analise'

interface RankingClientesProps {
  clientes: AnaliseCliente[]
  carregando?: boolean
}

/** Ranking histórico dos clientes ativos com mais visitas. */
export function RankingClientes({ clientes, carregando }: RankingClientesProps) {
  const maiorFrequencia = clientes[0]?.totalVisitas ?? 0

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Top clientes por frequência</CardTitle>
        <CardDescription>Clientes ativos com mais visitas em todo o histórico, com gasto como desempate.</CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, indice) => (
              <Skeleton key={indice} className="h-14 w-full" />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <EmptyState
            icone={<Trophy />}
            titulo="Ranking ainda vazio"
            descricao="Os clientes mais frequentes aparecem conforme as visitas são registradas."
          />
        ) : (
          <ol className="space-y-4">
            {clientes.map((analise, indice) => (
              <li key={analise.cliente.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="w-5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {indice + 1}
                </span>
                <div className="min-w-0">
                  <div className="mb-2 flex min-w-0 items-center gap-3">
                    <ClienteAvatar nome={analise.cliente.nome} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          to={`/clientes/${analise.cliente.id}`}
                          className="truncate font-semibold hover:text-primary hover:underline"
                        >
                          {analise.cliente.nome}
                        </Link>
                        <SituacaoBadge situacao={analise.situacao} className="hidden sm:inline-flex" />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {analise.intervaloMedioDias === null
                          ? 'Ritmo ainda em formação'
                          : `Volta em média a cada ${analise.intervaloMedioDias} dias`}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${maiorFrequencia > 0 ? (analise.totalVisitas / maiorFrequencia) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {formatarNumero(analise.totalVisitas)}{' '}
                    <span className="font-normal text-muted-foreground">
                      {pluralizar(analise.totalVisitas, 'visita', 'visitas')}
                    </span>
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">{formatarMoeda(analise.totalGasto)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
