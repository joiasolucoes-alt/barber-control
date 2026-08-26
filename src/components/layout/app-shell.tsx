import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Moon, Plus, Sun, WifiOff } from 'lucide-react'

import { DataSourceCard } from '@/components/layout/data-source-card'
import { Logo } from '@/components/layout/logo'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { NAVEGACAO_ADMINISTRATIVA, NAVEGACAO_PRINCIPAL } from '@/components/layout/navigation'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { VisitaFormDialog } from '@/components/visitas/visita-form-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useTema } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

function BotaoTema() {
  const { tema, alternarTema } = useTema()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={alternarTema}
      aria-label={tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {tema === 'escuro' ? <Sun /> : <Moon />}
    </Button>
  )
}

export function AppShell() {
  const [visitaAberta, setVisitaAberta] = React.useState(false)
  const [cabecalhoElevado, setCabecalhoElevado] = React.useState(false)
  const online = useOnlineStatus()
  const abrirNovaVisita = React.useCallback(() => setVisitaAberta(true), [])
  const contextoOutlet = React.useMemo(() => ({ abrirNovaVisita }), [abrirNovaVisita])

  React.useEffect(() => {
    function atualizarElevacao() {
      setCabecalhoElevado(window.scrollY > 8)
    }

    atualizarElevacao()
    window.addEventListener('scroll', atualizarElevacao, { passive: true })
    return () => window.removeEventListener('scroll', atualizarElevacao)
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>

      {/* Menu lateral fixo no desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <Logo className="w-full" />
        <div className="gold-divider my-5" />
        <SidebarNav itens={NAVEGACAO_PRINCIPAL} />
        <div className="mt-auto space-y-3 pt-6">
          <Button type="button" className="w-full" onClick={() => setVisitaAberta(true)}>
            <Plus aria-hidden /> Registrar visita
          </Button>
          <div className="rounded-xl border border-border bg-muted/20 p-2">
            <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Administração
            </p>
            <SidebarNav itens={NAVEGACAO_ADMINISTRATIVA} rotulo="Navegação administrativa" />
          </div>
          <DataSourceCard />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className={cn(
            'sticky top-0 z-30 border-b border-border pt-[env(safe-area-inset-top)] backdrop-blur transition-[background-color,box-shadow]',
            cabecalhoElevado ? 'bg-background/95 shadow-sm' : 'bg-background/85',
          )}
        >
          <div className="flex min-h-14 items-center justify-end gap-2 px-3 sm:px-6 lg:min-h-16">
            <div className="mr-auto flex min-w-0 items-center gap-2 lg:hidden">
              <Logo compacto className="h-10 w-10 shrink-0" />
              <span className="hidden truncate text-sm font-semibold min-[360px]:block">Barber Control</span>
            </div>

            <Badge variant="outline" className="hidden md:inline-flex">
              Registro de atendimentos
            </Badge>
            {!online ? (
              <Badge variant="danger" aria-live="polite" className="gap-1.5">
                <WifiOff aria-hidden className="h-3.5 w-3.5" /> Sem conexão
              </Badge>
            ) : null}
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <BotaoTema />
            <Button type="button" className="hidden lg:inline-flex" onClick={() => setVisitaAberta(true)}>
              <Plus aria-hidden /> Nova visita
            </Button>
          </div>
        </header>

        <main id="conteudo-principal" className="animate-fade-in px-3 py-5 pb-36 sm:px-6 sm:py-6 lg:py-8">
          <Outlet context={contextoOutlet} />
        </main>

        <footer className="border-t border-border px-4 py-6 pb-28 text-xs text-muted-foreground sm:px-6 lg:pb-6">
          André Garcia Barber Shop · controle de clientes e atendimentos realizados.
        </footer>
      </div>

      <MobileBottomNav aoNovaVisita={() => setVisitaAberta(true)} />
      <VisitaFormDialog aberto={visitaAberta} aoMudarAberto={setVisitaAberta} />
    </div>
  )
}
