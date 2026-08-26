import * as React from 'react'
import { startOfMonth, subDays } from 'date-fns'
import { CalendarRange, Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AgendaResumo } from '@/components/agenda/agenda-resumo'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { EmptyState } from '@/components/common/empty-state'
import { SearchInput } from '@/components/common/search-input'
import { VisitaServicosTags } from '@/components/visitas/visita-servicos-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDebounce } from '@/hooks/use-debounce'
import { agruparAgendaPorDia, resumirAgendaPeriodo } from '@/lib/agenda'
import { dateParaDataISO, formatarDataExtensa, formatarMoeda, normalizar, pluralizar, telefoneCombina } from '@/lib/format'
import { valorDaVisita } from '@/lib/visitas'
import type { VisitaDetalhada } from '@/types'

type PeriodoLista = 'total' | 'mes' | '7d' | '30d' | '90d'

const PERIODOS: Array<{ chave: PeriodoLista; rotulo: string }> = [
  { chave: 'total', rotulo: 'Todos' },
  { chave: 'mes', rotulo: 'Este mês' },
  { chave: '7d', rotulo: '7 dias' },
  { chave: '30d', rotulo: '30 dias' },
  { chave: '90d', rotulo: '90 dias' },
]

const DIAS_POR_PAGINA = 10

interface AgendaListaProps {
  visitas: VisitaDetalhada[]
  aoVisualizar: (visita: VisitaDetalhada) => void
  aoEditar: (visita: VisitaDetalhada) => void
  aoExcluir: (visita: VisitaDetalhada) => void
  aoRegistrar: () => void
}

interface AgendaVisitaItemProps {
  visita: VisitaDetalhada
  aoVisualizar: () => void
  aoEditar: () => void
  aoExcluir: () => void
}

function AgendaVisitaItem({ visita, aoVisualizar, aoEditar, aoExcluir }: AgendaVisitaItemProps) {
  return (
    <li className="flex min-w-0 items-start gap-2.5 px-3 py-3 sm:px-4">
      <ClienteAvatar nome={visita.cliente.nome} className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Link to={`/clientes/${visita.cliente_id}`} className="block truncate text-sm font-semibold hover:text-primary hover:underline">
          {visita.cliente.nome}
        </Link>
        <VisitaServicosTags servicos={visita.servicos} limite={3} />
      </div>
      <div className="flex shrink-0 items-start gap-0.5">
        <Button type="button" variant="ghost" size="sm" className="h-control px-2 text-primary" onClick={aoVisualizar}>
          <Eye aria-hidden /> <span className="metric-number">{formatarMoeda(valorDaVisita(visita))}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="iconSm" aria-label={`Ações da visita de ${visita.cliente.nome}`}>
              <MoreVertical aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={aoVisualizar}>
              <Eye aria-hidden /> Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={aoEditar}>
              <Pencil aria-hidden /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={aoExcluir}>
              <Trash2 aria-hidden /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

export function AgendaLista({ visitas, aoVisualizar, aoEditar, aoExcluir, aoRegistrar }: AgendaListaProps) {
  const [periodo, setPeriodo] = React.useState<PeriodoLista>('total')
  const [busca, setBusca] = React.useState('')
  const [limiteDias, setLimiteDias] = React.useState(DIAS_POR_PAGINA)
  const buscaAdiada = useDebounce(busca)

  const filtradas = React.useMemo(() => {
    const hoje = new Date()
    const hojeISO = dateParaDataISO(hoje)
    const inicio =
      periodo === 'mes'
        ? dateParaDataISO(startOfMonth(hoje))
        : periodo === '7d'
          ? dateParaDataISO(subDays(hoje, 6))
          : periodo === '30d'
            ? dateParaDataISO(subDays(hoje, 29))
            : periodo === '90d'
              ? dateParaDataISO(subDays(hoje, 89))
              : null
    const termo = normalizar(buscaAdiada)

    return visitas.filter((visita) => {
      if (inicio && (visita.data_atendimento < inicio || visita.data_atendimento > hojeISO)) return false
      if (!termo) return true
      return (
        normalizar(visita.cliente.nome).includes(termo) ||
        telefoneCombina(visita.cliente.telefone, buscaAdiada) ||
        visita.servicos.some((servico) => normalizar(servico.nome).includes(termo))
      )
    })
  }, [buscaAdiada, periodo, visitas])

  React.useEffect(() => setLimiteDias(DIAS_POR_PAGINA), [buscaAdiada, periodo])

  const resumo = React.useMemo(() => resumirAgendaPeriodo(filtradas), [filtradas])
  const grupos = React.useMemo(() => agruparAgendaPorDia(filtradas), [filtradas])
  const gruposVisiveis = grupos.slice(0, limiteDias)

  return (
    <div className="space-y-4">
      <AgendaResumo resumo={resumo} rotulo="período da lista" />

      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <SearchInput
            id="agenda-lista-busca"
            rotulo="Buscar histórico por cliente, telefone ou serviço"
            placeholder="Buscar cliente, telefone ou serviço"
            valor={busca}
            aoMudar={setBusca}
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar período da agenda">
            {PERIODOS.map((opcao) => {
              const ativo = periodo === opcao.chave
              return (
                <Button
                  key={opcao.chave}
                  type="button"
                  size="sm"
                  variant={ativo ? 'default' : 'outline'}
                  aria-pressed={ativo}
                  onClick={() => setPeriodo(opcao.chave)}
                  className="shrink-0 rounded-full px-3"
                >
                  {opcao.rotulo}
                </Button>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtradas.length} {pluralizar(filtradas.length, 'visita encontrada', 'visitas encontradas')} em {grupos.length}{' '}
            {pluralizar(grupos.length, 'dia', 'dias')}
          </p>
        </CardContent>
      </Card>

      {filtradas.length === 0 ? (
        <EmptyState
          icone={<CalendarRange />}
          titulo="Nenhuma visita encontrada"
          descricao="Ajuste o período ou registre um novo atendimento."
          acao={<Button onClick={aoRegistrar}>Registrar visita</Button>}
        />
      ) : (
        <div className="space-y-3">
          {gruposVisiveis.map((dia) => (
            <Card key={dia.data} className="overflow-hidden">
              <CardHeader className="gap-2 border-b border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <CardTitle className="text-base">{formatarDataExtensa(dia.data)}</CardTitle>
                <p className="text-xs tabular-nums text-muted-foreground sm:text-right">
                  {dia.atendimentos} {pluralizar(dia.atendimentos, 'atendimento', 'atendimentos')} · {dia.clientes}{' '}
                  {pluralizar(dia.clientes, 'cliente', 'clientes')} · <strong className="text-foreground">{formatarMoeda(dia.receita)}</strong>
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {dia.visitas.map((visita) => (
                    <AgendaVisitaItem
                      key={visita.id}
                      visita={visita}
                      aoVisualizar={() => aoVisualizar(visita)}
                      aoEditar={() => aoEditar(visita)}
                      aoExcluir={() => aoExcluir(visita)}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {gruposVisiveis.length < grupos.length ? (
            <Button type="button" variant="outline" className="w-full" onClick={() => setLimiteDias((atual) => atual + DIAS_POR_PAGINA)}>
              Carregar mais dias
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
