import { CalendarDays, CalendarRange, LayoutDashboard, Scissors, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ItemNavegacao {
  rotulo: string
  para: string
  icone: LucideIcon
  /** Rota exata (usado no dashboard, que é a raiz). */
  exato?: boolean
  descricao: string
}

export const NAVEGACAO: ItemNavegacao[] = [
  {
    rotulo: 'Dashboard',
    para: '/',
    icone: LayoutDashboard,
    exato: true,
    descricao: 'Indicadores e gráficos dos atendimentos',
  },
  { rotulo: 'Agenda', para: '/agenda', icone: CalendarDays, descricao: 'Calendário dos atendimentos realizados' },
  { rotulo: 'Clientes', para: '/clientes', icone: Users, descricao: 'Cadastro e histórico dos clientes' },
  { rotulo: 'Visitas', para: '/visitas', icone: CalendarRange, descricao: 'Atendimentos já realizados' },
  { rotulo: 'Serviços', para: '/servicos', icone: Scissors, descricao: 'Serviços oferecidos pela barbearia' },
]
