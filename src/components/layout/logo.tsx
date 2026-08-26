import { cn } from '@/lib/utils'

export function Logo({ compacto = false, className }: { compacto?: boolean; className?: string }) {
  if (!compacto) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-gold-500/30 bg-black shadow-sm shadow-black/20',
          className,
        )}
      >
        <img
          src="/logo-andre-garcia.png"
          alt="André Garcia Barber Shop"
          width={306}
          height={175}
          className="h-auto w-full"
          decoding="async"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'aspect-square overflow-hidden rounded-xl border border-gold-500/30 bg-black shadow-sm shadow-black/20',
        className,
      )}
    >
      <img
        src="/andre-garcia-icon-192x192.png"
        alt="André Garcia Barber Shop"
        width={192}
        height={192}
        className="h-full w-full"
        decoding="async"
      />
    </div>
  )
}
