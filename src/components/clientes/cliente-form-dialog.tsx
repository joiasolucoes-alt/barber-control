import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { ConfirmDialog } from '@/components/common/confirm-dialog'
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
  const [maisInformacoesAberto, setMaisInformacoesAberto] = React.useState(false)
  const [confirmarDescarte, setConfirmarDescarte] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: VALORES_PADRAO,
  })

  React.useEffect(() => {
    if (!aberto) return
    setMaisInformacoesAberto(Boolean(cliente?.data_nascimento || cliente?.observacoes))
    setConfirmarDescarte(false)
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

  function solicitarFechamento() {
    if (isDirty && !isSubmitting) {
      setConfirmarDescarte(true)
      return
    }
    aoMudarAberto(false)
  }

  async function enviar(valores: ClienteFormValues) {
    try {
      const payload = {
        nome: valores.nome,
        telefone: valores.telefone || null,
        data_nascimento: valores.data_nascimento || null,
        observacoes: valores.observacoes || null,
        status: cliente ? valores.status : 'ativo' as const,
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
    <>
      <Dialog open={aberto} onOpenChange={(novoEstado) => (novoEstado ? aoMudarAberto(true) : solicitarFechamento())}>
        <DialogContent className="top-0 h-dvh max-h-dvh grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 p-0 pb-0 sm:right-auto sm:h-auto sm:max-h-[92dvh] sm:max-w-xl sm:rounded-xl sm:border">
          <DialogHeader className="shrink-0 border-b border-border p-4 pr-14 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 sm:pr-14">
            <DialogTitle>{emEdicao ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
            <DialogDescription>
              {emEdicao ? 'Atualize os dados cadastrais.' : 'Nome e WhatsApp são suficientes para começar.'}
            </DialogDescription>
          </DialogHeader>

          <form noValidate onSubmit={handleSubmit(enviar)} className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
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

              <Field
                id="cliente-telefone"
                rotulo="Telefone / WhatsApp"
                erro={errors.telefone?.message}
                dica="Opcional, mas necessário para contato e recuperação"
              >
                {(props) => (
                  <Input
                    {...props}
                    {...register('telefone')}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(11) 98888-7777"
                    onChange={(evento) =>
                      setValue('telefone', formatarTelefone(evento.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                )}
              </Field>

              <div className="rounded-xl border border-border">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start px-3"
                  aria-expanded={maisInformacoesAberto}
                  aria-controls="cliente-mais-informacoes"
                  onClick={() => setMaisInformacoesAberto((atual) => !atual)}
                >
                  <span className="flex-1 text-left">Mais informações</span>
                  <span className="text-xs font-normal text-muted-foreground">Opcional</span>
                  {maisInformacoesAberto ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
                </Button>

                {maisInformacoesAberto ? (
                  <div id="cliente-mais-informacoes" className="space-y-4 border-t border-border p-3">
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
                  </div>
                ) : null}
              </div>

              {emEdicao ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="cliente-status">Cliente ativo</Label>
                    <p className="text-xs text-muted-foreground">Clientes inativos deixam de aparecer nas listagens padrão.</p>
                  </div>
                  <Switch
                    id="cliente-status"
                    checked={status === 'ativo'}
                    onCheckedChange={(marcado) =>
                      setValue('status', marcado ? 'ativo' : 'inativo', { shouldDirty: true })
                    }
                  />
                </div>
              ) : null}
            </div>

            <DialogFooter className="shrink-0 border-t border-border bg-card p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:p-4">
              <Button type="button" variant="outline" onClick={solicitarFechamento}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Cadastrar cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={confirmarDescarte}
        aoMudarAberto={setConfirmarDescarte}
        titulo="Descartar alterações?"
        descricao="Os dados preenchidos neste formulário serão perdidos."
        textoConfirmar="Descartar"
        destrutivo
        aoConfirmar={() => {
          setConfirmarDescarte(false)
          aoMudarAberto(false)
        }}
      />
    </>
  )
}
