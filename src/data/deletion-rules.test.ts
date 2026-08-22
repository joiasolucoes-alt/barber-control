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
    const [visita] = await repository.listarVisitas()

    await expect(repository.excluirCliente(visita.cliente_id)).rejects.toThrow('possui atendimentos')
  })

  it('exclui um serviço nunca utilizado', async () => {
    const repository = new LocalRepository()
    const servico = await repository.criarServico({ nome: 'Serviço temporário' })

    await repository.excluirServico(servico.id)

    await expect(repository.listarServicos()).resolves.not.toContainEqual(expect.objectContaining({ id: servico.id }))
  })

  it('preserva serviço que aparece no histórico', async () => {
    const repository = new LocalRepository()
    const [visita] = await repository.listarVisitas()
    const [servico] = visita.servicos

    await expect(repository.excluirServico(servico.id)).rejects.toThrow('possui atendimentos')
  })
})
