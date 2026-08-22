import { Badge } from '@/components/ui/badge'
import { ROTULOS_SITUACAO, type SituacaoCliente } from '@/lib/clientes-analise'

const VARIANTES: Record<SituacaoCliente, 'success' | 'default' | 'danger' | 'muted' | 'secondary'> = {
  'sem-visitas': 'muted',
  novo: 'secondary',
  recorrente: 'success',
  'em-risco': 'default',
  perdido: 'danger',
}

export function SituacaoBadge({
  situacao,
  titulo,
  className,
}: {
  situacao: SituacaoCliente
  titulo?: string
  className?: string
}) {
  return (
    <Badge variant={VARIANTES[situacao]} title={titulo} className={className}>
      {ROTULOS_SITUACAO[situacao]}
    </Badge>
  )
}
