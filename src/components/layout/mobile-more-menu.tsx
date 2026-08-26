import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileDown,
  HardDrive,
  Info,
  Menu,
  Moon,
  Scissors,
  ShieldCheck,
  Smartphone,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataSourceCard } from '@/components/layout/data-source-card'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useBarberData } from '@/hooks/use-barber-data'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { useTema } from '@/hooks/use-theme'
import { baixarBackup } from '@/lib/backup'
import { cn } from '@/lib/utils'

type TelaMais = 'menu' | 'dados' | 'sistema'

interface MoreMenuItemProps {
  icone: LucideIcon
  titulo: string
  descricao: string
  detalhe?: string
  para?: string
  aoClicar?: () => void
}

function MoreMenuItem({ icone: Icone, titulo, descricao, detalhe, para, aoClicar }: MoreMenuItemProps) {
  const conteudo = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icone aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">{descricao}</span>
      </span>
      {detalhe ? <span className="shrink-0 text-xs text-muted-foreground">{detalhe}</span> : null}
      <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  )

  if (para) {
    return (
      <Button asChild variant="ghost" className="h-auto min-h-control w-full justify-start gap-3 px-2 py-2">
        <Link to={para} onClick={aoClicar}>
          {conteudo}
        </Link>
      </Button>
    )
  }

  return (
    <Button type="button" variant="ghost" className="h-auto min-h-control w-full justify-start gap-3 px-2 py-2" onClick={aoClicar}>
      {conteudo}
    </Button>
  )
}

function CabecalhoInterno({ titulo, aoVoltar }: { titulo: string; aoVoltar: () => void }) {
  return (
    <div className="flex items-center gap-2 pr-10">
      <Button type="button" variant="ghost" size="iconSm" aria-label="Voltar ao menu Mais" onClick={aoVoltar}>
        <ArrowLeft aria-hidden />
      </Button>
      <h2 className="heading-display text-xl font-semibold">{titulo}</h2>
    </div>
  )
}

function ConteudoDados({ aoVoltar }: { aoVoltar: () => void }) {
  const online = useOnlineStatus()
  const { usandoSupabase, fonte, clientes, servicos, visitas } = useBarberData()

  function exportarBackup() {
    const resumo = baixarBackup({ fonte, clientes, servicos, visitas })
    toast.success('Backup exportado', {
      description: `${resumo.clientes} clientes, ${resumo.servicos} serviços e ${resumo.visitas} visitas salvos no arquivo.`,
    })
  }

  return (
    <div className="space-y-4">
      <CabecalhoInterno titulo="Dados e segurança" aoVoltar={aoVoltar} />
      <DataSourceCard className="bg-muted/25" mostrarBackup={false} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {online ? <Wifi aria-hidden className="h-4 w-4 text-emerald-500" /> : <WifiOff aria-hidden className="h-4 w-4 text-destructive" />}
            {online ? 'Conectado à internet' : 'Modo offline ativo'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {online ? 'O aplicativo está pronto para sincronizar quando uma base online estiver ativa.' : 'Você pode continuar usando os dados que já estão neste aparelho.'}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck aria-hidden className="h-4 w-4 text-primary" />
            {usandoSupabase ? 'Base sincronizada' : 'Somente neste aparelho'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {usandoSupabase
              ? 'Os registros usam a base configurada para a barbearia.'
              : 'Os registros ficam neste navegador e não aparecem automaticamente em outro aparelho.'}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <FileDown aria-hidden className="h-4 w-4 text-primary" /> Exportar backup
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Baixe uma cópia em JSON com clientes, serviços, visitas e valores históricos.
        </p>
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={exportarBackup}>
          <Download aria-hidden /> Baixar backup agora
        </Button>
      </div>
    </div>
  )
}

function ConteudoSistema({ aoVoltar, instalado }: { aoVoltar: () => void; instalado: boolean }) {
  return (
    <div className="space-y-4">
      <CabecalhoInterno titulo="Informações do sistema" aoVoltar={aoVoltar} />
      <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
        <Logo className="mx-auto w-48 max-w-full" />
        <p className="mt-4 font-semibold">Barber Control</p>
        <p className="mt-1 text-xs text-muted-foreground">MVP 0.1 · André Garcia Barber Shop</p>
      </div>
      <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
        <div className="flex items-center justify-between gap-4 p-3">
          <dt className="text-muted-foreground">Modo de uso</dt>
          <dd className="font-medium">{instalado ? 'Aplicativo instalado' : 'Navegador'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-3">
          <dt className="text-muted-foreground">Interface</dt>
          <dd className="font-medium">Responsiva</dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-3">
          <dt className="text-muted-foreground">Idioma</dt>
          <dd className="font-medium">Português (Brasil)</dd>
        </div>
      </dl>
    </div>
  )
}

export function MobileMoreMenu() {
  const [aberto, setAberto] = React.useState(false)
  const [tela, setTela] = React.useState<TelaMais>('menu')
  const localizacao = useLocation()
  const { tema, alternarTema } = useTema()
  const { instalado, podeInstalar, instalar } = usePwaInstall()
  const ativo = localizacao.pathname.startsWith('/servicos')

  function mudarAberto(novoEstado: boolean) {
    setAberto(novoEstado)
    if (!novoEstado) setTela('menu')
  }

  async function solicitarInstalacao() {
    if (instalado) {
      toast.info('O Barber Control já está instalado neste aparelho.')
      return
    }

    const resultado = await instalar()
    if (resultado === 'indisponivel') {
      toast.info('Use a opção “Adicionar à tela inicial” no menu do navegador para instalar o aplicativo.')
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={mudarAberto}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Abrir mais opções"
          className={cn(
            'type-nav relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 font-medium tracking-tight transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            ativo ? 'text-gold-600 dark:text-gold-300' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', ativo && 'bg-primary/15')}>
            <Menu aria-hidden className={cn('h-5 w-5', ativo && 'text-primary')} />
          </span>
          <span>Mais</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:inset-x-0 sm:bottom-0 sm:left-auto sm:top-auto sm:w-full sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-b-none sm:rounded-t-2xl sm:p-5">
        <div className="mx-auto w-full max-w-lg">
          {tela === 'dados' ? <ConteudoDados aoVoltar={() => setTela('menu')} /> : null}
          {tela === 'sistema' ? <ConteudoSistema aoVoltar={() => setTela('menu')} instalado={instalado} /> : null}
          {tela === 'menu' ? (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle>Mais opções</DialogTitle>
                <DialogDescription>Serviços, preferências e informações do aplicativo.</DialogDescription>
              </DialogHeader>

              <div className="space-y-1">
                <MoreMenuItem icone={Scissors} titulo="Serviços" descricao="Preços, duração e disponibilidade" para="/servicos" aoClicar={() => mudarAberto(false)} />
              </div>

              <Separator />

              <div className="space-y-1">
                <MoreMenuItem
                  icone={tema === 'escuro' ? Sun : Moon}
                  titulo={tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'}
                  descricao="Ajuste a aparência do aplicativo"
                  detalhe={tema === 'escuro' ? 'Escuro' : 'Claro'}
                  aoClicar={alternarTema}
                />
                <MoreMenuItem
                  icone={instalado ? Smartphone : Download}
                  titulo="Instalar aplicativo"
                  descricao={podeInstalar ? 'Adicione o Barber Control ao celular' : 'Use como aplicativo na tela inicial'}
                  detalhe={instalado ? 'Instalado' : undefined}
                  aoClicar={() => void solicitarInstalacao()}
                />
              </div>

              <Separator />

              <div className="space-y-1">
                <MoreMenuItem icone={HardDrive} titulo="Dados e segurança" descricao="Origem dos dados e conexão" aoClicar={() => setTela('dados')} />
                <MoreMenuItem icone={Info} titulo="Informações do sistema" descricao="Versão e modo de uso" aoClicar={() => setTela('sistema')} />
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
