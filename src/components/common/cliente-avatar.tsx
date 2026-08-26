import { iniciais } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ClienteAvatarProps {
  nome: string
  className?: string
}

export function ClienteAvatar({ nome, className }: ClienteAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-gold-700 dark:text-gold-300',
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  )
}
