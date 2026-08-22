import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Database, HardDrive, Moon, Plus, Sun, WifiOff } from 'lucide-react'

import { Logo } from '@/components/layout/logo'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { NAVEGACAO } from '@/components/layout/navigation'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { VisitaFormDialog } from '@/components/visitas/visita-form-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useBarberData } from '@/hooks/use-barber-data'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useTema } from '@/hooks/use-theme'

function FonteDeDados() {
  const { fonte, usandoSupabase } = useBarberData()
  const Icone = usandoSupabase ? Database : HardDrive

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="flex items-center gap-2 text-xs font-medium">
        <Icone aria-hidden className="h-3.5 w-3.5 text-primary" />
        Fonte de dados
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{fonte}</p>
      {!usandoSupabase ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Preencha o <code className="rounded bg-muted px-1">.env</code> com as credenciais do Supabase para migrar a
          base sem alterar as telas.
        </p>
      ) : null}
    </div>
  )
}

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
  const localizacao = useLocation()
  const online = useOnlineStatus()

  const tituloAtual =
    NAVEGACAO.find((item) =>
      item.exato ? localizacao.pathname === item.para : localizacao.pathname.startsWith(item.para),
    )?.rotulo ?? 'André Garcia'

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
        <SidebarNav />
        <div className="mt-auto space-y-3 pt-6">
          <Button type="button" className="w-full" onClick={() => setVisitaAberta(true)}>
            <Plus aria-hidden /> Registrar visita
          </Button>
          <FonteDeDados />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex min-h-[4.75rem] items-center gap-3 px-3 py-2 sm:px-6 lg:min-h-16 lg:py-0">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="lg:hidden">
                <Logo compacto className="w-24 shrink-0 min-[360px]:w-28" />
              </span>
              <span className="min-w-0">
                <span className="heading-display block truncate text-lg font-bold leading-none sm:text-xl lg:text-sm lg:font-semibold">
                  {tituloAtual}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  Controle de clientes e atendimentos
                </span>
              </span>
            </div>

            <Badge variant="outline" className="hidden sm:inline-flex">
              Registro de atendimentos
            </Badge>
            {!online ? (
              <Badge variant="danger" aria-live="polite" className="gap-1.5">
                <WifiOff aria-hidden className="h-3.5 w-3.5" /> Sem conexão
              </Badge>
            ) : null}
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <BotaoTema />
            <Button type="button" className="hidden lg:inline-flex" onClick={() => setVisitaAberta(true)}>
              <Plus aria-hidden /> Nova visita
            </Button>
          </div>
        </header>

        <main id="conteudo-principal" className="animate-fade-in px-3 py-5 pb-36 sm:px-6 sm:py-6 lg:py-8">
          <Outlet />
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
