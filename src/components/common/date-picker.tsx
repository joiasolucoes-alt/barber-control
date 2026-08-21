import * as React from 'react'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dataISOParaDate, dateParaDataISO, formatarData } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DataISO } from '@/types'

interface DatePickerProps {
  valor: DataISO | null
  aoMudar: (valor: DataISO | null) => void
  placeholder?: string
  /** Bloqueia datas futuras — visitas registram o que já aconteceu. */
  bloquearFuturo?: boolean
  id?: string
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function DatePicker({
  valor,
  aoMudar,
  placeholder = 'Selecione uma data',
  bloquearFuturo = false,
  id,
  className,
  ...aria
}: DatePickerProps) {
  const [aberto, setAberto] = React.useState(false)
  const selecionada = valor ? dataISOParaDate(valor) : undefined

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn('w-full justify-start font-normal', !valor && 'text-muted-foreground', className)}
          {...aria}
        >
          <CalendarDays aria-hidden />
          {valor ? formatarData(valor) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar
          mode="single"
          selected={selecionada}
          defaultMonth={selecionada}
          onSelect={(data) => {
            aoMudar(data ? dateParaDataISO(data) : null)
            setAberto(false)
          }}
          disabled={bloquearFuturo ? { after: new Date() } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
