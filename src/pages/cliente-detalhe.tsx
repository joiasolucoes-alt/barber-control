import * as React from 'react'
import { useParams } from 'react-router-dom'
import { CalendarRange, Cake, Pencil, Phone, Plus, RotateCcw, StickyNote } from 'lucide-react'

import { BotaoWhatsApp } from '@/components/clientes/botao-whatsapp'
import { ClienteFormDialog } from '@/components/clientes/cliente-form-dialog'
import { SituacaoBadge } from '@/components/clientes/situacao-badge'
import { BackButton } from '@/components/common/back-button'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/data-state'
import { StatusBadge } from '@/components/common/status-badge'
import { VisitaFormDialog } from '@/components/visitas/visita-form-dialog'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useBarberData } from '@/hooks/use-barber-data'
import {
  exibirTelefone,
  formatarData,
  formatarDataExtensa,
  formatarMoeda,
  formatarNumero,
  pluralizar,
} from '@/lib/format'
import {
  analisarCliente,
  DESCRICOES_SITUACAO,
  mensagemRetorno,
} from '@/lib/clientes-analise'
import { valorDaVisita } from '@/lib/visitas'
import type { VisitaDetalhada } from '@/types'

const VISITAS_INICIAIS = 4

function LinhaInfo({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="mt-0.5 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{rotulo}</p>
        <p className="break-words text-sm">{valor}</p>
      </div>
    </div>
  )
}

export function ClienteDetalhePage() {
  const { id = '' } = useParams()
  const { clientes, visitas, carregando, erro, recarregar } = useBarberData()

  const [formAberto, setFormAberto] = React.useState(false)
  const [visitaAberta, setVisitaAberta] = React.useState(false)
  const [visitaParaRepetir, setVisitaParaRepetir] = React.useState<VisitaDetalhada | null>(null)
  const [limiteVisitas, setLimiteVisitas] = React.useState(VISITAS_INICIAIS)

  const cliente = clientes.find((item) => item.id === id) ?? null
  const analise = React.useMemo(
    () =>
      cliente
        ? analisarCliente(
            cliente,
            visitas.filter((visita) => visita.cliente_id === cliente.id),
          )
        : null,
    [cliente, visitas],
  )
  const visitasVisiveis = analise?.visitas.slice(0, limiteVisitas) ?? []

  React.useEffect(() => setLimiteVisitas(VISITAS_INICIAIS), [id])

  function abrirRegistro() {
    setVisitaParaRepetir(null)
    setVisitaAberta(true)
  }

  function repetirVisita(visita: VisitaDetalhada) {
    setVisitaParaRepetir(visita)
    setVisitaAberta(true)
  }

  if (erro) {
    return <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <BackButton para="/clientes" rotulo="Voltar para clientes" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!cliente || !analise) {
    return (
      <EmptyState
        icone={<CalendarRange />}
        titulo="Cliente não encontrado"
        descricao="O cliente pode ter sido removido ou o endereço está incorreto."
        acao={
          <BackButton para="/clientes" rotulo="Voltar para clientes" className="ml-0 border border-border px-3" />
        }
      />
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <BackButton para="/clientes" rotulo="Voltar para clientes" />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <ClienteAvatar nome={cliente.nome} className="h-12 w-12 text-sm sm:h-14 sm:w-14 sm:text-base" />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="heading-display min-w-0 text-xl font-semibold sm:text-2xl">{cliente.nome}</h1>
                <SituacaoBadge situacao={analise.situacao} titulo={DESCRICOES_SITUACAO[analise.situacao]} />
                <StatusBadge status={cliente.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                Cliente desde {formatarDataExtensa(cliente.created_at.slice(0, 10))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <BotaoWhatsApp
              cliente={cliente}
              mensagem={
                analise.situacao === 'em-risco' || analise.situacao === 'perdido'
                  ? mensagemRetorno(cliente)
                  : undefined
              }
              className="w-full sm:w-auto"
            />
            <Button className="w-full sm:w-auto" onClick={abrirRegistro}>
              <Plus aria-hidden /> Registrar visita
            </Button>
            <Button variant="ghost" className="col-span-2 sm:col-span-1" onClick={() => setFormAberto(true)}>
              <Pencil aria-hidden /> Editar cadastro
            </Button>
          </div>
        </CardContent>
      </Card>

      {analise.previsaoRetorno ? (
        <div
          className={
            analise.diasDeAtraso !== null && analise.diasDeAtraso > 0
              ? 'rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4'
              : 'rounded-xl border border-primary/25 bg-primary/[0.05] p-4'
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="ui-eyebrow">Retorno esperado</p>
              <p className="mt-1 font-semibold">{formatarDataExtensa(analise.previsaoRetorno)}</p>
            </div>
            <p className={analise.diasDeAtraso !== null && analise.diasDeAtraso > 0 ? 'font-semibold text-destructive' : 'font-medium text-primary'}>
              {analise.diasDeAtraso !== null && analise.diasDeAtraso > 0
                ? `${analise.diasDeAtraso} ${pluralizar(analise.diasDeAtraso, 'dia', 'dias')} de atraso`
                : analise.diasDeAtraso !== null
                  ? `Retorno em ${Math.abs(analise.diasDeAtraso)} ${pluralizar(Math.abs(analise.diasDeAtraso), 'dia', 'dias')}`
                  : null}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ritmo estimado: a cada {analise.intervaloReferenciaDias} dias · {DESCRICOES_SITUACAO[analise.situacao]}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LinhaInfo icone={<Phone />} rotulo="Telefone / WhatsApp" valor={exibirTelefone(cliente.telefone)} />
            <LinhaInfo icone={<Cake />} rotulo="Nascimento" valor={formatarData(cliente.data_nascimento)} />
            <LinhaInfo
              icone={<StickyNote />}
              rotulo="Observações"
              valor={cliente.observacoes ?? 'Nenhuma observação registrada.'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de atendimentos</CardTitle>
            <CardDescription>Consolidado de todo o histórico do cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total de visitas</p>
                <p className="metric-number text-2xl sm:text-3xl">{formatarNumero(analise.totalVisitas)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total gasto</p>
                <p className="metric-number text-xl sm:text-2xl">{formatarMoeda(analise.totalGasto)}</p>
              </div>
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Última visita</dt>
                <dd className="text-right font-medium">
                  {formatarData(analise.ultimaVisita)}
                  {analise.diasDesdeUltimaVisita !== null ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      há {analise.diasDesdeUltimaVisita} dias
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Primeira visita</dt>
                <dd className="font-medium">{formatarData(analise.primeiraVisita)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Ritmo de retorno</dt>
                <dd className="text-right font-medium">
                  {analise.intervaloMedioDias ? (
                    `a cada ${analise.intervaloMedioDias} dias`
                  ) : (
                    <span className="font-normal text-muted-foreground">histórico insuficiente</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Retorno esperado</dt>
                <dd className="text-right font-medium">
                  {formatarData(analise.previsaoRetorno)}
                  {analise.diasDeAtraso !== null ? (
                    <span
                      className={
                        analise.diasDeAtraso > 0
                          ? 'block text-xs font-normal text-destructive'
                          : 'block text-xs font-normal text-muted-foreground'
                      }
                    >
                      {analise.diasDeAtraso > 0
                        ? `${analise.diasDeAtraso} dias de atraso`
                        : `faltam ${Math.abs(analise.diasDeAtraso)} dias`}
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>

            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {DESCRICOES_SITUACAO[analise.situacao]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços mais utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            {analise.servicosFrequentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço registrado ainda.</p>
            ) : (
              <ol className="space-y-3">
                {analise.servicosFrequentes.map((servico) => (
                  <li key={servico.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">{servico.nome}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{servico.total}</span>
                    </div>
                    <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${servico.percentual}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de visitas</CardTitle>
          <CardDescription>
            {analise.totalVisitas} {pluralizar(analise.totalVisitas, 'atendimento registrado', 'atendimentos registrados')},
            do mais recente ao mais antigo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analise.visitas.length === 0 ? (
            <EmptyState
              icone={<CalendarRange />}
              titulo="Nenhuma visita registrada"
              descricao="Registre o primeiro atendimento deste cliente."
              acao={
                <Button onClick={abrirRegistro}>
                  <Plus aria-hidden /> Registrar visita
                </Button>
              }
            />
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {visitasVisiveis.map((visita) => (
                <li key={visita.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
                  />
                  <div className="space-y-2 rounded-lg border border-border p-3 sm:p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{formatarDataExtensa(visita.data_atendimento)}</p>
                      <strong className="metric-number text-sm text-primary">{formatarMoeda(valorDaVisita(visita))}</strong>
                    </div>
                    <VisitaServicosTags servicos={visita.servicos} />
                    {visita.observacoes ? (
                      <p className="text-sm text-muted-foreground">{visita.observacoes}</p>
                    ) : null}
                    <Button type="button" variant="ghost" size="sm" className="-ml-2" onClick={() => repetirVisita(visita)}>
                      <RotateCcw aria-hidden /> Repetir atendimento
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {limiteVisitas < analise.visitas.length ? (
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setLimiteVisitas((atual) => atual + VISITAS_INICIAIS)}>
              Carregar mais visitas
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <ClienteFormDialog aberto={formAberto} aoMudarAberto={setFormAberto} cliente={cliente} />
      <VisitaFormDialog
        aberto={visitaAberta}
        aoMudarAberto={(aberto) => {
          setVisitaAberta(aberto)
          if (!aberto) setVisitaParaRepetir(null)
        }}
        clienteIdInicial={cliente.id}
        visitaParaRepetir={visitaParaRepetir}
      />
    </div>
  )
}
