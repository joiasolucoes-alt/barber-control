import * as React from 'react'
import { CalendarPlus, Download, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/hooks/use-pwa-install'

const CHAVE_ORIENTACAO = 'barber-control:orientacao-inicial-v1'

function orientacaoJaVista(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(CHAVE_ORIENTACAO) === 'concluida'
  } catch {
    return false
  }
}

export function FirstRunGuide() {
  const [visivel, setVisivel] = React.useState(() => !orientacaoJaVista())
  const { instalado, podeInstalar, instalar } = usePwaInstall()

  function concluir() {
    try {
      window.localStorage.setItem(CHAVE_ORIENTACAO, 'concluida')
    } catch {
      // A orientação ainda pode ser fechada quando o armazenamento estiver indisponível.
    }
    setVisivel(false)
  }

  async function instalarAplicativo() {
    const resultado = await instalar()
    if (resultado === 'accepted') {
      toast.success('Aplicativo instalado', { description: 'O Barber Control foi adicionado ao seu celular.' })
      concluir()
    } else if (resultado === 'indisponivel') {
      toast.info('Adicionar à tela inicial', {
        description: 'Use esta opção no menu do navegador para instalar o aplicativo.',
      })
    }
  }

  if (!visivel) return null

  return (
    <aside
      aria-label="Primeiros passos no Barber Control"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-2xl border border-primary/30 bg-card p-4 shadow-elevated lg:bottom-5 lg:left-auto lg:right-5 lg:mx-0"
    >
      <Button type="button" variant="ghost" size="iconSm" className="absolute right-2 top-2" aria-label="Fechar primeiros passos" onClick={concluir}>
        <X aria-hidden />
      </Button>
      <div className="pr-8">
        <p className="heading-display text-lg font-semibold">Tudo pronto para começar</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Registre cada atendimento para manter agenda, receita e retorno dos clientes atualizados.
        </p>
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5">
          <CalendarPlus aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Use o botão central + Visita.
        </p>
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Faça backup em Mais → Dados.
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        {podeInstalar && !instalado ? (
          <Button type="button" size="sm" className="flex-1" onClick={() => void instalarAplicativo()}>
            <Download aria-hidden /> Instalar app
          </Button>
        ) : null}
        <Button type="button" size="sm" variant={podeInstalar && !instalado ? 'outline' : 'default'} className="flex-1" onClick={concluir}>
          Entendi
        </Button>
      </div>
    </aside>
  )
}
