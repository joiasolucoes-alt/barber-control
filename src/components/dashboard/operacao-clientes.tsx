import { Cake, HeartHandshake, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BotaoWhatsApp } from '@/components/clientes/botao-whatsapp'
import { ClienteAvatar } from '@/components/common/cliente-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarData, pluralizar } from '@/lib/format'
import {
  mensagemRetorno,
  type AnaliseCliente,
  type ProximoAniversariante,
} from '@/lib/clientes-analise'

interface CardOperacionalProps<T> {
  itens: T[]
  carregando?: boolean
}

export function RecuperacaoPrioritaria({ itens, carregando }: CardOperacionalProps<AnaliseCliente>) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake aria-hidden className="h-4 w-4 text-primary" /> Recuperação prioritária
          </CardTitle>
          <CardDescription>Os três contatos com maior potencial de retorno.</CardDescription>
        </div>
        {itens.length > 0 ? <Badge>{itens.length}</Badge> : null}
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, indice) => <Skeleton key={indice} className="h-14 w-full" />)}
          </div>
        ) : itens.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-5 text-sm text-muted-foreground">
            <Sparkles aria-hidden className="h-4 w-4 shrink-0 text-primary" /> Nenhum cliente precisa de contato agora.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {itens.map((analise) => (
              <li key={analise.cliente.id} className="flex min-w-0 items-center gap-2.5 py-3 first:pt-0 last:pb-0">
                <ClienteAvatar nome={analise.cliente.nome} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <Link to={`/clientes/${analise.cliente.id}`} className="block truncate text-sm font-semibold hover:text-primary hover:underline">
                    {analise.cliente.nome}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {analise.totalVisitas} {pluralizar(analise.totalVisitas, 'visita', 'visitas')} · {analise.diasDeAtraso ?? 0} dias de atraso
                  </p>
                </div>
                <BotaoWhatsApp cliente={analise.cliente} mensagem={mensagemRetorno(analise.cliente)} somenteIcone />
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link to="/clientes">Ver todos os clientes</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function rotuloProximidade(item: ProximoAniversariante): string {
  if (item.diasAte === 0) return 'Hoje'
  if (item.diasAte === 1) return 'Amanhã'
  return `Em ${item.diasAte} dias`
}

export function ProximosAniversarios({ itens, carregando }: CardOperacionalProps<ProximoAniversariante>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake aria-hidden className="h-4 w-4 text-primary" /> Próximos aniversários
        </CardTitle>
        <CardDescription>Clientes ativos com aniversário mais próximo.</CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, indice) => <Skeleton key={indice} className="h-14 w-full" />)}
          </div>
        ) : itens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-5 text-sm text-muted-foreground">
            Cadastre datas de nascimento para receber lembretes aqui.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {itens.map((item) => (
              <li key={item.cliente.id} className="flex min-w-0 items-center gap-2.5 py-3 first:pt-0 last:pb-0">
                <ClienteAvatar nome={item.cliente.nome} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <Link to={`/clientes/${item.cliente.id}`} className="block truncate text-sm font-semibold hover:text-primary hover:underline">
                    {item.cliente.nome}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {rotuloProximidade(item)} · {formatarData(item.proximaData)}
                  </p>
                </div>
                {item.ehHoje ? <Badge>Hoje</Badge> : null}
                <BotaoWhatsApp
                  cliente={item.cliente}
                  mensagem={`Parabéns, ${item.cliente.nome.split(' ')[0]}! Muitas felicidades. Um abraço da André Garcia Barber Shop.`}
                  somenteIcone
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
