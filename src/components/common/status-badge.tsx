import { Badge } from '@/components/ui/badge'
import type { StatusRegistro } from '@/types'

export function StatusBadge({ status }: { status: StatusRegistro }) {
  return (
    <Badge variant={status === 'ativo' ? 'success' : 'muted'}>{status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>
  )
}
