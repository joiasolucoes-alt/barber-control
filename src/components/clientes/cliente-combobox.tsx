import * as React from 'react'
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { normalizar } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types'

interface ClienteComboboxProps {
  clientes: Cliente[]
  valor: string
  aoMudar: (clienteId: string) => void
  aoCadastrarNovo?: () => void
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/** Seletor de cliente com busca por nome ou telefone. */
export function ClienteCombobox({
  clientes,
  valor,
  aoMudar,
  aoCadastrarNovo,
  id,
  ...aria
}: ClienteComboboxProps) {
  const [aberto, setAberto] = React.useState(false)
  const [busca, setBusca] = React.useState('')

  const selecionado = clientes.find((cliente) => cliente.id === valor) ?? null

  const filtrados = React.useMemo(() => {
    const termo = normalizar(busca)
    if (!termo) return clientes
    return clientes.filter(
      (cliente) => normalizar(cliente.nome).includes(termo) || normalizar(cliente.telefone).includes(termo),
    )
  }, [busca, clientes])

  React.useEffect(() => {
    if (!aberto) setBusca('')
  }, [aberto])

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className={cn('w-full justify-between font-normal', !selecionado && 'text-muted-foreground')}
          {...aria}
        >
          <span className="truncate">{selecionado ? selecionado.nome : 'Selecione o cliente'}</span>
          <ChevronsUpDown aria-hidden className="opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0">
        <div className="border-b border-border p-2">
          <Input
            autoFocus
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome ou telefone"
            aria-label="Buscar cliente"
            className="h-9"
          />
        </div>

        <ul role="listbox" aria-label="Clientes" className="max-h-60 overflow-y-auto p-1">
          {filtrados.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</li>
          ) : (
            filtrados.map((cliente) => {
              const ativo = cliente.id === valor
              return (
                <li key={cliente.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={ativo}
                    onClick={() => {
                      aoMudar(cliente.id)
                      setAberto(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <ClienteAvatar nome={cliente.nome} className="h-8 w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{cliente.nome}</span>
                      <span className="block truncate text-xs text-muted-foreground">{cliente.telefone}</span>
                    </span>
                    {ativo ? <Check aria-hidden className="h-4 w-4 text-primary" /> : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {aoCadastrarNovo ? (
          <div className="border-t border-border p-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setAberto(false)
                aoCadastrarNovo()
              }}
            >
              <UserPlus aria-hidden /> Cadastrar novo cliente
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
