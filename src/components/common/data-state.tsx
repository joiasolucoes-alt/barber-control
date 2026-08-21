import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function ErrorState({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-12 text-center"
    >
      <AlertTriangle aria-hidden className="h-8 w-8 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">Não foi possível carregar os dados</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{mensagem}</p>
      </div>
      {aoTentarNovamente ? (
        <Button variant="outline" onClick={aoTentarNovamente}>
          <RefreshCw /> Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}

export function TableSkeleton({ linhas = 6, colunas = 4 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      {Array.from({ length: linhas }).map((_, indiceLinha) => (
        <div key={indiceLinha} className="flex items-center gap-4">
          {Array.from({ length: colunas }).map((__, indiceColuna) => (
            <Skeleton key={indiceColuna} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardsSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: quantidade }).map((_, indice) => (
        <Skeleton key={indice} className="h-[104px] rounded-xl" />
      ))}
    </div>
  )
}
