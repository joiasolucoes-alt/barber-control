import { Checkbox } from '@/components/ui/checkbox'
import { formatarDuracao, formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Servico } from '@/types'

interface ServicosSelectorProps {
  servicos: Servico[]
  selecionados: string[]
  aoAlternar: (servicoId: string) => void
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
  aoAlternar,
  ...aria
}: ServicosSelectorProps) {
  if (servicos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum serviço ativo cadastrado. Cadastre um serviço para registrar visitas.
      </p>
    )
  }

  return (
    <div role="group" aria-label="Serviços realizados" className="grid gap-2 sm:grid-cols-2" {...aria}>
      {servicos.map((servico) => {
        const marcado = selecionados.includes(servico.id)
        const idCampo = `servico-opcao-${servico.id}`
        return (
          <label
            key={servico.id}
            htmlFor={idCampo}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              marcado ? 'border-primary/60 bg-primary/[0.06]' : 'border-border hover:bg-muted/50',
            )}
          >
            <Checkbox id={idCampo} checked={marcado} onCheckedChange={() => aoAlternar(servico.id)} className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{servico.nome}</span>
              <span className="block text-xs text-muted-foreground">
                {[formatarMoeda(servico.preco), formatarDuracao(servico.duracao_estimada)]
                  .filter((parte) => parte !== '—')
                  .join(' · ') || 'Sem preço definido'}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
