import { Badge } from '@/components/ui/badge'
import type { Servico } from '@/types'

export function VisitaServicosTags({ servicos, limite }: { servicos: Servico[]; limite?: number }) {
  if (servicos.length === 0) {
    return <span className="text-xs text-muted-foreground">Sem serviços vinculados</span>
  }

  const visiveis = limite ? servicos.slice(0, limite) : servicos
  const restantes = servicos.length - visiveis.length

  return (
    <div className="flex flex-wrap gap-1.5">
      {visiveis.map((servico) => (
        <Badge key={servico.id} variant="default">
          {servico.nome}
        </Badge>
      ))}
      {restantes > 0 ? <Badge variant="secondary">+{restantes}</Badge> : null}
    </div>
  )
}
