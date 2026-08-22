import { RotateCcw } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarNumero, formatarPercentual, pluralizar } from '@/lib/format'
import type { TaxaRetorno } from '@/lib/metrics'

interface TaxasRetornoProps {
  taxas: TaxaRetorno[]
  carregando?: boolean
}

/** Retenção por coortes maduras, sem penalizar clientes que ainda não tiveram tempo de retornar. */
export function TaxasRetorno({ taxas, carregando }: TaxasRetornoProps) {
  const possuiElegiveis = taxas.some((taxa) => taxa.elegiveis > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de retorno</CardTitle>
        <CardDescription>Percentual que fez uma segunda visita dentro de cada prazo.</CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !possuiElegiveis ? (
          <EmptyState
            icone={<RotateCcw />}
            titulo="Histórico ainda recente"
            descricao="As taxas surgem quando os primeiros clientes completarem as janelas de análise."
          />
        ) : (
          <div className="space-y-6">
            {taxas.map((taxa) => (
              <div key={taxa.dias} className="space-y-2">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-semibold">Em até {taxa.dias} dias</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarNumero(taxa.retornaram)} de {formatarNumero(taxa.elegiveis)}{' '}
                      {pluralizar(taxa.elegiveis, 'cliente elegível', 'clientes elegíveis')}
                    </p>
                  </div>
                  <span className="heading-display text-2xl font-semibold tabular-nums">
                    {taxa.percentual === null ? '—' : formatarPercentual(taxa.percentual)}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Retorno em até ${taxa.dias} dias`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={taxa.percentual === null ? 0 : Math.round(taxa.percentual)}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(0, taxa.percentual ?? 0))}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="border-t pt-4 text-xs text-muted-foreground">
              Só entram na base clientes que já completaram a janela inteira desde a primeira visita.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
