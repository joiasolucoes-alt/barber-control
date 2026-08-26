import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarDuracao, formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Servico } from '@/types'

interface ServicosSelectorProps {
  servicos: Servico[]
  selecionados: string[]
  precosCobrados: Record<string, string>
  aoAlternar: (servicoId: string) => void
  aoMudarPreco: (servicoId: string, valor: string) => void
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

/**
 * Seleção múltipla de serviços de um mesmo atendimento.
 * Ex.: "Corte de cabelo" + "Barba" ficam vinculados à mesma visita.
 */
export function ServicosSelector({
  servicos,
  selecionados,
  precosCobrados,
  aoAlternar,
  aoMudarPreco,
  ...aria
}: ServicosSelectorProps) {
  if (servicos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum serviço ativo cadastrado. Cadastre um serviço para registrar visitas.
      </p>
    )
  }

  const selecionadosDetalhados = selecionados
    .map((servicoId) => servicos.find((servico) => servico.id === servicoId))
    .filter((servico): servico is Servico => Boolean(servico))

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Serviços realizados" className="grid grid-cols-2 gap-2" {...aria}>
        {servicos.map((servico) => {
          const marcado = selecionados.includes(servico.id)
          const idCampo = `servico-opcao-${servico.id}`
          return (
            <label
              key={servico.id}
              htmlFor={idCampo}
              className={cn(
                'flex min-h-control cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-colors',
                marcado ? 'border-primary/60 bg-primary/[0.08]' : 'border-border hover:bg-muted/50',
              )}
            >
              <Checkbox id={idCampo} checked={marcado} onCheckedChange={() => aoAlternar(servico.id)} />
              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 text-sm font-medium leading-tight">{servico.nome}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {[formatarMoeda(servico.preco), formatarDuracao(servico.duracao_estimada)]
                    .filter((parte) => parte !== '—')
                    .join(' · ') || 'Sem preço'}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {selecionadosDetalhados.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
          <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Valores cobrados
          </p>
          <div className="divide-y divide-border">
            {selecionadosDetalhados.map((servico) => {
              const idPreco = `visita-preco-${servico.id}`
              return (
                <div key={servico.id} className="flex min-h-control items-center gap-3 px-3 py-2">
                  <Label htmlFor={idPreco} className="min-w-0 flex-1 truncate">
                    {servico.nome}
                  </Label>
                  <div className="relative w-32 shrink-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id={idPreco}
                      inputMode="decimal"
                      value={precosCobrados[servico.id] ?? ''}
                      onChange={(evento) => aoMudarPreco(servico.id, evento.target.value)}
                      placeholder="0,00"
                      maxLength={10}
                      className="pl-9 text-right font-semibold tabular-nums"
                      aria-label={`Valor cobrado por ${servico.nome}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
