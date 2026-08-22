import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Loader2, UserPlus, X } from 'lucide-react'

import { ClienteCombobox } from '@/components/clientes/cliente-combobox'
import { DatePicker } from '@/components/common/date-picker'
import { Field } from '@/components/common/field'
import { ServicosSelector } from '@/components/visitas/servicos-selector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { dateParaDataISO, formatarTelefone } from '@/lib/format'
import { visitaSchema, type VisitaFormValues } from '@/lib/validators'
import type { VisitaDetalhada } from '@/types'

interface VisitaFormDialogProps {
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  visita?: VisitaDetalhada | null
  /** Pré-seleciona um cliente (usado na página de detalhes). */
  clienteIdInicial?: string
  /** Pré-seleciona uma data (usado na visualização diária). */
  dataInicial?: string
}

export function VisitaFormDialog({
  aberto,
  aoMudarAberto,
  visita,
  clienteIdInicial,
  dataInicial,
}: VisitaFormDialogProps) {
  const { clientes, servicos, criarVisita, atualizarVisita, criarCliente } = useBarberData()
  const emEdicao = Boolean(visita)

  const [cadastroRapidoAberto, setCadastroRapidoAberto] = React.useState(false)
  const [nomeRapido, setNomeRapido] = React.useState('')
  const [telefoneRapido, setTelefoneRapido] = React.useState('')
  const [erroRapido, setErroRapido] = React.useState<string | null>(null)
  const [salvandoRapido, setSalvandoRapido] = React.useState(false)

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitaFormValues>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      cliente_id: '',
      data_atendimento: dateParaDataISO(new Date()),
      servico_ids: [],
      observacoes: '',
    },
  })

  React.useEffect(() => {
    if (!aberto) return
    setCadastroRapidoAberto(false)
    setNomeRapido('')
    setTelefoneRapido('')
    setErroRapido(null)
    reset({
      cliente_id: visita?.cliente_id ?? clienteIdInicial ?? '',
      data_atendimento: visita?.data_atendimento ?? dataInicial ?? dateParaDataISO(new Date()),
      servico_ids: visita?.servicos.map((servico) => servico.id) ?? [],
      observacoes: visita?.observacoes ?? '',
    })
  }, [aberto, visita, clienteIdInicial, dataInicial, reset])

  // Clientes ativos + o cliente já vinculado à visita (mesmo que inativo).
  const clientesDisponiveis = React.useMemo(
    () => clientes.filter((cliente) => cliente.status === 'ativo' || cliente.id === visita?.cliente_id),
    [clientes, visita],
  )

  // Serviços ativos + os já registrados nesta visita.
  const servicosDisponiveis = React.useMemo(() => {
    const idsDaVisita = new Set(visita?.servicos.map((servico) => servico.id) ?? [])
    return servicos.filter((servico) => servico.status === 'ativo' || idsDaVisita.has(servico.id))
  }, [servicos, visita])

  async function cadastrarClienteRapido(aoConcluir: (clienteId: string) => void) {
    setErroRapido(null)
    if (nomeRapido.trim().length < 3) {
      setErroRapido('Informe o nome completo do cliente.')
      return
    }
    if (telefoneRapido && telefoneRapido.replace(/\D/g, '').length < 10) {
      setErroRapido('Telefone incompleto. Use DDD + número ou deixe em branco.')
      return
    }

    setSalvandoRapido(true)
    try {
      const novo = await criarCliente({ nome: nomeRapido, telefone: telefoneRapido || null, status: 'ativo' })
      aoConcluir(novo.id)
      setCadastroRapidoAberto(false)
      setNomeRapido('')
      setTelefoneRapido('')
      toast.success('Cliente cadastrado', { description: `${novo.nome} já está selecionado nesta visita.` })
    } catch (erro) {
      setErroRapido(erro instanceof Error ? erro.message : 'Não foi possível cadastrar o cliente.')
    } finally {
      setSalvandoRapido(false)
    }
  }

  async function enviar(valores: VisitaFormValues) {
    try {
      const payload = {
        cliente_id: valores.cliente_id,
        data_atendimento: valores.data_atendimento,
        observacoes: valores.observacoes || null,
        servico_ids: valores.servico_ids,
      }
      const salva = emEdicao && visita ? await atualizarVisita(visita.id, payload) : await criarVisita(payload)

      toast.success(emEdicao ? 'Visita atualizada' : 'Visita registrada', {
        description: `${salva.cliente.nome} · ${salva.servicos.map((servico) => servico.nome).join(', ')}`,
      })
      aoMudarAberto(false)
    } catch (erro) {
      toast.error('Não foi possível salvar a visita', {
        description: erro instanceof Error ? erro.message : 'Tente novamente em instantes.',
      })
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{emEdicao ? 'Editar visita' : 'Registrar visita'}</DialogTitle>
          <DialogDescription>
            Registre um atendimento que já aconteceu, com um ou mais serviços realizados.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(enviar)} className="space-y-4">
          <Controller
            control={control}
            name="cliente_id"
            render={({ field }) => (
              <div className="space-y-3">
                <Field id="visita-cliente" rotulo="Cliente" obrigatorio erro={errors.cliente_id?.message}>
                  {(props) => (
                    <ClienteCombobox
                      id={props.id}
                      aria-invalid={props['aria-invalid']}
                      aria-describedby={props['aria-describedby']}
                      clientes={clientesDisponiveis}
                      valor={field.value}
                      aoMudar={field.onChange}
                      aoCadastrarNovo={() => setCadastroRapidoAberto(true)}
                    />
                  )}
                </Field>

                {cadastroRapidoAberto ? (
                  <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <UserPlus aria-hidden className="h-4 w-4 text-primary" /> Cadastro rápido
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        aria-label="Fechar cadastro rápido"
                        onClick={() => setCadastroRapidoAberto(false)}
                      >
                        <X />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="rapido-nome">Nome completo</Label>
                        <Input
                          id="rapido-nome"
                          value={nomeRapido}
                          onChange={(evento) => setNomeRapido(evento.target.value)}
                          placeholder="Ex.: Bruno Carvalho"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="rapido-telefone">Telefone / WhatsApp (opcional)</Label>
                        <Input
                          id="rapido-telefone"
                          value={telefoneRapido}
                          inputMode="tel"
                          onChange={(evento) => setTelefoneRapido(formatarTelefone(evento.target.value))}
                          placeholder="(11) 98888-7777"
                        />
                      </div>
                    </div>

                    {erroRapido ? (
                      <p role="alert" className="text-xs font-medium text-destructive">
                        {erroRapido}
                      </p>
                    ) : null}

                    <Button
                      type="button"
                      size="sm"
                      disabled={salvandoRapido}
                      onClick={() => cadastrarClienteRapido(field.onChange)}
                    >
                      {salvandoRapido ? <Loader2 className="animate-spin" /> : <UserPlus />}
                      Cadastrar e selecionar
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          />

          <Field
            id="visita-data"
            rotulo="Data do atendimento"
            obrigatorio
            erro={errors.data_atendimento?.message}
            dica="Somente datas até hoje: a visita registra o que já aconteceu."
          >
            {(props) => (
              <Controller
                control={control}
                name="data_atendimento"
                render={({ field }) => (
                  <DatePicker
                    id={props.id}
                    aria-invalid={props['aria-invalid']}
                    aria-describedby={props['aria-describedby']}
                    valor={field.value}
                    aoMudar={(valor) => field.onChange(valor ?? '')}
                    bloquearFuturo
                  />
                )}
              />
            )}
          </Field>

          <Field
            id="visita-servicos"
            rotulo="Serviços realizados"
            obrigatorio
            erro={errors.servico_ids?.message}
            dica="Selecione quantos serviços forem necessários para o mesmo atendimento."
          >
            {(props) => (
              <Controller
                control={control}
                name="servico_ids"
                render={({ field }) => (
                  <ServicosSelector
                    aria-invalid={props['aria-invalid']}
                    aria-describedby={props['aria-describedby']}
                    servicos={servicosDisponiveis}
                    selecionados={field.value}
                    aoAlternar={(servicoId) =>
                      field.onChange(
                        field.value.includes(servicoId)
                          ? field.value.filter((id) => id !== servicoId)
                          : [...field.value, servicoId],
                      )
                    }
                  />
                )}
              />
            )}
          </Field>

          <Field id="visita-observacoes" rotulo="Observações" erro={errors.observacoes?.message} dica="Opcional">
            {(props) => (
              <Textarea {...props} {...register('observacoes')} placeholder="Detalhes do atendimento realizado" />
            )}
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => aoMudarAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Registrar visita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
