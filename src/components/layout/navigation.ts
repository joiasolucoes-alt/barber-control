import { CalendarDays, LayoutDashboard, Scissors, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ItemNavegacao {
  rotulo: string
  para: string
  icone: LucideIcon
  /** Rota exata (usado no dashboard, que é a raiz). */
  exato?: boolean
  descricao: string
}

export const NAVEGACAO_PRINCIPAL: ItemNavegacao[] = [
  {
    rotulo: 'Dashboard',
    para: '/',
    icone: LayoutDashboard,
    exato: true,
    descricao: 'Indicadores e gráficos dos atendimentos',
  },
  { rotulo: 'Agenda', para: '/agenda', icone: CalendarDays, descricao: 'Calendário e histórico dos atendimentos' },
  { rotulo: 'Clientes', para: '/clientes', icone: Users, descricao: 'Cadastro e histórico dos clientes' },
]

export const NAVEGACAO_ADMINISTRATIVA: ItemNavegacao[] = [
  { rotulo: 'Serviços', para: '/servicos', icone: Scissors, descricao: 'Serviços oferecidos pela barbearia' },
]

export const NAVEGACAO: ItemNavegacao[] = [...NAVEGACAO_PRINCIPAL, ...NAVEGACAO_ADMINISTRATIVA]
