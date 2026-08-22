import * as React from 'react'
import { Ban, CheckCircle2, MoreHorizontal, Pencil, Plus, Scissors, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState, TableSkeleton } from '@/components/common/data-state'
import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { StatusBadge } from '@/components/common/status-badge'
import { ServicoFormDialog } from '@/components/servicos/servico-form-dialog'
import { ServicoMobileCard } from '@/components/servicos/servico-mobile-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/sonner'
import { useBarberData } from '@/hooks/use-barber-data'
import { useDebounce } from '@/hooks/use-debounce'
import { formatarDuracao, formatarMoeda, formatarNumero, normalizar, pluralizar } from '@/lib/format'
import { rankingServicos } from '@/lib/metrics'
import type { Servico, StatusRegistro } from '@/types'

export function ServicosPage() {
  const { servicos, visitas, carregando, erro, recarregar, alterarStatusServico, excluirServico } = useBarberData()

  const [busca, setBusca] = React.useState('')
  const [formAberto, setFormAberto] = React.useState(false)
  const [servicoEmEdicao, setServicoEmEdicao] = React.useState<Servico | null>(null)
  const [servicoParaInativar, setServicoParaInativar] = React.useState<Servico | null>(null)
  const [servicoParaExcluir, setServicoParaExcluir] = React.useState<Servico | null>(null)

  const buscaAdiada = useDebounce(busca)

  const usoPorServico = React.useMemo(() => {
    const mapa = new Map<string, number>()
    rankingServicos(visitas).forEach((item) => mapa.set(item.id, item.total))
    return mapa
  }, [visitas])

  const filtrados = React.useMemo(() => {
    const termo = normalizar(buscaAdiada)
    if (!termo) return servicos
    return servicos.filter(
      (servico) =>
        normalizar(servico.nome).includes(termo) || normalizar(servico.descricao ?? '').includes(termo),
    )
  }, [servicos, buscaAdiada])

  const ativos = servicos.filter((servico) => servico.status === 'ativo').length

  function abrirNovo() {
    setServicoEmEdicao(null)
    setFormAberto(true)
  }

  async function alternarStatus(servico: Servico) {
    const novoStatus: StatusRegistro = servico.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await alterarStatusServico(servico.id, novoStatus)
      toast.success(novoStatus === 'inativo' ? 'Serviço inativado' : 'Serviço reativado', {
        description: `${servico.nome} agora está ${novoStatus}.`,
      })
    } catch (falha) {
      toast.error('Não foi possível alterar o status', {
        description: falha instanceof Error ? falha.message : 'Tente novamente em instantes.',
      })
    }
  }

  function solicitarExclusao(servico: Servico) {
    const totalRealizados = usoPorServico.get(servico.id) ?? 0
    if (totalRealizados > 0) {
      toast.warning('Serviço com histórico não pode ser excluído', {
        description: `${servico.nome} aparece em ${totalRealizados} ${pluralizar(totalRealizados, 'atendimento', 'atendimentos')}. Inative-o para preservar os relatórios.`,
      })
      return
    }
    setServicoParaExcluir(servico)
  }

  async function confirmarExclusaoServico() {
    if (!servicoParaExcluir) return
    try {
      await excluirServico(servicoParaExcluir.id)
      toast.success('Serviço excluído', {
        description: `${servicoParaExcluir.nome} foi removido definitivamente.`,
      })
      setServicoParaExcluir(null)
    } catch (falha) {
      toast.error('Não foi possível excluir o serviço', {
        description: falha instanceof Error ? falha.message : 'Tente novamente em instantes.',
      })
    }
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Serviços" descricao="Serviços oferecidos pela barbearia." />
        <ErrorState mensagem={erro} aoTentarNovamente={() => void recarregar()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Serviços"
        descricao={`${servicos.length} ${pluralizar(servicos.length, 'serviço cadastrado', 'serviços cadastrados')} · ${ativos} ${pluralizar(ativos, 'ativo', 'ativos')}. Um mesmo atendimento pode combinar vários serviços.`}
        acoes={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden /> Novo serviço
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput
            id="servicos-busca"
            className="sm:max-w-sm sm:flex-1"
            rotulo="Buscar serviço"
            placeholder="Buscar por nome ou descrição"
            valor={busca}
            aoMudar={setBusca}
          />
          <span className="text-sm text-muted-foreground sm:ml-auto">
            {filtrados.length} {pluralizar(filtrados.length, 'resultado', 'resultados')}
          </span>
        </CardContent>
      </Card>

      {carregando ? (
        <Card>
          <TableSkeleton linhas={5} colunas={4} />
        </Card>
      ) : servicos.length === 0 ? (
        <EmptyState
          icone={<Scissors />}
          titulo="Nenhum serviço cadastrado"
          descricao="Cadastre os serviços da barbearia para vinculá-los às visitas."
          acao={
            <Button onClick={abrirNovo}>
              <Plus aria-hidden /> Cadastrar serviço
            </Button>
          }
        />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icone={<Scissors />}
          titulo="Nenhum serviço encontrado"
          descricao="Tente outro termo de busca."
          acao={
            <Button variant="outline" onClick={() => setBusca('')}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtrados.map((servico) => (
              <ServicoMobileCard
                key={servico.id}
                servico={servico}
                realizados={usoPorServico.get(servico.id) ?? 0}
                aoEditar={() => {
                  setServicoEmEdicao(servico)
                  setFormAberto(true)
                }}
                aoInativar={() => setServicoParaInativar(servico)}
                aoReativar={() => void alternarStatus(servico)}
                aoExcluir={() => solicitarExclusao(servico)}
              />
            ))}
          </div>

          <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead className="hidden sm:table-cell">Preço</TableHead>
                <TableHead className="hidden md:table-cell">Duração</TableHead>
                <TableHead className="hidden lg:table-cell">Realizados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium">{servico.nome}</p>
                      {servico.descricao ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{servico.descricao}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatarMoeda(servico.preco)} · {formatarDuracao(servico.duracao_estimada)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums sm:table-cell">
                    {formatarMoeda(servico.preco)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell text-muted-foreground">
                    {formatarDuracao(servico.duracao_estimada)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">
                    {formatarNumero(usoPorServico.get(servico.id) ?? 0)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={servico.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" aria-label={`Ações de ${servico.nome}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setServicoEmEdicao(servico)
                            setFormAberto(true)
                          }}
                        >
                          <Pencil aria-hidden /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {servico.status === 'ativo' ? (
                          <DropdownMenuItem destructive onSelect={() => setServicoParaInativar(servico)}>
                            <Ban aria-hidden /> Inativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => void alternarStatus(servico)}>
                            <CheckCircle2 aria-hidden /> Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => solicitarExclusao(servico)}>
                          <Trash2 aria-hidden /> Excluir definitivamente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Card>
        </>
      )}

      <ServicoFormDialog aberto={formAberto} aoMudarAberto={setFormAberto} servico={servicoEmEdicao} />

      <ConfirmDialog
        aberto={Boolean(servicoParaInativar)}
        aoMudarAberto={(aberto) => {
          if (!aberto) setServicoParaInativar(null)
        }}
        titulo="Inativar serviço?"
        descricao={
          <>
            <strong>{servicoParaInativar?.nome}</strong> deixará de aparecer na seleção de novas visitas. As visitas já
            registradas continuam com o serviço vinculado.
          </>
        }
        textoConfirmar="Inativar serviço"
        destrutivo
        aoConfirmar={async () => {
          if (servicoParaInativar) await alternarStatus(servicoParaInativar)
          setServicoParaInativar(null)
        }}
      />

      <ConfirmDialog
        aberto={Boolean(servicoParaExcluir)}
        aoMudarAberto={(aberto) => {
          if (!aberto) setServicoParaExcluir(null)
        }}
        titulo="Excluir serviço definitivamente?"
        descricao={
          <>
            <strong>{servicoParaExcluir?.nome}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
          </>
        }
        textoConfirmar="Excluir serviço"
        destrutivo
        aoConfirmar={confirmarExclusaoServico}
      />
    </div>
  )
}
