import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoSchema),
    defaultValues: VALORES_PADRAO,
  })

  React.useEffect(() => {
    if (!aberto) return
    reset(
      servico
        ? {
            nome: servico.nome,
            descricao: servico.descricao ?? '',
            preco: servico.preco !== null ? String(servico.preco) : '',
            duracao_estimada: servico.duracao_estimada !== null ? String(servico.duracao_estimada) : '',
            status: servico.status,
          }
        : VALORES_PADRAO,
    )
  }, [aberto, servico, reset])

  const status = watch('status')

  async function enviar(valores: ServicoFormValues) {
    try {
      const payload = {
        nome: valores.nome,
        descricao: valores.descricao || null,
        preco: paraNumero(valores.preco),
        duracao_estimada: paraNumero(valores.duracao_estimada),
        status: valores.status,
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
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{emEdicao ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          <DialogDescription>
            Serviços ativos ficam disponíveis para seleção no registro de visitas.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(enviar)} className="space-y-4">
          <Field id="servico-nome" rotulo="Nome" obrigatorio erro={errors.nome?.message}>
            {(props) => <Input {...props} {...register('nome')} placeholder="Ex.: Corte de cabelo" />}
          </Field>

          <Field id="servico-descricao" rotulo="Descrição" erro={errors.descricao?.message} dica="Opcional">
            {(props) => <Textarea {...props} {...register('descricao')} placeholder="O que está incluído no serviço" />}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="servico-preco" rotulo="Preço (R$)" erro={errors.preco?.message} dica="Opcional">
              {(props) => (
                <Input {...props} {...register('preco')} inputMode="decimal" placeholder="45,00" />
              )}
            </Field>

            <Field
              id="servico-duracao"
              rotulo="Duração estimada (min)"
              erro={errors.duracao_estimada?.message}
              dica="Opcional"
            >
              {(props) => (
                <Input {...props} {...register('duracao_estimada')} inputMode="numeric" placeholder="40" />
              )}
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="servico-status">Serviço ativo</Label>
              <p className="text-xs text-muted-foreground">Serviços inativos não podem ser escolhidos em novas visitas.</p>
            </div>
            <Switch
              id="servico-status"
              checked={status === 'ativo'}
              onCheckedChange={(marcado) => setValue('status', marcado ? 'ativo' : 'inativo')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => aoMudarAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Cadastrar serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
