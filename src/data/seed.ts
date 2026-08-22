import { addDays, subDays } from 'date-fns'

import { dateParaDataISO } from '@/lib/format'
import type { Cliente, Servico, Visita, VisitaServico } from '@/types'

/**
 * Gera uma base de demonstração realista (clientes, serviços e ~14 meses de
 * atendimentos). Usa um PRNG com semente fixa para que os gráficos fiquem
 * estáveis entre recarregamentos.
 */

function criarRandom(semente: number) {
  let estado = semente
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296
    return estado / 4294967296
  }
}

const random = criarRandom(20240517)

function escolher<T>(itens: T[]): T {
  return itens[Math.floor(random() * itens.length)]
}

function inteiro(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

const NOMES = [
  'Rafael Almeida', 'Lucas Ferreira', 'Bruno Carvalho', 'Diego Nascimento', 'Gustavo Ribeiro',
  'Marcelo Andrade', 'Thiago Moreira', 'Felipe Barbosa', 'André Siqueira', 'Vinícius Rocha',
  'Rodrigo Teixeira', 'Eduardo Pacheco', 'Matheus Cardoso', 'Leandro Vasconcelos', 'Caio Monteiro',
  'Renato Dias', 'Fábio Guimarães', 'Otávio Bittencourt', 'Henrique Sampaio', 'Paulo Menezes',
  'Sérgio Fontes', 'Danilo Peixoto', 'Igor Cavalcanti', 'Murilo Antunes', 'Wesley Nogueira',
  'Alexandre Prado', 'Juliano Camargo', 'Márcio Bastos',
]

const OBSERVACOES_CLIENTE = [
  'Prefere máquina 2 nas laterais.',
  'Cliente antigo, sempre aos sábados.',
  'Alérgico a loção pós-barba com álcool.',
  'Gosta de acabamento reto na nuca.',
  'Indicado pelo Rafael.',
  null,
  null,
  null,
]

const OBSERVACOES_VISITA = [
  'Pediu degradê mais baixo.',
  'Cliente elogiou o acabamento.',
  'Fez pagamento no PIX.',
  'Trouxe o filho junto.',
  'Barba aparada mais curta que o habitual.',
  null,
  null,
  null,
  null,
]

const DDDS = ['11', '21', '31', '41', '48', '51', '62', '71', '81', '85']

function telefoneAleatorio(): string {
  const ddd = escolher(DDDS)
  const parte1 = String(inteiro(90000, 99999))
  const parte2 = String(inteiro(1000, 9999))
  return `(${ddd}) ${parte1}-${parte2}`
}

function nascimentoAleatorio(): string | null {
  if (random() < 0.25) return null
  const ano = inteiro(1972, 2005)
  const mes = inteiro(1, 12)
  const dia = inteiro(1, 28)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export interface BaseSimulada {
  clientes: Cliente[]
  servicos: Servico[]
  visitas: Visita[]
  visitaServicos: VisitaServico[]
}

export function gerarBaseSimulada(hoje = new Date()): BaseSimulada {
  const agora = hoje.toISOString()

  const servicosBase: Array<Omit<Servico, 'id' | 'created_at' | 'updated_at'>> = [
    {
      nome: 'Corte de cabelo',
      descricao: 'Corte na máquina e tesoura com acabamento.',
      preco: 45,
      duracao_estimada: 40,
      status: 'ativo',
    },
    {
      nome: 'Barba',
      descricao: 'Barba feita na navalha com toalha quente.',
      preco: 35,
      duracao_estimada: 30,
      status: 'ativo',
    },
    {
      nome: 'Corte e barba',
      descricao: 'Combo completo de corte e barba.',
      preco: 70,
      duracao_estimada: 65,
      status: 'ativo',
    },
    {
      nome: 'Acabamento',
      descricao: 'Retoque de pézinho e contornos entre os cortes.',
      preco: 20,
      duracao_estimada: 15,
      status: 'ativo',
    },
    {
      nome: 'Sobrancelha',
      descricao: 'Design de sobrancelha masculina na navalha.',
      preco: 15,
      duracao_estimada: 10,
      status: 'ativo',
    },
    {
      nome: 'Pigmentação',
      descricao: 'Pigmentação de barba (serviço suspenso).',
      preco: 60,
      duracao_estimada: 45,
      status: 'inativo',
    },
  ]

  const servicos: Servico[] = servicosBase.map((servico, indice) => ({
    ...servico,
    id: `srv-${indice + 1}`,
    created_at: subDays(hoje, 420).toISOString(),
    updated_at: agora,
  }))

  const clientes: Cliente[] = NOMES.map((nome, indice) => {
    const diasAtras = inteiro(20, 400)
    const criadoEm = subDays(hoje, diasAtras).toISOString()
    return {
      id: `cli-${indice + 1}`,
      nome,
      telefone: telefoneAleatorio(),
      data_nascimento: nascimentoAleatorio(),
      observacoes: escolher(OBSERVACOES_CLIENTE),
      status: indice % 13 === 12 ? 'inativo' : 'ativo',
      created_at: criadoEm,
      updated_at: criadoEm,
    }
  })

  const clientesAtivos = clientes.filter((cliente) => cliente.status === 'ativo')
  const servicosAtivos = servicos.filter((servico) => servico.status === 'ativo')

  const visitas: Visita[] = []
  const visitaServicos: VisitaServico[] = []

  // Combinações plausíveis de serviços por atendimento.
  const combinacoes: string[][] = [
    ['Corte de cabelo'],
    ['Corte de cabelo'],
    ['Corte de cabelo'],
    ['Barba'],
    ['Corte e barba'],
    ['Corte e barba'],
    ['Corte de cabelo', 'Barba'],
    ['Corte de cabelo', 'Sobrancelha'],
    ['Corte de cabelo', 'Barba', 'Sobrancelha'],
    ['Acabamento'],
    ['Acabamento', 'Sobrancelha'],
    ['Barba', 'Sobrancelha'],
  ]

  const inicio = subDays(hoje, 400)
  const totalDias = 400
  let sequencia = 0

  for (let offset = 0; offset <= totalDias; offset += 1) {
    const dia = addDays(inicio, offset)
    const diaSemana = dia.getDay()

    // Barbearia fechada aos domingos e movimento maior no fim de semana.
    if (diaSemana === 0) continue
    let atendimentosDoDia = inteiro(1, 4)
    if (diaSemana === 5) atendimentosDoDia += 2
    if (diaSemana === 6) atendimentosDoDia += 3
    if (diaSemana === 1) atendimentosDoDia = Math.max(1, atendimentosDoDia - 1)
    // Os últimos 60 dias têm movimento um pouco maior (crescimento).
    if (offset > totalDias - 60) atendimentosDoDia += 1

    const atendidosNoDia = new Set<string>()

    for (let i = 0; i < atendimentosDoDia; i += 1) {
      const cliente = escolher(clientesAtivos)
      // Um mesmo cliente não é atendido duas vezes no mesmo dia.
      if (atendidosNoDia.has(cliente.id)) continue
      // A visita só existe depois do cadastro do cliente.
      if (new Date(cliente.created_at) > dia) continue
      atendidosNoDia.add(cliente.id)

      sequencia += 1
      const visitaId = `vis-${sequencia}`
      const dataAtendimento = dateParaDataISO(dia)
      const registradoEm = dia.toISOString()

      visitas.push({
        id: visitaId,
        cliente_id: cliente.id,
        data_atendimento: dataAtendimento,
        observacoes: escolher(OBSERVACOES_VISITA),
        created_at: registradoEm,
        updated_at: registradoEm,
      })

      const nomesServicos = escolher(combinacoes)
      nomesServicos.forEach((nomeServico, indice) => {
        const servico = servicosAtivos.find((item) => item.nome === nomeServico)
        if (!servico) return
        visitaServicos.push({
          id: `vs-${sequencia}-${indice + 1}`,
          visita_id: visitaId,
          servico_id: servico.id,
          preco_cobrado: servico.preco,
        })
      })
    }
  }

  return { clientes, servicos, visitas, visitaServicos }
}
