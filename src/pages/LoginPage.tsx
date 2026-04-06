// ============================================================================
// SYSTELOS PONTO — Login Page
// ============================================================================

import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/ui/Logo'

interface GoogleCredentialResponse { credential: string }

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void; use_fedcm_for_prompt?: boolean }) => void
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; width?: number; text?: string; shape?: string; logo_alignment?: string }) => void
        }
      }
    }
  }
}

function Alert({ variant, children, onClose }: { variant: 'error' | 'success'; children: React.ReactNode; onClose?: () => void }) {
  const styles = { error: 'bg-red-50 border-red-200 text-red-700', success: 'bg-green-50 border-green-200 text-green-700' }
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${styles[variant]}`}>
      <span className="flex-1 text-sm">{children}</span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>}
    </div>
  )
}

export default function LoginPage() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState<string | null>(null)
  const [googleReady, setGoogleReady]   = useState(false)

  const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? ''
  const API_URL          = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !GOOGLE_CLIENT_ID) return
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleResponse, use_fedcm_for_prompt: false })
      const container = document.getElementById('googleButtonContainer')
      if (container) {
        window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 340, text: 'signin_with', shape: 'rectangular', logo_alignment: 'left' })
      }
      setGoogleReady(true)
    }
    if (window.google) { initGoogle() } else {
      const check = setInterval(() => { if (window.google) { clearInterval(check); initGoogle() } }, 100)
      setTimeout(() => clearInterval(check), 5000)
    }
  }, [GOOGLE_CLIENT_ID])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setIsLoading(true)
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, senha })
      if (data.success) { setSuccess('Login realizado com sucesso!'); login(data.token, data.usuario); setTimeout(() => navigate('/ponto'), 800) }
      else { setError(data.error ?? 'Credenciais inválidas') }
    } catch (err: any) { setError(err.response?.data?.error ?? 'Erro ao conectar com o servidor') }
    finally { setIsLoading(false) }
  }

  const handleGoogleResponse = async (response: GoogleCredentialResponse) => {
    setIsLoading(true); setError(null)
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/google`, { credential: response.credential })
      if (data.success) { setSuccess('Login realizado com sucesso!'); login(data.token, data.usuario); setTimeout(() => navigate('/ponto'), 800) }
      else { setError(data.error ?? 'Erro ao fazer login com Google') }
    } catch (err: any) { setError(err.response?.data?.error ?? 'Erro ao conectar com o servidor') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg, #0F1B3D 0%, #1a2d5a 50%, #0F1B3D 100%)' }}>
      <script src="https://accounts.google.com/gsi/client" async />
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl p-10" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

          {/* Logo real do SYSTELOS */}
          <Logo size="lg" className="mb-8" />

          {error   && <Alert variant="error"   onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div id="googleButtonContainer" className="flex justify-center mb-6 min-h-[44px]" />
          {!googleReady && <div className="flex justify-center mb-6"><span className="text-gray-400 text-sm">Carregando Google Sign-In...</span></div>}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-500 text-sm">ou entre com e-mail</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B84B] focus:ring-2 focus:ring-[#E8B84B]/20 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B84B] focus:ring-2 focus:ring-[#E8B84B]/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #0F1B3D, #1a2d5a)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="text-center mt-5">
            <a href="https://tur.systelos.com.br/recuperar-senha" className="block text-sm font-medium transition-colors" style={{ color: '#0F1B3D' }}>
              Esqueci minha senha
            </a>
          </div>
        </div>
        <p className="text-center text-white/50 text-sm mt-6">© 2025 SYSTELOS · Sistemas com propósito</p>
      </div>
    </div>
  )
}
