import { Cake, HeartHandshake, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BotaoWhatsApp } from '@/components/clientes/botao-whatsapp'
import { SituacaoBadge } from '@/components/clientes/situacao-badge'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatarData, pluralizar } from '@/lib/format'
import { mensagemRetorno, type AnaliseCliente, type Aniversariante } from '@/lib/clientes-analise'

const LIMITE_LISTA = 6

/** Clientes que passaram do ritmo habitual, ordenados por relevância. */
export function CardPrecisamDeAtencao({ analises }: { analises: AnaliseCliente[] }) {
  const visiveis = analises.slice(0, LIMITE_LISTA)

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
                <SituacaoBadge situacao={analise.situacao} />
                <BotaoWhatsApp cliente={analise.cliente} mensagem={mensagemRetorno(analise.cliente)} somenteIcone />
              </li>
            ))}
          </ul>
        )}

        {analises.length > visiveis.length ? (
          <p className="pt-3 text-xs text-muted-foreground">
            e mais {analises.length - visiveis.length}{' '}
            {pluralizar(analises.length - visiveis.length, 'cliente', 'clientes')} — use o filtro de situação na
            lista abaixo.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Aniversariantes do mês corrente. */
export function CardAniversariantes({ aniversariantes }: { aniversariantes: Aniversariante[] }) {
  const visiveis = aniversariantes.slice(0, LIMITE_LISTA)

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
          <ul className="divide-y divide-border">
            {visiveis.map((item) => (
              <li key={item.cliente.id} className="flex items-center gap-3 py-3 first:pt-0">
                <ClienteAvatar nome={item.cliente.nome} />
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
                {item.ehHoje ? <Badge variant="default">Hoje</Badge> : null}
                <BotaoWhatsApp
                  cliente={item.cliente}
                  mensagem={`Parabéns, ${item.cliente.nome.split(' ')[0]}! Muitas felicidades. Um abraço da barbearia.`}
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
