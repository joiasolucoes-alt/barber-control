import type { Cliente, Servico, VisitaDetalhada } from '@/types'

interface DadosBackup {
  fonte: string
  clientes: Cliente[]
  servicos: Servico[]
  visitas: VisitaDetalhada[]
}

/** Gera um arquivo portátil sem depender da implementação do repositório. */
export function baixarBackup({ fonte, clientes, servicos, visitas }: DadosBackup) {
  const geradoEm = new Date()
  const backup = {
    formato: 'barber-control-backup',
    versao: 1,
    gerado_em: geradoEm.toISOString(),
    origem: fonte,
    clientes,
    servicos,
    visitas: visitas.map((visita) => ({
      id: visita.id,
      cliente_id: visita.cliente_id,
      data_atendimento: visita.data_atendimento,
      observacoes: visita.observacoes,
      created_at: visita.created_at,
      updated_at: visita.updated_at,
      servicos: visita.servicos.map((servico) => ({
        id: servico.id,
        nome: servico.nome,
        preco_cobrado: servico.preco_cobrado,
      })),
    })),
  }
  const arquivo = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = `barber-control-backup-${geradoEm.toISOString().slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(endereco), 1_000)
  return { clientes: clientes.length, servicos: servicos.length, visitas: visitas.length }
}
