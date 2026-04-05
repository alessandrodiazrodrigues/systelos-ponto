import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Pages
import LoginPage        from './pages/LoginPage'
import MarcarPontoPage  from './pages/MarcarPontoPage'
import EspelhoPage      from './pages/EspelhoPage'
import BancoHorasPage   from './pages/BancoHorasPage'
import FeriasPage       from './pages/FeriasPage'

// Layout
import AppLayout from './components/AppLayout'

// ============================================================================
// Proteção de rota — redireciona para login se não autenticado
// ============================================================================
function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[--color-primary]">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm opacity-70">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ============================================================================
// App principal
// ============================================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login — pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas — dentro do AppLayout (menu inferior) */}
        <Route path="/" element={
          <RotaProtegida>
            <AppLayout />
          </RotaProtegida>
        }>
          <Route index element={<Navigate to="/ponto" replace />} />
          <Route path="ponto"      element={<MarcarPontoPage />} />
          <Route path="espelho"    element={<EspelhoPage />} />
          <Route path="banco-horas" element={<BancoHorasPage />} />
          <Route path="ferias"     element={<FeriasPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/ponto" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
