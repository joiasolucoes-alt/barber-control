import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { DatePicker } from '@/components/common/date-picker'
import { Field } from '@/components/common/field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { formatarTelefone } from '@/lib/format'
import { clienteSchema, type ClienteFormValues } from '@/lib/validators'
import type { Cliente } from '@/types'

interface ClienteFormDialogProps {
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  /** Quando presente, o formulário entra em modo de edição. */
  cliente?: Cliente | null
  aoSalvar?: (cliente: Cliente) => void
}

const VALORES_PADRAO: ClienteFormValues = {
  nome: '',
  telefone: '',
  data_nascimento: '',
  observacoes: '',
  status: 'ativo',
}

export function ClienteFormDialog({ aberto, aoMudarAberto, cliente, aoSalvar }: ClienteFormDialogProps) {
  const { criarCliente, atualizarCliente } = useBarberData()
  const emEdicao = Boolean(cliente)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: VALORES_PADRAO,
  })

  React.useEffect(() => {
    if (!aberto) return
    reset(
      cliente
        ? {
            nome: cliente.nome,
            telefone: cliente.telefone ?? '',
            data_nascimento: cliente.data_nascimento ?? '',
            observacoes: cliente.observacoes ?? '',
            status: cliente.status,
          }
        : VALORES_PADRAO,
    )
  }, [aberto, cliente, reset])

  const status = watch('status')

  async function enviar(valores: ClienteFormValues) {
    try {
      const payload = {
        nome: valores.nome,
        telefone: valores.telefone || null,
        data_nascimento: valores.data_nascimento || null,
        observacoes: valores.observacoes || null,
        status: valores.status,
      }
      const salvo = cliente
        ? await atualizarCliente(cliente.id, payload)
        : await criarCliente(payload)

      toast.success(emEdicao ? 'Cliente atualizado' : 'Cliente cadastrado', {
        description: `${salvo.nome} foi ${emEdicao ? 'atualizado' : 'adicionado'} com sucesso.`,
      })
      aoSalvar?.(salvo)
      aoMudarAberto(false)
    } catch (erro) {
      toast.error('Não foi possível salvar', {
        description: erro instanceof Error ? erro.message : 'Tente novamente em instantes.',
      })
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{emEdicao ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          <DialogDescription>
            {emEdicao
              ? 'Atualize os dados cadastrais do cliente.'
              : 'A data de cadastro é preenchida automaticamente no momento do registro.'}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(enviar)} className="space-y-4">
          <Field id="cliente-nome" rotulo="Nome completo" obrigatorio erro={errors.nome?.message}>
            {(props) => (
              <Input
                {...props}
                {...register('nome')}
                placeholder="Ex.: Rafael Almeida"
                autoComplete="name"
                maxLength={120}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="cliente-telefone"
              rotulo="Telefone / WhatsApp"
              erro={errors.telefone?.message}
              dica="Opcional, mas necessário para as ações de retorno"
            >
              {(props) => (
                <Input
                  {...props}
                  {...register('telefone')}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 98888-7777"
                  onChange={(evento) => setValue('telefone', formatarTelefone(evento.target.value), { shouldValidate: true })}
                />
              )}
            </Field>

            <Field
              id="cliente-nascimento"
              rotulo="Data de nascimento"
              erro={errors.data_nascimento?.message}
              dica="Opcional"
            >
              {(props) => (
                <Controller
                  control={control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <DatePicker
                      id={props.id}
                      aria-invalid={props['aria-invalid']}
                      aria-describedby={props['aria-describedby']}
                      valor={field.value || null}
                      aoMudar={(valor) => field.onChange(valor ?? '')}
                      placeholder="Selecione a data"
                      bloquearFuturo
                    />
                  )}
                />
              )}
            </Field>
          </div>

          <Field id="cliente-observacoes" rotulo="Observações" erro={errors.observacoes?.message} dica="Opcional">
            {(props) => (
              <Textarea
                {...props}
                {...register('observacoes')}
                placeholder="Preferências de corte, indicações, alergias..."
                maxLength={500}
              />
            )}
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="cliente-status">Cliente ativo</Label>
              <p className="text-xs text-muted-foreground">Clientes inativos deixam de aparecer nas listagens padrão.</p>
            </div>
            <Switch
              id="cliente-status"
              checked={status === 'ativo'}
              onCheckedChange={(marcado) => setValue('status', marcado ? 'ativo' : 'inativo')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => aoMudarAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
