import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { NAVEGACAO } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Navegação principal para telas pequenas, respeitando a área segura do aparelho. */
export function MobileBottomNav({ aoNovaVisita }: { aoNovaVisita: () => void }) {
  const primeiros = NAVEGACAO.slice(0, 2)
  const ultimos = NAVEGACAO.slice(2)

  function links(itens: typeof NAVEGACAO) {
    return itens.map((item) => {
      const Icone = item.icone
      return (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.exato}
          className={({ isActive }) =>
            cn(
              'relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[9px] font-medium transition-colors min-[380px]:text-[10px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
              isActive ? 'text-gold-600 dark:text-gold-300' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7 w-10 items-center justify-center rounded-full transition-colors min-[380px]:w-12',
                  isActive && 'bg-primary/15',
                )}
              >
                <Icone aria-hidden className={cn('h-5 w-5', isActive && 'text-primary')} />
              </span>
              <span className="w-full truncate text-center">{item.rotulo}</span>
            </>
          )}
        </NavLink>
      )
    })
  }

  return (
    <nav
      aria-label="Navegação principal no celular"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-6">
        {links(primeiros)}
        <div className="relative flex flex-col items-center justify-end pb-1 text-[9px] font-medium text-primary min-[380px]:text-[10px]">
          <Button
            type="button"
            size="icon"
            aria-label="Registrar nova visita"
            onClick={aoNovaVisita}
            className="absolute -top-4 h-12 w-12 rounded-full border-4 border-background shadow-lg shadow-black/30 min-[380px]:-top-5 min-[380px]:h-14 min-[380px]:w-14"
          >
            <Plus aria-hidden className="h-6 w-6" />
          </Button>
          <span>Visita</span>
        </div>
        {links(ultimos)}
      </div>
    </nav>
  )
}
