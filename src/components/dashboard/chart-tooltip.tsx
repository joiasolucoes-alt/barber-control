import type { TooltipProps } from 'recharts'

import { formatarNumero } from '@/lib/format'

/** Tooltip com o visual do painel, usado nos dois gráficos. */
export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((item) => (
        <p key={String(item.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}: <span className="font-semibold text-foreground">{formatarNumero(Number(item.value ?? 0))}</span>
        </p>
      ))}
    </div>
  )
}
