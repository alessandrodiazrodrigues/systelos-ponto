import { Outlet, NavLink } from 'react-router-dom'
import { Clock, Calendar, TrendingUp, Umbrella, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/ponto',       label: 'Ponto',       Icon: Clock },
  { to: '/espelho',     label: 'Espelho',      Icon: Calendar },
  { to: '/banco-horas', label: 'Banco',        Icon: TrendingUp },
  { to: '/ferias',      label: 'Férias',       Icon: Umbrella },
]

export default function AppLayout() {
  const { usuario, logout } = useAuth()

  return (
    <div className="min-h-dvh flex flex-col bg-[--color-bg]">

      {/* Header */}
      <header className="bg-[--color-primary] text-white px-4 py-3 safe-top flex items-center justify-between">
        <div>
          <p className="text-xs opacity-60 leading-none">SYSTELOS EQUIPE</p>
          <p className="font-semibold text-sm leading-tight mt-0.5">
            {usuario?.nome?.split(' ')[0] ?? 'Funcionário'}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Conteúdo da página */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Navegação inferior — estilo app mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom">
        <div className="flex">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  isActive
                    ? 'text-[--color-primary] font-semibold'
                    : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  )
}
