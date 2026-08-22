import { MessageCircle } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { linkWhatsApp } from '@/lib/clientes-analise'
import type { Cliente } from '@/types'

interface BotaoWhatsAppProps extends Pick<ButtonProps, 'variant' | 'size' | 'className'> {
  cliente: Cliente
  mensagem?: string
  rotulo?: string
  /** Mostra apenas o ícone, com o nome do cliente no rótulo acessível. */
  somenteIcone?: boolean
}

/**
 * Abre a conversa no WhatsApp com mensagem pronta.
 * Não renderiza nada quando o cliente não tem telefone — o campo é opcional.
 */
export function BotaoWhatsApp({
  cliente,
  mensagem,
  rotulo = 'WhatsApp',
  somenteIcone = false,
  variant = 'outline',
  size,
  className,
}: BotaoWhatsAppProps) {
  const link = linkWhatsApp(cliente, mensagem)
  if (!link) return null

  return (
    <Button asChild variant={variant} size={somenteIcone ? 'iconSm' : size} className={className}>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={somenteIcone ? `Conversar com ${cliente.nome} no WhatsApp` : undefined}
      >
        <MessageCircle aria-hidden />
        {somenteIcone ? null : rotulo}
      </a>
    </Button>
  )
}
