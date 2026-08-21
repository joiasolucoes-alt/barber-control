import * as React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  titulo: string
  descricao: React.ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  destrutivo?: boolean
  aoConfirmar: () => void | Promise<void>
}

/** Confirmação reutilizada em inativação de cliente/serviço e exclusão de visita. */
export function ConfirmDialog({
  aberto,
  aoMudarAberto,
  titulo,
  descricao,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  destrutivo = false,
  aoConfirmar,
}: ConfirmDialogProps) {
  const [processando, setProcessando] = React.useState(false)

  async function confirmar(evento: React.MouseEvent) {
    evento.preventDefault()
    setProcessando(true)
    try {
      await aoConfirmar()
      aoMudarAberto(false)
    } finally {
      setProcessando(false)
    }
  }

  return (
    <AlertDialog open={aberto} onOpenChange={aoMudarAberto}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmar}
            disabled={processando}
            className={cn(destrutivo && buttonVariants({ variant: 'destructive' }))}
          >
            {processando ? 'Processando...' : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
