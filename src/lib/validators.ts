import { z } from 'zod'

import { apenasDigitos, dataISOValida, dateParaDataISO } from '@/lib/format'

const dataOpcional = z
  .string()
  .trim()
  .optional()
  .refine((valor) => !valor || dataISOValida(valor), { message: 'Data inválida.' })
  .refine((valor) => !valor || valor <= dateParaDataISO(new Date()), {
    message: 'A data de nascimento não pode estar no futuro.',
  })

export const clienteSchema = z.object({
  nome: z
    .string({ required_error: 'Informe o nome completo.' })
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  telefone: z
    .string()
    .trim()
    .optional()
    .refine((valor) => !valor || [10, 11].includes(apenasDigitos(valor).length), {
      message: 'Telefone incompleto. Use DDD + número.',
    }),
  data_nascimento: dataOpcional,
  observacoes: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
  status: z.enum(['ativo', 'inativo']),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>

/** Converte texto do formulário ("45,00") em número, ou null quando vazio. */
export function paraNumero(valor: string | undefined | null): number | null {
  if (valor === undefined || valor === null || valor.trim() === '') return null
  const numero = Number(valor.replace(',', '.'))
  return Number.isFinite(numero) ? numero : null
}

const numeroTextoOpcional = (mensagem: string, opcoes?: { inteiro?: boolean; maximo?: number }) =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (valor) => {
        if (!valor) return true
        const numero = Number(valor.replace(',', '.'))
        return (
          Number.isFinite(numero) &&
          numero >= 0 &&
          (!opcoes?.inteiro || Number.isInteger(numero)) &&
          (opcoes?.maximo === undefined || numero <= opcoes.maximo)
        )
      },
      { message: mensagem },
    )

export const servicoSchema = z.object({
  nome: z
    .string({ required_error: 'Informe o nome do serviço.' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),
  descricao: z.string().trim().max(300, 'Máximo de 300 caracteres.').optional(),
  preco: numeroTextoOpcional('Informe um preço entre 0 e 999.999,99.', { maximo: 999999.99 }),
  duracao_estimada: numeroTextoOpcional('Informe minutos inteiros entre 0 e 1.440.', {
    inteiro: true,
    maximo: 1440,
  }),
  status: z.enum(['ativo', 'inativo']),
})

export type ServicoFormValues = z.infer<typeof servicoSchema>

export const visitaSchema = z.object({
  cliente_id: z.string({ required_error: 'Selecione o cliente.' }).min(1, 'Selecione o cliente.'),
  data_atendimento: z
    .string({ required_error: 'Informe a data do atendimento.' })
    .min(1, 'Informe a data do atendimento.')
    .refine(dataISOValida, { message: 'Data inválida.' })
    .refine((valor) => valor <= dateParaDataISO(new Date()), {
      message: 'A visita registra um atendimento que já aconteceu.',
    }),
  servico_ids: z.array(z.string()).min(1, 'Selecione pelo menos um serviço.'),
  observacoes: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
})

export type VisitaFormValues = z.infer<typeof visitaSchema>
