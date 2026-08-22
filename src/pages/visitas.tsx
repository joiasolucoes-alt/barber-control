import * as React from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CalendarRange, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DatePicker } from '@/components/common/date-picker'
import { ErrorState, TableSkeleton } from '@/components/common/data-state'
import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { VisitaDetalheDialog } from '@/components/visitas/visita-detalhe-dialog'
import { VisitaFormDialog } from '@/components/visitas/visita-form-dialog'
import { VisitaMobileCard } from '@/components/visitas/visita-mobile-card'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { useDebounce } from '@/hooks/use-debounce'
import {
  dateParaDataISO,
  formatarData,
  formatarDataExtensa,
  normalizar,
  pluralizar,
  telefoneCombina,
} from '@/lib/format'
import { visitasDaData } from '@/lib/metrics'
import type { VisitaDetalhada } from '@/types'

const TAMANHO_BLOCO = 30

export function VisitasPage() {
  const { visitas, carregando, erro, recarregar, excluirVisita } = useBarberData()

  const [busca, setBusca] = React.useState('')
  const [dataInicial, setDataInicial] = React.useState<string | null>(null)
  const [dataFinal, setDataFinal] = React.useState<string | null>(null)
  const [dataDoDia, setDataDoDia] = React.useState<string>(dateParaDataISO(new Date()))

  const [formAberto, setFormAberto] = React.useState(false)
  const [visitaEmEdicao, setVisitaEmEdicao] = React.useState<VisitaDetalhada | null>(null)
  const [visitaEmDetalhe, setVisitaEmDetalhe] = React.useState<VisitaDetalhada | null>(null)
  const [visitaParaExcluir, setVisitaParaExcluir] = React.useState<VisitaDetalhada | null>(null)

  const buscaAdiada = useDebounce(busca)

  // A lista pode ter centenas de registros: renderiza em blocos.
  const [limite, setLimite] = React.useState(TAMANHO_BLOCO)

  const filtradas = React.useMemo(() => {
    const termo = normalizar(buscaAdiada)
    return visitas.filter((visita) => {
      if (dataInicial && visita.data_atendimento < dataInicial) return false
      if (dataFinal && visita.data_atendimento > dataFinal) return false
      if (!termo) return true
      return (
        normalizar(visita.cliente.nome).includes(termo) ||
        telefoneCombina(visita.cliente.telefone, buscaAdiada) ||
        visita.servicos.some((servico) => normalizar(servico.nome).includes(termo))
      )
    })
  }, [visitas, buscaAdiada, dataInicial, dataFinal])

  React.useEffect(() => {
    setLimite(TAMANHO_BLOCO)
  }, [buscaAdiada, dataInicial, dataFinal])

  const visiveis = React.useMemo(() => filtradas.slice(0, limite), [filtradas, limite])

  const doDia = React.useMemo(() => visitasDaData(visitas, dataDoDia), [visitas, dataDoDia])
  const clientesDoDia = new Set(doDia.map((visita) => visita.cliente_id)).size

  function abrirNova() {
    setVisitaEmEdicao(null)
    setFormAberto(true)
  }

  function abrirEdicao(visita: VisitaDetalhada) {
    setVisitaEmEdicao(visita)
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

  const filtrosAtivos = Boolean(busca || dataInicial || dataFinal)

  function limparFiltros() {
    setBusca('')
    setDataInicial(null)
    setDataFinal(null)
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Visitas" descricao="Atendimentos já realizados na barbearia." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Visitas"
        descricao="Registro dos atendimentos que já aconteceram. Cada visita pode ter vários serviços."
        acoes={
          <Button onClick={abrirNova}>
            <Plus aria-hidden /> Registrar visita
          </Button>
        }
      />

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">
            <CalendarRange aria-hidden className="h-4 w-4" /> Lista
          </TabsTrigger>
          <TabsTrigger value="dia">
            <CalendarDays aria-hidden className="h-4 w-4" /> Por dia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="visitas-busca">Buscar</Label>
                <SearchInput
                  id="visitas-busca"
                  rotulo="Buscar por cliente ou serviço"
                  placeholder="Cliente, telefone ou serviço"
                  valor={busca}
                  aoMudar={setBusca}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visitas-de">De</Label>
                <DatePicker id="visitas-de" valor={dataInicial} aoMudar={setDataInicial} bloquearFuturo />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visitas-ate">Até</Label>
                <DatePicker id="visitas-ate" valor={dataFinal} aoMudar={setDataFinal} bloquearFuturo />
              </div>
              <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-4">
                <span className="text-sm text-muted-foreground">
                  {filtradas.length} {pluralizar(filtradas.length, 'visita encontrada', 'visitas encontradas')}
                </span>
                {filtrosAtivos ? (
                  <Button variant="ghost" size="sm" onClick={limparFiltros}>
                    Limpar filtros
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {carregando ? (
            <Card>
              <TableSkeleton linhas={6} colunas={4} />
            </Card>
          ) : filtradas.length === 0 ? (
            <EmptyState
              icone={<CalendarRange />}
              titulo={filtrosAtivos ? 'Nenhuma visita para esses filtros' : 'Nenhuma visita registrada'}
              descricao={
                filtrosAtivos
                  ? 'Ajuste o intervalo de datas ou a busca por cliente.'
                  : 'Registre o primeiro atendimento realizado na barbearia.'
              }
              acao={
                filtrosAtivos ? (
                  <Button variant="outline" onClick={limparFiltros}>
                    Limpar filtros
                  </Button>
                ) : (
                  <Button onClick={abrirNova}>
                    <Plus aria-hidden /> Registrar visita
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {visiveis.map((visita) => (
                  <VisitaMobileCard
                    key={visita.id}
                    visita={visita}
                    aoVisualizar={() => setVisitaEmDetalhe(visita)}
                    aoEditar={() => abrirEdicao(visita)}
                    aoExcluir={() => setVisitaParaExcluir(visita)}
                  />
                ))}
              </div>

              <Card className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead className="hidden lg:table-cell">Observações</TableHead>
                    <TableHead className="w-12 text-right">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((visita) => (
                    <TableRow key={visita.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ClienteAvatar nome={visita.cliente.nome} />
                          <div className="min-w-0">
                            <Link
                              to={`/clientes/${visita.cliente_id}`}
                              className="block truncate font-medium hover:text-primary hover:underline"
                            >
                              {visita.cliente.nome}
                            </Link>
                            <span className="block text-xs text-muted-foreground sm:hidden">
                              {formatarData(visita.data_atendimento)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap tabular-nums sm:table-cell">
                        {formatarData(visita.data_atendimento)}
                      </TableCell>
                      <TableCell>
                        <VisitaServicosTags servicos={visita.servicos} limite={3} />
                      </TableCell>
                      <TableCell className="hidden max-w-xs lg:table-cell">
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {visita.observacoes ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconSm" aria-label={`Ações da visita de ${visita.cliente.nome}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setVisitaEmDetalhe(visita)}>
                              <Eye aria-hidden /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => abrirEdicao(visita)}>
                              <Pencil aria-hidden /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onSelect={() => setVisitaParaExcluir(visita)}>
                              <Trash2 aria-hidden /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visiveis.length < filtradas.length ? (
                <div className="flex items-center justify-center gap-3 border-t border-border p-4">
                  <span className="text-sm text-muted-foreground">
                    Exibindo {visiveis.length} de {filtradas.length}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setLimite((atual) => atual + TAMANHO_BLOCO)}>
                    Carregar mais
                  </Button>
                </div>
              ) : null}
              </Card>

              {visiveis.length < filtradas.length ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row md:hidden">
                  <span className="text-sm text-muted-foreground">
                    Exibindo {visiveis.length} de {filtradas.length}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setLimite((atual) => atual + TAMANHO_BLOCO)}>
                    Carregar mais
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="dia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes atendidos em uma data</CardTitle>
              <CardDescription>
                Selecione um dia para consultar quem passou pela barbearia. Esta consulta olha apenas para atendimentos
                já realizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-1.5 sm:w-64">
                  <Label htmlFor="visitas-dia">Data</Label>
                  <DatePicker
                    id="visitas-dia"
                    valor={dataDoDia}
                    aoMudar={(valor) => setDataDoDia(valor ?? dateParaDataISO(new Date()))}
                    bloquearFuturo
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setDataDoDia(dateParaDataISO(new Date()))}>
                    Hoje
                  </Button>
                  <Button onClick={abrirNova}>
                    <Plus aria-hidden /> Registrar visita
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="heading-display text-lg font-semibold">{formatarDataExtensa(dataDoDia)}</p>
                <p className="text-muted-foreground">
                  {clientesDoDia} {pluralizar(clientesDoDia, 'cliente atendido', 'clientes atendidos')} ·{' '}
                  {doDia.length} {pluralizar(doDia.length, 'visita registrada', 'visitas registradas')}
                </p>
              </div>

              {carregando ? (
                <TableSkeleton linhas={4} colunas={3} />
              ) : doDia.length === 0 ? (
                <EmptyState
                  icone={<CalendarDays />}
                  titulo="Nenhum cliente atendido nesta data"
                  descricao="Escolha outra data ou registre um atendimento realizado neste dia."
                  acao={
                    <Button onClick={abrirNova}>
                      <Plus aria-hidden /> Registrar visita
                    </Button>
                  }
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {doDia.map((visita) => (
                    <li key={visita.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-3">
                        <ClienteAvatar nome={visita.cliente.nome} />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Link
                            to={`/clientes/${visita.cliente_id}`}
                            className="block truncate font-medium hover:text-primary hover:underline"
                          >
                            {visita.cliente.nome}
                          </Link>
                          <VisitaServicosTags servicos={visita.servicos} />
                          {visita.observacoes ? (
                            <p className="text-sm text-muted-foreground">{visita.observacoes}</p>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          aria-label={`Ver detalhes da visita de ${visita.cliente.nome}`}
                          onClick={() => setVisitaEmDetalhe(visita)}
                        >
                          <Eye />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VisitaFormDialog
        aberto={formAberto}
        aoMudarAberto={setFormAberto}
        visita={visitaEmEdicao}
        dataInicial={visitaEmEdicao ? undefined : dataDoDia}
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
