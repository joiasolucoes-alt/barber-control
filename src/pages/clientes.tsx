import * as React from 'react'
import { Link } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, Plus, UserCheck, UserRoundX, Users } from 'lucide-react'

import { BotaoWhatsApp } from '@/components/clientes/botao-whatsapp'
import { ClienteFormDialog } from '@/components/clientes/cliente-form-dialog'
import { CardAniversariantes, CardPrecisamDeAtencao } from '@/components/clientes/painel-retencao'
import { SituacaoBadge } from '@/components/clientes/situacao-badge'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState, TableSkeleton } from '@/components/common/data-state'
import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { StatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { useDebounce } from '@/hooks/use-debounce'
import {
  analisarClientes,
  aniversariantesDoMes,
  clientesParaRecuperar,
  DESCRICOES_SITUACAO,
  mensagemRetorno,
  resumirSituacoes,
  type SituacaoCliente,
} from '@/lib/clientes-analise'
import { exibirTelefone, formatarData, normalizar, pluralizar, telefoneCombina } from '@/lib/format'
import type { Cliente, StatusRegistro } from '@/types'

type FiltroStatus = 'todos' | StatusRegistro
type FiltroSituacao = 'todas' | SituacaoCliente
type Ordenacao = 'nome' | 'ultima-visita' | 'mais-visitas' | 'atraso'

const ORDENACOES: Array<{ valor: Ordenacao; rotulo: string }> = [
  { valor: 'nome', rotulo: 'Nome (A-Z)' },
  { valor: 'ultima-visita', rotulo: 'Última visita' },
  { valor: 'mais-visitas', rotulo: 'Mais visitas' },
  { valor: 'atraso', rotulo: 'Maior atraso' },
]

export function ClientesPage() {
  const { clientes, visitas, carregando, erro, recarregar, alterarStatusCliente } = useBarberData()

  const [busca, setBusca] = React.useState('')
  const [filtroStatus, setFiltroStatus] = React.useState<FiltroStatus>('ativo')
  const [filtroSituacao, setFiltroSituacao] = React.useState<FiltroSituacao>('todas')
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao>('nome')
  const [formAberto, setFormAberto] = React.useState(false)
  const [clienteEmEdicao, setClienteEmEdicao] = React.useState<Cliente | null>(null)
  const [clienteParaInativar, setClienteParaInativar] = React.useState<Cliente | null>(null)

  const buscaAdiada = useDebounce(busca)

  const analises = React.useMemo(() => analisarClientes(clientes, visitas), [clientes, visitas])

  const paraRecuperar = React.useMemo(() => clientesParaRecuperar(analises), [analises])
  const aniversariantes = React.useMemo(() => aniversariantesDoMes(clientes), [clientes])
  const resumo = React.useMemo(() => resumirSituacoes(analises), [analises])

  const filtrados = React.useMemo(() => {
    const termo = normalizar(buscaAdiada)

    const lista = analises.filter(({ cliente, situacao }) => {
      if (filtroStatus !== 'todos' && cliente.status !== filtroStatus) return false
      if (filtroSituacao !== 'todas' && situacao !== filtroSituacao) return false
      if (!termo) return true
      return normalizar(cliente.nome).includes(termo) || telefoneCombina(cliente.telefone, buscaAdiada)
    })

    return [...lista].sort((a, b) => {
      switch (ordenacao) {
        case 'ultima-visita':
          return (b.ultimaVisita ?? '').localeCompare(a.ultimaVisita ?? '')
        case 'mais-visitas':
          return b.totalVisitas - a.totalVisitas
        case 'atraso':
          return (b.diasDeAtraso ?? Number.NEGATIVE_INFINITY) - (a.diasDeAtraso ?? Number.NEGATIVE_INFINITY)
        default:
          return a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR')
      }
    })
  }, [analises, buscaAdiada, filtroStatus, filtroSituacao, ordenacao])

  function abrirNovo() {
    setClienteEmEdicao(null)
    setFormAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEmEdicao(cliente)
    setFormAberto(true)
  }

  async function alternarStatus(cliente: Cliente) {
    const novoStatus: StatusRegistro = cliente.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await alterarStatusCliente(cliente.id, novoStatus)
      toast.success(novoStatus === 'inativo' ? 'Cliente inativado' : 'Cliente reativado', {
        description: `${cliente.nome} agora está ${novoStatus}.`,
      })
    } catch (falha) {
      toast.error('Não foi possível alterar o status', {
        description: falha instanceof Error ? falha.message : 'Tente novamente em instantes.',
      })
    }
  }

  function limparFiltros() {
    setBusca('')
    setFiltroStatus('todos')
    setFiltroSituacao('todas')
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Clientes" descricao="Cadastro, análise e histórico dos clientes da barbearia." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  const totalCadastrados = clientes.length
  const semNenhumCadastro = !carregando && totalCadastrados === 0
  const filtrosAtivos = Boolean(busca) || filtroStatus !== 'todos' || filtroSituacao !== 'todas'

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Clientes"
        descricao={`${totalCadastrados} ${pluralizar(totalCadastrados, 'cliente cadastrado', 'clientes cadastrados')} · ${resumo.porSituacao.recorrente} recorrentes, ${resumo.porSituacao['em-risco']} em risco, ${resumo.porSituacao.perdido} perdidos.`}
        acoes={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden /> Novo cliente
          </Button>
        }
      />

      {!semNenhumCadastro ? (
        <section aria-label="Retenção" className="grid gap-4 lg:grid-cols-2">
          <CardPrecisamDeAtencao analises={paraRecuperar} />
          <CardAniversariantes aniversariantes={aniversariantes} />
        </section>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="clientes-busca">Buscar</Label>
            <SearchInput
              rotulo="Buscar cliente por nome ou telefone"
              placeholder="Nome ou telefone (com ou sem máscara)"
              valor={busca}
              aoMudar={setBusca}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientes-situacao">Situação</Label>
            <Select value={filtroSituacao} onValueChange={(valor) => setFiltroSituacao(valor as FiltroSituacao)}>
              <SelectTrigger id="clientes-situacao" aria-label="Filtrar por situação">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as situações</SelectItem>
                <SelectItem value="recorrente">Recorrentes ({resumo.porSituacao.recorrente})</SelectItem>
                <SelectItem value="novo">Novos ({resumo.porSituacao.novo})</SelectItem>
                <SelectItem value="em-risco">Em risco ({resumo.porSituacao['em-risco']})</SelectItem>
                <SelectItem value="perdido">Perdidos ({resumo.porSituacao.perdido})</SelectItem>
                <SelectItem value="sem-visitas">Sem visitas ({resumo.porSituacao['sem-visitas']})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientes-status">Cadastro</Label>
            <Select value={filtroStatus} onValueChange={(valor) => setFiltroStatus(valor as FiltroStatus)}>
              <SelectTrigger id="clientes-status" aria-label="Filtrar por status do cadastro">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Somente ativos</SelectItem>
                <SelectItem value="inativo">Somente inativos</SelectItem>
                <SelectItem value="todos">Todos os status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="clientes-ordem">Ordenar por</Label>
            <Select value={ordenacao} onValueChange={(valor) => setOrdenacao(valor as Ordenacao)}>
              <SelectTrigger id="clientes-ordem" aria-label="Ordenar lista">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDENACOES.map((opcao) => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">
            <span className="text-sm text-muted-foreground">
              {filtrados.length} {pluralizar(filtrados.length, 'resultado', 'resultados')}
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
          <TableSkeleton linhas={6} colunas={5} />
        </Card>
      ) : semNenhumCadastro ? (
        <EmptyState
          icone={<Users />}
          titulo="Nenhum cliente cadastrado"
          descricao="Cadastre o primeiro cliente para começar a registrar os atendimentos da barbearia."
          acao={
            <Button onClick={abrirNovo}>
              <Plus aria-hidden /> Cadastrar cliente
            </Button>
          }
        />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icone={<Users />}
          titulo="Nenhum cliente encontrado"
          descricao="Ajuste a busca, a situação ou o status do cadastro para ver outros clientes."
          acao={
            <Button variant="outline" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Telefone / WhatsApp</TableHead>
                <TableHead className="hidden sm:table-cell">Visitas</TableHead>
                <TableHead className="hidden lg:table-cell">Última visita</TableHead>
                <TableHead className="hidden xl:table-cell">Ritmo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((analise) => {
                const cliente = analise.cliente
                return (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ClienteAvatar nome={cliente.nome} />
                        <div className="min-w-0">
                          <Link
                            to={`/clientes/${cliente.id}`}
                            className="block truncate font-medium hover:text-primary hover:underline"
                          >
                            {cliente.nome}
                          </Link>
                          <span className="block text-xs text-muted-foreground md:hidden">
                            {exibirTelefone(cliente.telefone)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      {cliente.telefone ? (
                        cliente.telefone
                      ) : (
                        <span className="text-muted-foreground">Sem telefone</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{analise.totalVisitas}</TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell text-muted-foreground">
                      {analise.ultimaVisita ? formatarData(analise.ultimaVisita) : '—'}
                      {analise.diasDesdeUltimaVisita !== null ? (
                        <span className="block text-xs">há {analise.diasDesdeUltimaVisita} dias</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell text-muted-foreground">
                      {analise.intervaloMedioDias ? `${analise.intervaloMedioDias} dias` : '—'}
                    </TableCell>
                    <TableCell>
                      <SituacaoBadge situacao={analise.situacao} titulo={DESCRICOES_SITUACAO[analise.situacao]} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <StatusBadge status={cliente.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <BotaoWhatsApp
                          cliente={cliente}
                          mensagem={
                            analise.situacao === 'em-risco' || analise.situacao === 'perdido'
                              ? mensagemRetorno(cliente)
                              : undefined
                          }
                          variant="ghost"
                          somenteIcone
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconSm" aria-label={`Ações de ${cliente.nome}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/clientes/${cliente.id}`}>
                                <Eye aria-hidden /> Visualizar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => abrirEdicao(cliente)}>
                              <Pencil aria-hidden /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {cliente.status === 'ativo' ? (
                              <DropdownMenuItem destructive onSelect={() => setClienteParaInativar(cliente)}>
                                <UserRoundX aria-hidden /> Inativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={() => void alternarStatus(cliente)}>
                                <UserCheck aria-hidden /> Reativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <ClienteFormDialog aberto={formAberto} aoMudarAberto={setFormAberto} cliente={clienteEmEdicao} />

      <ConfirmDialog
        aberto={Boolean(clienteParaInativar)}
        aoMudarAberto={(aberto) => {
          if (!aberto) setClienteParaInativar(null)
        }}
        titulo="Inativar cliente?"
        descricao={
          <>
            <strong>{clienteParaInativar?.nome}</strong> deixará de aparecer nas listagens padrão e não poderá ser
            escolhido em novas visitas. O histórico de atendimentos é mantido e o cliente pode ser reativado a
            qualquer momento.
          </>
        }
        textoConfirmar="Inativar cliente"
        destrutivo
        aoConfirmar={async () => {
          if (clienteParaInativar) await alternarStatus(clienteParaInativar)
          setClienteParaInativar(null)
        }}
      />
    </div>
  )
}
