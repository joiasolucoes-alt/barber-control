import * as React from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { dateParaDataISO, pluralizar } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ResumoAgendaDia } from '@/lib/agenda'
import type { DataISO } from '@/types'

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface AgendaCalendarProps {
  mes: Date
  dias: Map<DataISO, ResumoAgendaDia>
  dataSelecionada: DataISO | null
  aoMudarMes: (mes: Date) => void
  aoSelecionarData: (data: DataISO) => void
}

export function AgendaCalendar({
  mes,
  dias,
  dataSelecionada,
  aoMudarMes,
  aoSelecionarData,
}: AgendaCalendarProps) {
  const inicioGesto = React.useRef<{ x: number; y: number } | null>(null)
  const inicioMes = startOfMonth(mes)
  const hoje = startOfDay(new Date())
  const mesAtual = startOfMonth(hoje)
  const grade = eachDayOfInterval({
    start: startOfWeek(inicioMes, { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(inicioMes), { weekStartsOn: 0 }),
  })

  function iniciarGesto(evento: React.TouchEvent) {
    const toque = evento.touches[0]
    inicioGesto.current = { x: toque.clientX, y: toque.clientY }
  }

  function finalizarGesto(evento: React.TouchEvent) {
    const inicio = inicioGesto.current
    inicioGesto.current = null
    if (!inicio) return
    const toque = evento.changedTouches[0]
    const deltaX = toque.clientX - inicio.x
    const deltaY = toque.clientY - inicio.y
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) <= Math.abs(deltaY)) return

    if (deltaX > 0) {
      aoMudarMes(new Date(inicioMes.getFullYear(), inicioMes.getMonth() - 1, 1))
    } else if (isAfter(mesAtual, inicioMes)) {
      aoMudarMes(new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1))
    }
  }

  return (
    <section
      aria-label={`Calendário de ${format(inicioMes, "MMMM 'de' yyyy", { locale: ptBR })}`}
      onTouchStart={iniciarGesto}
      onTouchEnd={finalizarGesto}
      className="touch-pan-y"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mês anterior"
          onClick={() => aoMudarMes(new Date(inicioMes.getFullYear(), inicioMes.getMonth() - 1, 1))}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div className="min-w-0 text-center">
          <h2 className="heading-display truncate text-lg font-semibold">
            {format(inicioMes, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          {!isSameMonth(inicioMes, mesAtual) ? (
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => aoMudarMes(mesAtual)}
            >
              Voltar para este mês
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Próximo mês"
          disabled={!isAfter(mesAtual, inicioMes)}
          onClick={() => aoMudarMes(new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-muted/30 px-1 py-2 sm:px-2">
        {DIAS_DA_SEMANA.map((dia) => (
          <div key={dia} className="text-center text-meta font-semibold uppercase tracking-tight text-muted-foreground sm:tracking-wide">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 p-1 sm:p-2">
        {grade.map((data) => {
          const dataISO = dateParaDataISO(data)
          const resumo = dias.get(dataISO)
          const pertenceAoMes = isSameMonth(data, inicioMes)
          const futuro = isAfter(data, hoje)
          const selecionado = dataSelecionada === dataISO
          const rotuloAtendimentos = resumo
            ? `${resumo.atendimentos} ${pluralizar(resumo.atendimentos, 'atendimento', 'atendimentos')}`
            : 'nenhum atendimento'

          return (
            <button
              key={dataISO}
              type="button"
              disabled={!pertenceAoMes || futuro}
              aria-label={`${format(data, "dd 'de' MMMM", { locale: ptBR })}, ${rotuloAtendimentos}`}
              aria-pressed={selecionado}
              onClick={() => aoSelecionarData(dataISO)}
              className={cn(
                'relative flex min-h-[3.9rem] min-w-0 flex-col items-center justify-between rounded-lg px-0.5 py-1.5 text-sm transition-colors sm:min-h-20 sm:p-2',
                'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring',
                pertenceAoMes && !futuro && 'hover:bg-accent/70',
                !pertenceAoMes && 'invisible',
                futuro && pertenceAoMes && 'cursor-not-allowed text-muted-foreground/35',
                selecionado && 'bg-primary/15 ring-1 ring-primary/50',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full font-semibold tabular-nums',
                  isSameDay(data, hoje) && 'bg-primary text-primary-foreground',
                )}
              >
                {format(data, 'd')}
              </span>
              {resumo && resumo.atendimentos > 0 ? (
                <span className="metric-number inline-flex min-w-6 items-center justify-center rounded-full bg-primary/15 px-1.5 py-0.5 text-meta text-primary">
                  {resumo.atendimentos}
                </span>
              ) : (
                <span aria-hidden className="h-5" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
