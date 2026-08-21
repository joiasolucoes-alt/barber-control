import * as React from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldProps {
  id: string
  rotulo: string
  erro?: string
  dica?: string
  obrigatorio?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode
}

/** Agrupa label, controle, dica e mensagem de erro com os vínculos de acessibilidade. */
export function Field({ id, rotulo, erro, dica, obrigatorio, className, children }: FieldProps) {
  const idErro = `${id}-erro`
  const idDica = `${id}-dica`
  const describedBy = [erro ? idErro : null, dica ? idDica : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children({ id, 'aria-invalid': Boolean(erro), 'aria-describedby': describedBy })}
      {dica && !erro ? (
        <p id={idDica} className="text-xs text-muted-foreground">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={idErro} role="alert" className="text-xs font-medium text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  )
}
