import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'

export function NaoEncontradoPage() {
  return (
    <EmptyState
      icone={<Compass />}
      titulo="Página não encontrada"
      descricao="O endereço acessado não existe no sistema da André Garcia Barber Shop."
      acao={
        <Button asChild>
          <Link to="/">Voltar para o dashboard</Link>
        </Button>
      }
    />
  )
}
