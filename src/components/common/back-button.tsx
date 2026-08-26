import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  para: string
  rotulo: string
  className?: string
}

/** Ação de retorno consistente para páginas internas e estados alternativos. */
export function BackButton({ para, rotulo, className }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className={cn('-ml-2 w-fit text-muted-foreground', className)}>
      <Link to={para}>
        <ArrowLeft aria-hidden /> {rotulo}
      </Link>
    </Button>
  )
}
