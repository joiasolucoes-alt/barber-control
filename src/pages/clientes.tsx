import * as React from 'react'
import { Link } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, Plus, UserCheck, UserRoundX, Users } from 'lucide-react'

import { ClienteFormDialog } from '@/components/clientes/cliente-form-dialog'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { useDebounce } from '@/hooks/use-debounce'
import { formatarData, normalizar, pluralizar } from '@/lib/format'
import { resumirCliente } from '@/lib/metrics'
import type { Cliente, StatusRegistro } from '@/types'

type FiltroStatus = 'todos' | StatusRegistro

export function ClientesPage() {
  const { clientes, visitas, carregando, erro, recarregar, alterarStatusCliente } = useBarberData()

  const [busca, setBusca] = React.useState('')
  const [filtroStatus, setFiltroStatus] = React.useState<FiltroStatus>('ativo')
  const [formAberto, setFormAberto] = React.useState(false)
  const [clienteEmEdicao, setClienteEmEdicao] = React.useState<Cliente | null>(null)
  const [clienteParaInativar, setClienteParaInativar] = React.useState<Cliente | null>(null)

  const buscaAdiada = useDebounce(busca)

  const filtrados = React.useMemo(() => {
    const termo = normalizar(buscaAdiada)
    return clientes.filter((cliente) => {
      const combinaStatus = filtroStatus === 'todos' || cliente.status === filtroStatus
      if (!combinaStatus) return false
      if (!termo) return true
      return normalizar(cliente.nome).includes(termo) || normalizar(cliente.telefone).includes(termo)
    })
  }, [clientes, buscaAdiada, filtroStatus])

  const resumoPorCliente = React.useMemo(() => {
    const mapa = new Map<string, { total: number; ultima: string | null }>()
    clientes.forEach((cliente) => {
      const resumo = resumirCliente(cliente.id, visitas)
      mapa.set(cliente.id, { total: resumo.totalVisitas, ultima: resumo.ultimaVisita })
    })
    return mapa
  }, [clientes, visitas])

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

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Clientes" descricao="Cadastro e histórico dos clientes da barbearia." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  const totalCadastrados = clientes.length
  const semNenhumCadastro = !carregando && totalCadastrados === 0

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Clientes"
        descricao={`${totalCadastrados} ${pluralizar(totalCadastrados, 'cliente cadastrado', 'clientes cadastrados')} no total.`}
        acoes={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden /> Novo cliente
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              className="sm:max-w-sm sm:flex-1"
              rotulo="Buscar cliente por nome ou telefone"
              placeholder="Buscar por nome ou telefone"
              valor={busca}
              aoMudar={setBusca}
            />
            <Select value={filtroStatus} onValueChange={(valor) => setFiltroStatus(valor as FiltroStatus)}>
              <SelectTrigger className="sm:w-44" aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Somente ativos</SelectItem>
                <SelectItem value="inativo">Somente inativos</SelectItem>
                <SelectItem value="todos">Todos os status</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground sm:ml-auto">
              {filtrados.length} {pluralizar(filtrados.length, 'resultado', 'resultados')}
            </span>
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
          descricao="Ajuste a busca ou o filtro de status para ver outros clientes."
          acao={
            <Button
              variant="outline"
              onClick={() => {
                setBusca('')
                setFiltroStatus('todos')
              }}
            >
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
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                <TableHead className="hidden sm:table-cell">Visitas</TableHead>
                <TableHead className="hidden lg:table-cell">Última visita</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((cliente) => {
                const resumo = resumoPorCliente.get(cliente.id)
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
                          <span className="block text-xs text-muted-foreground md:hidden">{cliente.telefone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">{cliente.telefone}</TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell text-muted-foreground">
                      {formatarData(cliente.created_at.slice(0, 10))}
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{resumo?.total ?? 0}</TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell text-muted-foreground">
                      {resumo?.ultima ? formatarData(resumo.ultima) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={cliente.status} />
                    </TableCell>
                    <TableCell className="text-right">
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
