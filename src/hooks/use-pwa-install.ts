import * as React from 'react'

interface ResultadoInstalacao {
  outcome: 'accepted' | 'dismissed'
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<ResultadoInstalacao>
}

function emModoInstalado() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

export function usePwaInstall() {
  const [evento, setEvento] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = React.useState(emModoInstalado)

  React.useEffect(() => {
    function guardarEvento(novoEvento: Event) {
      novoEvento.preventDefault()
      setEvento(novoEvento as BeforeInstallPromptEvent)
    }

    function confirmarInstalacao() {
      setInstalado(true)
      setEvento(null)
    }

    window.addEventListener('beforeinstallprompt', guardarEvento)
    window.addEventListener('appinstalled', confirmarInstalacao)

    return () => {
      window.removeEventListener('beforeinstallprompt', guardarEvento)
      window.removeEventListener('appinstalled', confirmarInstalacao)
    }
  }, [])

  const instalar = React.useCallback(async () => {
    if (!evento) return 'indisponivel' as const
    await evento.prompt()
    const escolha = await evento.userChoice
    if (escolha.outcome === 'accepted') {
      setInstalado(true)
      setEvento(null)
    }
    return escolha.outcome
  }, [evento])

  return {
    instalado,
    podeInstalar: Boolean(evento) && !instalado,
    instalar,
  }
}
