import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Database, HardDrive, Menu, Moon, Plus, Sun } from 'lucide-react'

import { Logo } from '@/components/layout/logo'
import { NAVEGACAO } from '@/components/layout/navigation'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { VisitaFormDialog } from '@/components/visitas/visita-form-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useBarberData } from '@/hooks/use-barber-data'
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
  const [menuAberto, setMenuAberto] = React.useState(false)
  const [visitaAberta, setVisitaAberta] = React.useState(false)
  const localizacao = useLocation()

  const tituloAtual =
    NAVEGACAO.find((item) =>
      item.exato ? localizacao.pathname === item.para : localizacao.pathname.startsWith(item.para),
    )?.rotulo ?? 'Barber Control'

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
        <Logo />
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
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetTitle className="sr-only">Menu principal</SheetTitle>
                <Logo />
                <div className="gold-divider my-5" />
                <SidebarNav aoNavegar={() => setMenuAberto(false)} />
                <div className="mt-auto space-y-3 pt-6">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setMenuAberto(false)
                      setVisitaAberta(true)
                    }}
                  >
                    <Plus aria-hidden /> Registrar visita
                  </Button>
                  <FonteDeDados />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="lg:hidden">
                <Logo compacto />
              </span>
              <span className="hidden min-w-0 lg:block">
                <span className="heading-display block truncate text-sm font-semibold">{tituloAtual}</span>
                <span className="block text-xs text-muted-foreground">Controle de clientes e atendimentos</span>
              </span>
            </div>

            <Badge variant="outline" className="hidden sm:inline-flex">
              Registro de atendimentos
            </Badge>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <BotaoTema />
            <Button type="button" className="hidden sm:inline-flex" onClick={() => setVisitaAberta(true)}>
              <Plus aria-hidden /> Nova visita
            </Button>
            <Button
              type="button"
              size="icon"
              className="sm:hidden"
              aria-label="Registrar visita"
              onClick={() => setVisitaAberta(true)}
            >
              <Plus />
            </Button>
          </div>
        </header>

        <main id="conteudo-principal" className="animate-fade-in px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-border px-4 py-6 text-xs text-muted-foreground sm:px-6">
          Barber Control · sistema de controle de clientes e atendimentos realizados.
        </footer>
      </div>

      <VisitaFormDialog aberto={visitaAberta} aoMudarAberto={setVisitaAberta} />
    </div>
  )
}
