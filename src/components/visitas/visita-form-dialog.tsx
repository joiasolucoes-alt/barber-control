import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ChevronDown, ChevronUp, Loader2, RotateCcw, StickyNote, UserPlus, X } from 'lucide-react'

import { ClienteCombobox } from '@/components/clientes/cliente-combobox'
import { DatePicker } from '@/components/common/date-picker'
import { Field } from '@/components/common/field'
import { ServicosSelector } from '@/components/visitas/servicos-selector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { dateParaDataISO, formatarData, formatarMoeda, formatarTelefone, pluralizar } from '@/lib/format'
import { paraNumero, visitaSchema, type VisitaFormValues } from '@/lib/validators'
import { ordenarServicosPorFrequencia, ultimaVisitaDoCliente, valorDaVisita } from '@/lib/visitas'
import type { VisitaDetalhada } from '@/types'

function precoParaTexto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return ''
  return valor.toFixed(2).replace('.', ',')
}

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
  const { clientes, servicos, visitas, criarVisita, atualizarVisita, criarCliente } = useBarberData()
  const emEdicao = Boolean(visita)

  const [cadastroRapidoAberto, setCadastroRapidoAberto] = React.useState(false)
  const [nomeRapido, setNomeRapido] = React.useState('')
  const [telefoneRapido, setTelefoneRapido] = React.useState('')
  const [erroRapido, setErroRapido] = React.useState<string | null>(null)
  const [salvandoRapido, setSalvandoRapido] = React.useState(false)
  const [observacoesAbertas, setObservacoesAbertas] = React.useState(false)

  const {
    handleSubmit,
    control,
    register,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VisitaFormValues>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      cliente_id: '',
      data_atendimento: dateParaDataISO(new Date()),
      servico_ids: [],
      precos_cobrados: {},
      observacoes: '',
    },
  })

  React.useEffect(() => {
    if (!aberto) return
    setCadastroRapidoAberto(false)
    setNomeRapido('')
    setTelefoneRapido('')
    setErroRapido(null)
    setObservacoesAbertas(Boolean(visita?.observacoes))
    reset({
      cliente_id: visita?.cliente_id ?? clienteIdInicial ?? '',
      data_atendimento: visita?.data_atendimento ?? dataInicial ?? dateParaDataISO(new Date()),
      servico_ids: visita?.servicos.map((servico) => servico.id) ?? [],
      precos_cobrados: Object.fromEntries(
        visita?.servicos.map((servico) => [servico.id, precoParaTexto(servico.preco_cobrado)]) ?? [],
      ),
      observacoes: visita?.observacoes ?? '',
    })
  }, [aberto, visita, clienteIdInicial, dataInicial, reset])

  const clienteSelecionado = useWatch({ control, name: 'cliente_id' })
  const servicosSelecionados = useWatch({ control, name: 'servico_ids' })
  const precosCobrados = useWatch({ control, name: 'precos_cobrados' })

  const totalCobrado = React.useMemo(
    () =>
      servicosSelecionados.reduce(
        (total, servicoId) => total + (paraNumero(precosCobrados[servicoId]) ?? 0),
        0,
      ),
    [precosCobrados, servicosSelecionados],
  )

  // Clientes ativos + o cliente já vinculado à visita (mesmo que inativo).
  const clientesDisponiveis = React.useMemo(
    () => clientes.filter((cliente) => cliente.status === 'ativo' || cliente.id === visita?.cliente_id),
    [clientes, visita],
  )

  // Serviços ativos + os já registrados nesta visita.
  const servicosDisponiveis = React.useMemo(() => {
    const idsDaVisita = new Set(visita?.servicos.map((servico) => servico.id) ?? [])
    const disponiveis = servicos.filter((servico) => servico.status === 'ativo' || idsDaVisita.has(servico.id))
    return ordenarServicosPorFrequencia(disponiveis, visitas)
  }, [servicos, visita, visitas])

  const ultimaVisita = React.useMemo(
    () =>
      !emEdicao && clienteSelecionado
        ? ultimaVisitaDoCliente(visitas, clienteSelecionado)
        : null,
    [clienteSelecionado, emEdicao, visitas],
  )

  const servicosRepetiveis = React.useMemo(() => {
    if (!ultimaVisita) return []
    const disponiveis = new Set(servicosDisponiveis.map((servico) => servico.id))
    return ultimaVisita.servicos.filter((servico) => disponiveis.has(servico.id))
  }, [servicosDisponiveis, ultimaVisita])

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

  function alternarServico(servicoId: string) {
    const selecionados = getValues('servico_ids')
    if (selecionados.includes(servicoId)) {
      setValue(
        'servico_ids',
        selecionados.filter((id) => id !== servicoId),
        { shouldDirty: true, shouldValidate: true },
      )
      return
    }

    const precosAtuais = getValues('precos_cobrados')
    if (!Object.hasOwn(precosAtuais, servicoId)) {
      const servico = servicosDisponiveis.find((item) => item.id === servicoId)
      setValue(
        'precos_cobrados',
        { ...precosAtuais, [servicoId]: precoParaTexto(servico?.preco) },
        { shouldDirty: true },
      )
    }
    setValue('servico_ids', [...selecionados, servicoId], { shouldDirty: true, shouldValidate: true })
  }

  function mudarPrecoCobrado(servicoId: string, valor: string) {
    const valorLimpo = valor.replace(/[^\d,.]/g, '').replace(/(,.*),/g, '$1').slice(0, 10)
    setValue(
      'precos_cobrados',
      { ...getValues('precos_cobrados'), [servicoId]: valorLimpo },
      { shouldDirty: true, shouldValidate: true },
    )
  }

  function repetirUltimaVisita() {
    if (servicosRepetiveis.length === 0) return
    const precos = { ...getValues('precos_cobrados') }
    servicosRepetiveis.forEach((servico) => {
      precos[servico.id] = precoParaTexto(servico.preco_cobrado)
    })
    setValue(
      'servico_ids',
      servicosRepetiveis.map((servico) => servico.id),
      { shouldDirty: true, shouldValidate: true },
    )
    setValue('precos_cobrados', precos, { shouldDirty: true, shouldValidate: true })
    toast.success('Último atendimento repetido', {
      description: `${servicosRepetiveis.length} ${pluralizar(servicosRepetiveis.length, 'serviço selecionado', 'serviços selecionados')}.`,
    })
  }

  async function enviar(valores: VisitaFormValues) {
    try {
      const precosSelecionados = Object.fromEntries(
        valores.servico_ids.map((servicoId) => [servicoId, paraNumero(valores.precos_cobrados[servicoId])]),
      )
      const payload = {
        cliente_id: valores.cliente_id,
        data_atendimento: valores.data_atendimento,
        observacoes: valores.observacoes || null,
        servico_ids: valores.servico_ids,
        precos_cobrados: precosSelecionados,
      }
      const salva = emEdicao && visita ? await atualizarVisita(visita.id, payload) : await criarVisita(payload)

      toast.success(emEdicao ? 'Visita atualizada' : 'Visita registrada', {
        description: `${salva.cliente.nome} · ${formatarMoeda(valorDaVisita(salva))} · ${salva.servicos.length} ${pluralizar(salva.servicos.length, 'serviço', 'serviços')}`,
        duration: 6000,
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
      <DialogContent className="top-0 h-dvh max-h-dvh grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 p-0 pb-0 [&>button]:top-[calc(.5rem+env(safe-area-inset-top))] sm:right-auto sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:gap-0 sm:rounded-xl sm:border sm:p-0 sm:[&>button]:top-3">
        <DialogHeader className="shrink-0 border-b border-border p-4 pr-16 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 sm:pr-16">
          <DialogTitle>{emEdicao ? 'Editar visita' : 'Registrar visita'}</DialogTitle>
          <DialogDescription className="hidden sm:block">
            Registre um atendimento que já aconteceu, com um ou mais serviços realizados.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(enviar)} className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div className="sticky -top-4 z-20 -mx-4 -mt-4 grid gap-3 border-b border-border bg-card/95 px-4 pb-3 pt-4 backdrop-blur sm:-mx-5 sm:grid-cols-2 sm:px-5">
              <Controller
                control={control}
                name="cliente_id"
                render={({ field }) => (
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
                )}
              />

              <Field
                id="visita-data"
                rotulo="Data do atendimento"
                obrigatorio
                erro={errors.data_atendimento?.message}
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
            </div>

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
                      autoComplete="name"
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rapido-telefone">Telefone / WhatsApp (opcional)</Label>
                    <Input
                      id="rapido-telefone"
                      value={telefoneRapido}
                      inputMode="tel"
                      autoComplete="tel"
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
                  onClick={() => cadastrarClienteRapido((clienteId) => setValue('cliente_id', clienteId))}
                >
                  {salvandoRapido ? <Loader2 className="animate-spin" /> : <UserPlus />}
                  Cadastrar e selecionar
                </Button>
              </div>
            ) : null}

            {ultimaVisita && servicosRepetiveis.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                onClick={repetirUltimaVisita}
              >
                <RotateCcw aria-hidden className="text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Repetir última visita</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {formatarData(ultimaVisita.data_atendimento)} · {servicosRepetiveis.map((servico) => servico.nome).join(', ')}
                  </span>
                </span>
              </Button>
            ) : null}

            <Field
              id="visita-servicos"
              rotulo="Serviços realizados"
              obrigatorio
              erro={errors.servico_ids?.message}
              dica="Mais usados primeiro. Ajuste o valor somente quando o preço cobrado for diferente."
            >
              {(props) => (
                <ServicosSelector
                  aria-invalid={props['aria-invalid']}
                  aria-describedby={props['aria-describedby']}
                  servicos={servicosDisponiveis}
                  selecionados={servicosSelecionados}
                  precosCobrados={precosCobrados}
                  aoAlternar={alternarServico}
                  aoMudarPreco={mudarPrecoCobrado}
                />
              )}
            </Field>

            {errors.precos_cobrados ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                Revise os valores cobrados. Use somente números entre 0 e 999.999,99.
              </p>
            ) : null}

            <div className="rounded-xl border border-border">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-3"
                aria-expanded={observacoesAbertas}
                aria-controls="visita-observacoes-conteudo"
                onClick={() => setObservacoesAbertas((atual) => !atual)}
              >
                <StickyNote aria-hidden className="text-primary" />
                <span className="flex-1 text-left">Observações</span>
                <span className="text-xs font-normal text-muted-foreground">Opcional</span>
                {observacoesAbertas ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
              </Button>
              {observacoesAbertas ? (
                <div id="visita-observacoes-conteudo" className="border-t border-border p-3">
                  <Field id="visita-observacoes" rotulo="Detalhes do atendimento" erro={errors.observacoes?.message}>
                    {(props) => (
                      <Textarea
                        {...props}
                        {...register('observacoes')}
                        placeholder="Preferências, ajustes ou informações importantes"
                        maxLength={500}
                      />
                    )}
                  </Field>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-card p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total da visita</span>
              <strong className="metric-number text-2xl text-primary">{formatarMoeda(totalCobrado)}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button type="button" variant="outline" onClick={() => aoMudarAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Registrar visita'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
