import { describe, expect, it } from 'vitest'

import { LocalRepository } from '@/data/local-repository'

describe('exclusão segura de cadastros', () => {
  it('exclui um cliente sem atendimentos', async () => {
    const repository = new LocalRepository()
    const cliente = await repository.criarCliente({ nome: 'Cliente temporário' })

    await repository.excluirCliente(cliente.id)

    await expect(repository.listarClientes()).resolves.not.toContainEqual(expect.objectContaining({ id: cliente.id }))
  })

  it('preserva cliente que possui histórico', async () => {
    const repository = new LocalRepository()
    const cliente = await repository.criarCliente({ nome: 'Cliente com histórico' })
    const servico = await repository.criarServico({ nome: 'Serviço utilizado' })
    await repository.criarVisita({
      cliente_id: cliente.id,
      data_atendimento: '2025-01-01',
      servico_ids: [servico.id],
    })

    await expect(repository.excluirCliente(cliente.id)).rejects.toThrow('possui atendimentos')
  })

  it('exclui um serviço nunca utilizado', async () => {
    const repository = new LocalRepository()
    const servico = await repository.criarServico({ nome: 'Serviço temporário' })

    await repository.excluirServico(servico.id)

    await expect(repository.listarServicos()).resolves.not.toContainEqual(expect.objectContaining({ id: servico.id }))
  })

  it('preserva serviço que aparece no histórico', async () => {
    const repository = new LocalRepository()
    const cliente = await repository.criarCliente({ nome: 'Outro cliente com histórico' })
    const servico = await repository.criarServico({ nome: 'Outro serviço utilizado' })
    await repository.criarVisita({
      cliente_id: cliente.id,
      data_atendimento: '2025-01-01',
      servico_ids: [servico.id],
    })

    await expect(repository.excluirServico(servico.id)).rejects.toThrow('possui atendimentos')
  })

  it('mantém o preço cobrado mesmo após reajustar o serviço', async () => {
    const repository = new LocalRepository()
    const cliente = await repository.criarCliente({ nome: 'Cliente do histórico' })
    const servico = await repository.criarServico({ nome: 'Corte histórico', preco: 50 })
    const visita = await repository.criarVisita({
      cliente_id: cliente.id,
      data_atendimento: '2025-01-01',
      servico_ids: [servico.id],
    })

    await repository.atualizarServico(servico.id, { nome: servico.nome, preco: 80 })
    const atualizada = await repository.atualizarVisita(visita.id, {
      cliente_id: cliente.id,
      data_atendimento: visita.data_atendimento,
      servico_ids: [servico.id],
      observacoes: 'Preço original preservado',
    })

    expect(atualizada.servicos[0].preco).toBe(80)
    expect(atualizada.servicos[0].preco_cobrado).toBe(50)
  })

  it('salva e atualiza o valor realmente cobrado na visita', async () => {
    const repository = new LocalRepository()
    const cliente = await repository.criarCliente({ nome: 'Cliente com desconto' })
    const servico = await repository.criarServico({ nome: 'Corte promocional', preco: 50 })
    const visita = await repository.criarVisita({
      cliente_id: cliente.id,
      data_atendimento: '2025-01-01',
      servico_ids: [servico.id],
      precos_cobrados: { [servico.id]: 42.5 },
    })

    expect(visita.servicos[0].preco_cobrado).toBe(42.5)

    const atualizada = await repository.atualizarVisita(visita.id, {
      cliente_id: cliente.id,
      data_atendimento: visita.data_atendimento,
      servico_ids: [servico.id],
      precos_cobrados: { [servico.id]: 45 },
    })

    expect(atualizada.servicos[0].preco_cobrado).toBe(45)
  })
})
