import * as React from 'react'
import { startOfMonth } from 'date-fns'
import { CalendarDays, List, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { AgendaCalendar } from '@/components/agenda/agenda-calendar'
import { AgendaDiaDialog } from '@/components/agenda/agenda-dia-dialog'
import { AgendaLista } from '@/components/agenda/agenda-lista'
import { AgendaResumo } from '@/components/agenda/agenda-resumo'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState, TableSkeleton } from '@/components/common/data-state'
import { PageHeader } from '@/components/common/page-header'
import { VisitaDetalheDialog } from '@/components/visitas/visita-detalhe-dialog'
import { VisitaFormDialog } from '@/components/visitas/visita-form-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { resumirAgendaDia, resumirAgendaMes } from '@/lib/agenda'
import { formatarData } from '@/lib/format'
import type { DataISO, VisitaDetalhada } from '@/types'

type VisualizacaoAgenda = 'calendario' | 'lista'

export function AgendaPage() {
  const { visitas, carregando, erro, recarregar, excluirVisita } = useBarberData()
  const [parametros, setParametros] = useSearchParams()
  const visualizacao: VisualizacaoAgenda = parametros.get('visualizacao') === 'lista' ? 'lista' : 'calendario'

  const [mes, setMes] = React.useState(() => startOfMonth(new Date()))
  const [dataSelecionada, setDataSelecionada] = React.useState<DataISO | null>(null)
  const [dataNovaVisita, setDataNovaVisita] = React.useState<DataISO | undefined>()
  const [formAberto, setFormAberto] = React.useState(false)
  const [visitaEmEdicao, setVisitaEmEdicao] = React.useState<VisitaDetalhada | null>(null)
  const [visitaEmDetalhe, setVisitaEmDetalhe] = React.useState<VisitaDetalhada | null>(null)
  const [visitaParaExcluir, setVisitaParaExcluir] = React.useState<VisitaDetalhada | null>(null)

  const resumoMes = React.useMemo(() => resumirAgendaMes(visitas, mes), [visitas, mes])
  const resumoDia = React.useMemo(
    () => (dataSelecionada ? resumirAgendaDia(visitas, dataSelecionada) : null),
    [visitas, dataSelecionada],
  )

  function mudarVisualizacao(valor: string) {
    const novaVisualizacao = valor as VisualizacaoAgenda
    if (novaVisualizacao === 'lista') setParametros({ visualizacao: 'lista' }, { replace: true })
    else setParametros({}, { replace: true })
  }

  function mudarMes(novoMes: Date) {
    setMes(startOfMonth(novoMes))
    setDataSelecionada(null)
  }

  function abrirNova(data?: DataISO) {
    setVisitaEmEdicao(null)
    setDataNovaVisita(data)
    setFormAberto(true)
  }

  function abrirEdicao(visita: VisitaDetalhada) {
    setVisitaEmEdicao(visita)
    setDataNovaVisita(undefined)
    setFormAberto(true)
  }

  async function confirmarExclusao() {
    if (!visitaParaExcluir) return
    try {
      await excluirVisita(visitaParaExcluir.id)
      toast.success('Visita excluída', {
        description: `O atendimento de ${visitaParaExcluir.cliente.nome} foi removido.`,
      })
    } catch (falha) {
      toast.error('Não foi possível excluir', {
        description: falha instanceof Error ? falha.message : 'Tente novamente em instantes.',
      })
    } finally {
      setVisitaParaExcluir(null)
    }
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Agenda" descricao="Histórico diário dos atendimentos realizados." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        titulo="Agenda"
        descricao="Calendário e histórico completo dos atendimentos realizados."
        acoes={
          <Button onClick={() => abrirNova()}>
            <Plus aria-hidden /> Registrar visita
          </Button>
        }
      />

      <Tabs value={visualizacao} onValueChange={mudarVisualizacao}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
          <TabsTrigger value="calendario">
            <CalendarDays aria-hidden className="h-4 w-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="lista">
            <List aria-hidden className="h-4 w-4" /> Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          {carregando ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {Array.from({ length: 3 }, (_, indice) => (
                  <Skeleton key={indice} className="h-24 rounded-xl sm:h-28" />
                ))}
              </div>
              <Skeleton className="h-[31rem] rounded-xl" />
            </>
          ) : (
            <>
              <AgendaResumo resumo={resumoMes} rotulo="mês" />

              <Card className="overflow-hidden">
                <AgendaCalendar
                  mes={mes}
                  dias={resumoMes.dias}
                  dataSelecionada={dataSelecionada}
                  aoMudarMes={mudarMes}
                  aoSelecionarData={setDataSelecionada}
                />
              </Card>

              <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <span aria-hidden className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full bg-primary/20 ring-1 ring-primary/40" />
                O número dourado mostra a quantidade de atendimentos. Deslize para os lados ou use as setas para trocar o mês.
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="lista">
          {carregando ? (
            <Card><TableSkeleton linhas={8} colunas={4} /></Card>
          ) : (
            <AgendaLista
              visitas={visitas}
              aoVisualizar={setVisitaEmDetalhe}
              aoEditar={abrirEdicao}
              aoExcluir={setVisitaParaExcluir}
              aoRegistrar={() => abrirNova()}
            />
          )}
        </TabsContent>
      </Tabs>

      <AgendaDiaDialog
        resumo={resumoDia}
        aoFechar={() => setDataSelecionada(null)}
        aoAbrirVisita={(visita) => {
          setDataSelecionada(null)
          setVisitaEmDetalhe(visita)
        }}
      />

      <VisitaFormDialog
        aberto={formAberto}
        aoMudarAberto={(aberto) => {
          setFormAberto(aberto)
          if (!aberto) setDataNovaVisita(undefined)
        }}
        visita={visitaEmEdicao}
        dataInicial={visitaEmEdicao ? undefined : dataNovaVisita}
      />

      <VisitaDetalheDialog
        visita={visitaEmDetalhe}
        aoFechar={() => setVisitaEmDetalhe(null)}
        aoEditar={(visita) => {
          setVisitaEmDetalhe(null)
          abrirEdicao(visita)
        }}
      />

      <ConfirmDialog
        aberto={Boolean(visitaParaExcluir)}
        aoMudarAberto={(aberto) => {
          if (!aberto) setVisitaParaExcluir(null)
        }}
        titulo="Excluir visita?"
        descricao={
          <>
            O atendimento de <strong>{visitaParaExcluir?.cliente.nome}</strong> em{' '}
            <strong>{visitaParaExcluir ? formatarData(visitaParaExcluir.data_atendimento) : ''}</strong> será removido
            definitivamente, junto com os serviços vinculados.
          </>
        }
        textoConfirmar="Excluir visita"
        destrutivo
        aoConfirmar={confirmarExclusao}
      />
    </div>
  )
}
