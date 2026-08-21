import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-card text-card-foreground shadow-lg',
          description: 'text-muted-foreground',
        },
      }}
    />
  )
}

export { toast } from 'sonner'
