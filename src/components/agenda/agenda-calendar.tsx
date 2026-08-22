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
  const inicioMes = startOfMonth(mes)
  const hoje = startOfDay(new Date())
  const mesAtual = startOfMonth(hoje)
  const grade = eachDayOfInterval({
    start: startOfWeek(inicioMes, { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(inicioMes), { weekStartsOn: 0 }),
  })

  return (
    <section aria-label={`Calendário de ${format(inicioMes, "MMMM 'de' yyyy", { locale: ptBR })}`}>
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
          <div key={dia} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
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
                <span className="metric-number inline-flex min-w-6 items-center justify-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary sm:text-xs">
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
