import { describe, expect, it } from 'vitest'

import {
  analisarCliente,
  clientesParaRecuperar,
  INTERVALO_PADRAO_DIAS,
  type AnaliseCliente,
} from '@/lib/clientes-analise'
import { resumirAgendaDia, resumirAgendaMes } from '@/lib/agenda'
import { dataISOValida } from '@/lib/format'
import {
  calcularTaxasRetorno,
  compararIndicadores,
  serieNovosClientesPorMes,
  type Indicadores,
} from '@/lib/metrics'
import { clienteSchema, visitaSchema } from '@/lib/validators'
import type { Cliente, ServicoRealizado, VisitaDetalhada } from '@/types'

const timestamp = '2026-01-01T12:00:00.000Z'

function cliente(id = 'cliente-1'): Cliente {
  return {
    id,
    nome: `Cliente ${id}`,
    telefone: null,
    data_nascimento: null,
    observacoes: null,
    status: 'ativo',
    created_at: timestamp,
    updated_at: timestamp,
  }
}

const corte: ServicoRealizado = {
  id: 'servico-1',
  nome: 'Corte',
  descricao: null,
  preco: 50,
  duracao_estimada: 40,
  status: 'ativo',
  created_at: timestamp,
  updated_at: timestamp,
  preco_cobrado: 50,
}

function visita(clienteRegistro: Cliente, data: string, id = data): VisitaDetalhada {
  return {
    id,
    cliente_id: clienteRegistro.id,
    data_atendimento: data,
    observacoes: null,
    created_at: `${data}T12:00:00.000Z`,
    updated_at: `${data}T12:00:00.000Z`,
    cliente: clienteRegistro,
    servicos: [corte],
  }
}

describe('datas e formulários', () => {
  it('rejeita datas inexistentes e aceita ano bissexto', () => {
    expect(dataISOValida('2024-02-29')).toBe(true)
    expect(dataISOValida('2025-02-29')).toBe(false)
    expect(dataISOValida('2026-13-01')).toBe(false)
  })

  it('mantém telefone opcional e rejeita números incompletos', () => {
    const base = { nome: 'Rafael Almeida', data_nascimento: '', observacoes: '', status: 'ativo' as const }
    expect(clienteSchema.safeParse({ ...base, telefone: '' }).success).toBe(true)
    expect(clienteSchema.safeParse({ ...base, telefone: '(11) 9999-000' }).success).toBe(false)
  })

  it('rejeita visita futura e exige pelo menos um serviço', () => {
    expect(
      visitaSchema.safeParse({
        cliente_id: 'cliente-1',
        data_atendimento: '2099-01-01',
        servico_ids: ['servico-1'],
        observacoes: '',
      }).success,
    ).toBe(false)
    expect(
      visitaSchema.safeParse({
        cliente_id: 'cliente-1',
        data_atendimento: '2026-01-01',
        servico_ids: [],
        observacoes: '',
      }).success,
    ).toBe(false)
  })
})

describe('retenção de clientes', () => {
  it('calcula ritmo, previsão, situação e gasto pelo histórico', () => {
    const registro = cliente()
    const analise = analisarCliente(
      registro,
      [visita(registro, '2026-01-01'), visita(registro, '2026-01-31'), visita(registro, '2026-03-02')],
      new Date(2026, 3, 21),
    )

    expect(analise.intervaloMedioDias).toBe(30)
    expect(analise.previsaoRetorno).toBe('2026-04-01')
    expect(analise.diasDeAtraso).toBe(20)
    expect(analise.situacao).toBe('em-risco')
    expect(analise.totalGasto).toBe(150)
  })

  it('usa 45 dias como referência enquanto só existe uma visita', () => {
    const registro = cliente()
    const analise = analisarCliente(
      registro,
      [visita(registro, '2026-08-01')],
      new Date(2026, 7, 20),
    )

    expect(analise.intervaloMedioDias).toBeNull()
    expect(analise.intervaloReferenciaDias).toBe(INTERVALO_PADRAO_DIAS)
    expect(analise.situacao).toBe('novo')
  })

  it('prioriza na recuperação quem tem mais visitas', () => {
    const base = analisarCliente(cliente(), [], new Date(2026, 7, 20))
    const analises = [
      { ...base, totalVisitas: 2, situacao: 'perdido' as const, diasDeAtraso: 100 },
      { ...base, cliente: cliente('cliente-2'), totalVisitas: 8, situacao: 'em-risco' as const, diasDeAtraso: 10 },
    ] satisfies AnaliseCliente[]

    expect(clientesParaRecuperar(analises)[0].cliente.id).toBe('cliente-2')
  })
})

describe('indicadores do dashboard', () => {
  it('calcula retorno por coorte sem contar visita no mesmo dia', () => {
    const a = cliente('a')
    const b = cliente('b')
    const taxas = calcularTaxasRetorno(
      [
        visita(a, '2026-01-01', 'a-1'),
        visita(a, '2026-01-15', 'a-2'),
        visita(b, '2026-01-01', 'b-1'),
        visita(b, '2026-01-01', 'b-2'),
      ],
      new Date(2026, 3, 1),
    )

    expect(taxas.map((taxa) => taxa.elegiveis)).toEqual([2, 2, 2])
    expect(taxas.map((taxa) => taxa.retornaram)).toEqual([1, 1, 1])
    expect(taxas.map((taxa) => taxa.percentual)).toEqual([50, 50, 50])
  })

  it('conta cada cliente novo apenas no mês da primeira visita', () => {
    const a = cliente('a')
    const b = cliente('b')
    const serie = serieNovosClientesPorMes(
      [
        visita(a, '2026-01-10', 'a-1'),
        visita(a, '2026-02-10', 'a-2'),
        visita(b, '2026-02-20', 'b-1'),
      ],
      new Date(2026, 1, 28),
      2,
    )

    expect(serie.map(({ mes, total }) => [mes, total])).toEqual([
      ['2026-01', 1],
      ['2026-02', 1],
    ])
  })

  it('não inventa percentual quando o período anterior era zero', () => {
    const base: Indicadores = {
      totalClientes: 0,
      clientesAtivos: 0,
      atendidosHoje: 0,
      visitasNoPeriodo: 0,
      clientesUnicosNoPeriodo: 0,
      servicosRealizados: 0,
      ticketMedio: 0,
      faturamentoEstimado: 0,
    }
    const comparativo = compararIndicadores(
      { ...base, visitasNoPeriodo: 3 },
      base,
    )

    expect(comparativo?.visitasNoPeriodo.percentual).toBeNull()
    expect(comparativo?.clientesUnicosNoPeriodo.percentual).toBe(0)
  })
})

describe('agenda de atendimentos', () => {
  it('separa clientes únicos da quantidade de visitas e soma os preços históricos', () => {
    const a = cliente('a')
    const b = cliente('b')
    const visitas = [
      visita(a, '2026-08-10', 'a-1'),
      visita(a, '2026-08-10', 'a-2'),
      visita(b, '2026-08-10', 'b-1'),
    ]
    visitas[1].servicos[0] = { ...corte, preco: 90, preco_cobrado: 55 }

    const dia = resumirAgendaDia(visitas, '2026-08-10')

    expect(dia.clientes).toBe(2)
    expect(dia.atendimentos).toBe(3)
    expect(dia.receita).toBe(155)
  })

  it('consolida apenas as visitas do mês selecionado', () => {
    const registro = cliente()
    const agosto = resumirAgendaMes(
      [visita(registro, '2026-07-31'), visita(registro, '2026-08-01'), visita(registro, '2026-08-31')],
      new Date(2026, 7, 15),
    )

    expect(agosto.atendimentos).toBe(2)
    expect(agosto.receita).toBe(100)
    expect(agosto.dias.size).toBe(2)
  })
})
