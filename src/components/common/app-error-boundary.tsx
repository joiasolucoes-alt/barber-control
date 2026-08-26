import * as React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface AppErrorBoundaryState {
  falhou: boolean
}

/** Última barreira contra telas em branco causadas por erros inesperados de renderização. */
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { falhou: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { falhou: true }
  }

  componentDidCatch(erro: Error, info: React.ErrorInfo) {
    console.error('Erro inesperado na interface.', erro, info)
  }

  render() {
    if (!this.state.falhou) return this.props.children

    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
        <div role="alert" className="w-full max-w-md space-y-4 rounded-xl border border-destructive/40 bg-card p-6 text-center shadow-xl">
          <AlertTriangle aria-hidden className="mx-auto h-9 w-9 text-destructive" />
          <div className="space-y-1">
            <h1 className="heading-display text-xl font-semibold">Algo não saiu como esperado</h1>
            <p className="text-sm text-muted-foreground">
              Seus dados não foram apagados. Recarregue o app para tentar novamente.
            </p>
          </div>
          <Button type="button" onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden /> Recarregar aplicativo
          </Button>
        </div>
      </main>
    )
  }
}
