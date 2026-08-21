import { cn } from '@/lib/utils'

export function Logo({ compacto = false, className }: { compacto?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold-500/40 bg-graphite-950 text-gold-400"
      >
        <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round">
          <path d="M18 16 L46 46" />
          <path d="M46 16 L18 46" />
          <circle cx="16" cy="50" r="6" />
          <circle cx="48" cy="50" r="6" />
        </svg>
      </span>
      {!compacto ? (
        <span className="leading-tight">
          <span className="heading-display block text-base font-semibold">Barber Control</span>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Controle de clientes
          </span>
        </span>
      ) : null}
    </div>
  )
}
