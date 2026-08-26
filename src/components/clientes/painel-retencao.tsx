import { Cake, HeartHandshake, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BotaoWhatsApp } from '@/components/clientes/botao-whatsapp'
import { SituacaoBadge } from '@/components/clientes/situacao-badge'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatarData, pluralizar } from '@/lib/format'
import { mensagemRetorno, type AnaliseCliente, type Aniversariante } from '@/lib/clientes-analise'

const LIMITE_RETENCAO = 3
const LIMITE_ANIVERSARIOS = 6

interface CardPrecisamDeAtencaoProps {
  analises: AnaliseCliente[]
  aoVerTodos?: () => void
}

/** Clientes que passaram do ritmo habitual, ordenados por relevância. */
export function CardPrecisamDeAtencao({ analises, aoVerTodos }: CardPrecisamDeAtencaoProps) {
  const visiveis = analises.slice(0, LIMITE_RETENCAO)

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake aria-hidden className="h-4 w-4 text-primary" /> Precisam de atenção
          </CardTitle>
          <CardDescription>
            Quem passou do próprio ritmo de retorno. Os mais frequentes aparecem primeiro.
          </CardDescription>
        </div>
        {analises.length > 0 ? <Badge variant="default">{analises.length}</Badge> : null}
      </CardHeader>
      <CardContent>
        {visiveis.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            <Sparkles aria-hidden className="h-4 w-4 text-primary" />
            Nenhum cliente atrasado. Todo mundo está voltando no ritmo esperado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {visiveis.map((analise) => (
              <li key={analise.cliente.id} className="flex items-center gap-3 py-3 first:pt-0">
                <ClienteAvatar nome={analise.cliente.nome} />
                <div className="min-w-0 flex-1 space-y-1">
                  <Link
                    to={`/clientes/${analise.cliente.id}`}
                    className="block truncate text-sm font-medium hover:text-primary hover:underline"
                  >
                    {analise.cliente.nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {analise.totalVisitas} {pluralizar(analise.totalVisitas, 'visita', 'visitas')} · vinha a cada{' '}
                    {analise.intervaloReferenciaDias} dias · {analise.diasDeAtraso} dias de atraso
                  </p>
                </div>
                <SituacaoBadge situacao={analise.situacao} className="hidden min-[360px]:inline-flex" />
                <BotaoWhatsApp cliente={analise.cliente} mensagem={mensagemRetorno(analise.cliente)} somenteIcone />
              </li>
            ))}
          </ul>
        )}

        {analises.length > visiveis.length && aoVerTodos ? (
          <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={aoVerTodos}>
            Ver todos os {analises.length} clientes prioritários
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Aniversariantes do mês corrente. */
export function CardAniversariantes({ aniversariantes }: { aniversariantes: Aniversariante[] }) {
  const visiveis = aniversariantes.slice(0, LIMITE_ANIVERSARIOS)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake aria-hidden className="h-4 w-4 text-primary" /> Aniversariantes do mês
        </CardTitle>
        <CardDescription>Uma mensagem no dia costuma trazer o cliente de volta.</CardDescription>
      </CardHeader>
      <CardContent>
        {visiveis.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum aniversariante neste mês entre os clientes com data de nascimento cadastrada.
          </p>
        ) : (
          <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
            {visiveis.map((item) => (
              <li key={item.cliente.id} className="flex min-w-[15rem] snap-start items-center gap-2.5 rounded-xl border border-border bg-muted/20 p-3">
                <ClienteAvatar nome={item.cliente.nome} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clientes/${item.cliente.id}`}
                    className="block truncate text-sm font-medium hover:text-primary hover:underline"
                  >
                    {item.cliente.nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(item.cliente.data_nascimento)}
                    {item.idade ? ` · faz ${item.idade} anos` : ''}
                  </p>
                </div>
                {item.ehHoje ? <Badge variant="default" className="px-2">Hoje</Badge> : null}
                <BotaoWhatsApp
                  cliente={item.cliente}
                  mensagem={`Parabéns, ${item.cliente.nome.split(' ')[0]}! Muitas felicidades. Um abraço da André Garcia Barber Shop.`}
                  somenteIcone
                />
              </li>
            ))}
          </ul>
        )}

        {aniversariantes.length > visiveis.length ? (
          <p className="pt-3 text-xs text-muted-foreground">
            e mais {aniversariantes.length - visiveis.length}{' '}
            {pluralizar(aniversariantes.length - visiveis.length, 'aniversariante', 'aniversariantes')}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
