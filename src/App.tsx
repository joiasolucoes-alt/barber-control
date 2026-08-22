import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BarberDataProvider } from '@/hooks/use-barber-data'
import { TemaProvider } from '@/hooks/use-theme'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardPage = React.lazy(() =>
  import('@/pages/dashboard').then((modulo) => ({ default: modulo.DashboardPage })),
)
const ClientesPage = React.lazy(() =>
  import('@/pages/clientes').then((modulo) => ({ default: modulo.ClientesPage })),
)
const ClienteDetalhePage = React.lazy(() =>
  import('@/pages/cliente-detalhe').then((modulo) => ({ default: modulo.ClienteDetalhePage })),
)
const VisitasPage = React.lazy(() =>
  import('@/pages/visitas').then((modulo) => ({ default: modulo.VisitasPage })),
)
const ServicosPage = React.lazy(() =>
  import('@/pages/servicos').then((modulo) => ({ default: modulo.ServicosPage })),
)
const NaoEncontradoPage = React.lazy(() =>
  import('@/pages/nao-encontrado').then((modulo) => ({ default: modulo.NaoEncontradoPage })),
)

function CarregandoPagina() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando página">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-28 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

export default function App() {
  return (
    <TemaProvider>
      <BarberDataProvider>
        <TooltipProvider delayDuration={200}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<React.Suspense fallback={<CarregandoPagina />}><DashboardPage /></React.Suspense>} />
              <Route path="clientes" element={<React.Suspense fallback={<CarregandoPagina />}><ClientesPage /></React.Suspense>} />
              <Route path="clientes/:id" element={<React.Suspense fallback={<CarregandoPagina />}><ClienteDetalhePage /></React.Suspense>} />
              <Route path="visitas" element={<React.Suspense fallback={<CarregandoPagina />}><VisitasPage /></React.Suspense>} />
              <Route path="servicos" element={<React.Suspense fallback={<CarregandoPagina />}><ServicosPage /></React.Suspense>} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="*" element={<React.Suspense fallback={<CarregandoPagina />}><NaoEncontradoPage /></React.Suspense>} />
            </Route>
          </Routes>
          <Toaster />
        </TooltipProvider>
      </BarberDataProvider>
    </TemaProvider>
  )
}
