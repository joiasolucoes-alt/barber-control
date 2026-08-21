import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BarberDataProvider } from '@/hooks/use-barber-data'
import { TemaProvider } from '@/hooks/use-theme'
import { ClienteDetalhePage } from '@/pages/cliente-detalhe'
import { ClientesPage } from '@/pages/clientes'
import { DashboardPage } from '@/pages/dashboard'
import { NaoEncontradoPage } from '@/pages/nao-encontrado'
import { ServicosPage } from '@/pages/servicos'
import { VisitasPage } from '@/pages/visitas'

export default function App() {
  return (
    <TemaProvider>
      <BarberDataProvider>
        <TooltipProvider delayDuration={200}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="clientes/:id" element={<ClienteDetalhePage />} />
              <Route path="visitas" element={<VisitasPage />} />
              <Route path="servicos" element={<ServicosPage />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NaoEncontradoPage />} />
            </Route>
          </Routes>
          <Toaster />
        </TooltipProvider>
      </BarberDataProvider>
    </TemaProvider>
  )
}
