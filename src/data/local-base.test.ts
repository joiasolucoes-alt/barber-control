import { describe, expect, it } from 'vitest'

import { criarBaseLocalVazia, removerDadosDemonstracao, type BaseLocal } from '@/data/local-base'

describe('base local vazia e migração dos dados fictícios', () => {
  it('inicia sem clientes, serviços ou visitas', () => {
    expect(criarBaseLocalVazia()).toEqual({
      clientes: [],
      servicos: [],
      visitas: [],
      visitaServicos: [],
    })
  })

  it('remove a demonstração antiga e preserva cadastros reais', () => {
    const timestamp = '2026-08-26T12:00:00.000Z'
    const base: BaseLocal = {
      clientes: [
        {
          id: 'cli-1',
          nome: 'Cliente fictício',
          telefone: null,
          data_nascimento: null,
          observacoes: null,
          status: 'ativo',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'a6cc4f34-13e0-4aa9-9d33-37052536afbd',
          nome: 'Cliente real',
          telefone: null,
          data_nascimento: null,
          observacoes: null,
          status: 'ativo',
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
      servicos: [
        {
          id: 'srv-1',
          nome: 'Serviço fictício',
          descricao: null,
          preco: 45,
          duracao_estimada: 40,
          status: 'ativo',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: '817c5f7b-a5bb-4e75-8197-96d98f9e6066',
          nome: 'Serviço real',
          descricao: null,
          preco: 50,
          duracao_estimada: 30,
          status: 'ativo',
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
      visitas: [
        {
          id: 'vis-1',
          cliente_id: 'cli-1',
          data_atendimento: '2026-08-26',
          observacoes: null,
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: '2f73acb1-bd87-4518-8cab-e4c7431d7140',
          cliente_id: 'a6cc4f34-13e0-4aa9-9d33-37052536afbd',
          data_atendimento: '2026-08-26',
          observacoes: null,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
      visitaServicos: [
        {
          id: 'vs-1-1',
          visita_id: 'vis-1',
          servico_id: 'srv-1',
          preco_cobrado: 45,
        },
        {
          id: '93e6cc3d-6496-43ef-86a8-925aac195cea',
          visita_id: '2f73acb1-bd87-4518-8cab-e4c7431d7140',
          servico_id: '817c5f7b-a5bb-4e75-8197-96d98f9e6066',
          preco_cobrado: 50,
        },
      ],
    }

    const resultado = removerDadosDemonstracao(base)

    expect(resultado.clientes.map((cliente) => cliente.nome)).toEqual(['Cliente real'])
    expect(resultado.servicos.map((servico) => servico.nome)).toEqual(['Serviço real'])
    expect(resultado.visitas).toHaveLength(1)
    expect(resultado.visitaServicos).toHaveLength(1)
  })
})
