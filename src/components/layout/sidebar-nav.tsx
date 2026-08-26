import { NavLink } from 'react-router-dom'

import { NAVEGACAO, type ItemNavegacao } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  aoNavegar?: () => void
  itens?: ItemNavegacao[]
  rotulo?: string
}

export function SidebarNav({ aoNavegar, itens = NAVEGACAO, rotulo = 'Navegação principal' }: SidebarNavProps) {
  return (
    <nav aria-label={rotulo} className="flex flex-col gap-1">
      {itens.map((item) => {
        const Icone = item.icone
        return (
          <NavLink
            key={item.para}
            to={item.para}
            end={item.exato}
            onClick={aoNavegar}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'bg-primary/12 text-gold-600 dark:text-gold-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icone aria-hidden className={cn('h-[18px] w-[18px]', isActive && 'text-primary')} />
                <span className="flex-1">{item.rotulo}</span>
                <span
                  aria-hidden
                  className={cn('h-5 w-1 rounded-full bg-primary transition-opacity', isActive ? 'opacity-100' : 'opacity-0')}
                />
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
