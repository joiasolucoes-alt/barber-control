import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { ConfirmDialog } from '@/components/common/confirm-dialog'
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
import { formatarEntradaDuracao, formatarEntradaMoeda } from '@/lib/format'
import { paraNumero, servicoSchema, type ServicoFormValues } from '@/lib/validators'
import type { Servico } from '@/types'

interface ServicoFormDialogProps {
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  servico?: Servico | null
}

const VALORES_PADRAO: ServicoFormValues = {
  nome: '',
  descricao: '',
  preco: '',
  duracao_estimada: '',
  status: 'ativo',
}

export function ServicoFormDialog({ aberto, aoMudarAberto, servico }: ServicoFormDialogProps) {
  const { criarServico, atualizarServico } = useBarberData()
  const emEdicao = Boolean(servico)
  const [confirmarDescarte, setConfirmarDescarte] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoSchema),
    defaultValues: VALORES_PADRAO,
  })

  React.useEffect(() => {
    if (!aberto) return
    setConfirmarDescarte(false)
    reset(
      servico
        ? {
            nome: servico.nome,
            descricao: servico.descricao ?? '',
            preco: servico.preco !== null ? servico.preco.toFixed(2).replace('.', ',') : '',
            duracao_estimada: servico.duracao_estimada !== null ? String(servico.duracao_estimada) : '',
            status: servico.status,
          }
        : VALORES_PADRAO,
    )
  }, [aberto, servico, reset])

  const status = watch('status')

  function solicitarFechamento() {
    if (isDirty && !isSubmitting) {
      setConfirmarDescarte(true)
      return
    }
    aoMudarAberto(false)
  }

  async function enviar(valores: ServicoFormValues) {
    try {
      const payload = {
        nome: valores.nome,
        descricao: valores.descricao || null,
        preco: paraNumero(valores.preco),
        duracao_estimada: paraNumero(valores.duracao_estimada),
        status: servico ? valores.status : 'ativo' as const,
      }
      const salvo = servico ? await atualizarServico(servico.id, payload) : await criarServico(payload)

      toast.success(emEdicao ? 'Serviço atualizado' : 'Serviço cadastrado', {
        description: `${salvo.nome} foi ${emEdicao ? 'atualizado' : 'adicionado'} com sucesso.`,
      })
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
        <DialogContent className="top-0 h-dvh max-h-dvh grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 p-0 pb-0 sm:right-auto sm:h-auto sm:max-h-[92dvh] sm:max-w-lg sm:rounded-xl sm:border">
          <DialogHeader className="shrink-0 border-b border-border p-4 pr-14 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 sm:pr-14">
            <DialogTitle>{emEdicao ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
            <DialogDescription>Preço e duração ajudam a registrar atendimentos mais rápido.</DialogDescription>
          </DialogHeader>

          <form noValidate onSubmit={handleSubmit(enviar)} className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <Field id="servico-nome" rotulo="Nome" obrigatorio erro={errors.nome?.message}>
                {(props) => <Input {...props} {...register('nome')} placeholder="Ex.: Corte de cabelo" maxLength={80} />}
              </Field>

              <Field id="servico-descricao" rotulo="Descrição" erro={errors.descricao?.message} dica="Opcional">
                {(props) => (
                  <Textarea
                    {...props}
                    {...register('descricao')}
                    placeholder="O que está incluído no serviço"
                    maxLength={300}
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="servico-preco" rotulo="Preço (R$)" erro={errors.preco?.message} dica="Opcional">
                  {(props) => (
                    <Input
                      {...props}
                      {...register('preco')}
                      inputMode="decimal"
                      placeholder="45,00"
                      maxLength={9}
                      onChange={(evento) =>
                        setValue('preco', formatarEntradaMoeda(evento.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  )}
                </Field>

                <Field
                  id="servico-duracao"
                  rotulo="Duração estimada (min)"
                  erro={errors.duracao_estimada?.message}
                  dica="Opcional"
                >
                  {(props) => (
                    <Input
                      {...props}
                      {...register('duracao_estimada')}
                      inputMode="numeric"
                      placeholder="40"
                      maxLength={4}
                      onChange={(evento) =>
                        setValue('duracao_estimada', formatarEntradaDuracao(evento.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  )}
                </Field>
              </div>

              {emEdicao ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="servico-status">Serviço ativo</Label>
                    <p className="text-xs text-muted-foreground">Serviços inativos não podem ser escolhidos em novas visitas.</p>
                  </div>
                  <Switch
                    id="servico-status"
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
                {isSubmitting ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Cadastrar serviço'}
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
