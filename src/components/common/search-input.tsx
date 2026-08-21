import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  valor: string
  aoMudar: (valor: string) => void
  placeholder?: string
  rotulo: string
  className?: string
}

export function SearchInput({ valor, aoMudar, placeholder, rotulo, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={rotulo}
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {valor ? (
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          aria-label="Limpar busca"
          onClick={() => aoMudar('')}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X />
        </Button>
      ) : null}
    </div>
  )
}
