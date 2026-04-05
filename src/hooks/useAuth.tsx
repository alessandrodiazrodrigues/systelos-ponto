import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

// ============================================================================
// TIPOS
// ============================================================================

export interface Usuario {
  id:            string
  nome:          string
  email:         string
  empresa_id:    string
  funcionario_id?: string
  nivel:         string
  avatar_url?:   string
}

interface AuthContextType {
  usuario:     Usuario | null
  autenticado: boolean
  carregando:  boolean
  login:       (token: string, usuario: Usuario) => void
  logout:      () => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'systelos_ponto_token'
const USER_KEY  = 'systelos_ponto_usuario'

// Base URL da API — mesma do TUR
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

axios.defaults.baseURL = API_BASE

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario]       = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Verifica token salvo (cookie ou localStorage)
    const token    = localStorage.getItem(TOKEN_KEY)
    const userData = localStorage.getItem(USER_KEY)

    if (token && userData) {
      try {
        const user = JSON.parse(userData) as Usuario
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUsuario(user)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }

    // Verifica se veio do TUR com token na URL (one-time token)
    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get('token')
    if (tokenUrl) {
      validarTokenUrl(tokenUrl)
    } else {
      setCarregando(false)
    }
  }, [])

  async function validarTokenUrl(token: string) {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const { data } = await axios.get('/api/auth/me')
      const user = data.data as Usuario
      login(token, user)
      // Remove token da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname)
    } catch {
      console.warn('Token URL inválido')
    } finally {
      setCarregando(false)
    }
  }

  function login(token: string, user: Usuario) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUsuario(user)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete axios.defaults.headers.common['Authorization']
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      autenticado: !!usuario,
      carregando,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
