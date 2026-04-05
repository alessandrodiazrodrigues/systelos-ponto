// ============================================================================
// SYSTELOS PONTO — Login Page
// ============================================================================
// Visual idêntico ao TUR. Pronto para Microsoft (TODO SYS-178).
// ============================================================================

import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'

// ============================================================================
// TIPOS — Google SDK
// ============================================================================

interface GoogleCredentialResponse {
  credential: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            use_fedcm_for_prompt?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string
              size?: string
              width?: number
              text?: string
              shape?: string
              logo_alignment?: string
            }
          ) => void
        }
      }
    }
  }
}

// ============================================================================
// LOGO — SYSTELOS PONTO
// ============================================================================

function Logo() {
  return (
    <div className="flex flex-col items-center mb-8">
      {/* Ícone [S] — mesmo do TUR */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-3"
        style={{ background: 'linear-gradient(135deg, #E8B84B 0%, #c9a03a 100%)' }}
      >
        [S]
      </div>
      <h1 className="text-xl font-bold" style={{ color: '#0F1B3D' }}>
        SYSTELOS PONTO
      </h1>
      <p className="text-gray-400 text-sm mt-0.5">Portal do funcionário</p>
    </div>
  )
}

// ============================================================================
// INPUT — mesmo estilo do TUR
// ============================================================================

function Input({
  label, type = 'text', placeholder, value, onChange, required, autoComplete,
}: {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B84B] focus:ring-2 focus:ring-[#E8B84B]/20 transition-all duration-200"
      />
    </div>
  )
}

// ============================================================================
// ALERTA
// ============================================================================

function Alert({ variant, children, onClose }: {
  variant: 'error' | 'success'
  children: React.ReactNode
  onClose?: () => void
}) {
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
  }
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${styles[variant]}`}>
      <span className="flex-1 text-sm">{children}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
      )}
    </div>
  )
}

// ============================================================================
// LOGIN PAGE
// ============================================================================

export default function LoginPage() {
  const navigate    = useNavigate()
  const { login }   = useAuth()

  const [email, setEmail]             = useState('')
  const [senha, setSenha]             = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState<string | null>(null)
  const [googleReady, setGoogleReady] = useState(false)

  const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? ''
  const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

  // ============================================================
  // Inicializar Google Sign-In — mesmo fluxo do TUR
  // ============================================================
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !GOOGLE_CLIENT_ID) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback:  handleGoogleResponse,
        use_fedcm_for_prompt: false,
      })

      const container = document.getElementById('googleButtonContainer')
      if (container) {
        window.google.accounts.id.renderButton(container, {
          theme:         'outline',
          size:          'large',
          width:         340,
          text:          'signin_with',
          shape:         'rectangular',
          logo_alignment: 'left',
        })
      }
      setGoogleReady(true)
    }

    if (window.google) {
      initGoogle()
    } else {
      const check = setInterval(() => {
        if (window.google) { clearInterval(check); initGoogle() }
      }, 100)
      setTimeout(() => clearInterval(check), 5000)
    }
  }, [GOOGLE_CLIENT_ID])

  // ============================================================
  // Login com email + senha
  // ============================================================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, senha })

      if (data.success) {
        setSuccess('Login realizado com sucesso!')
        login(data.token, data.usuario)
        setTimeout(() => navigate('/ponto'), 800)
      } else {
        setError(data.error ?? 'Credenciais inválidas')
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // Callback do Google
  // ============================================================
  const handleGoogleResponse = async (response: GoogleCredentialResponse) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/google`, {
        credential: response.credential,
      })

      if (data.success) {
        setSuccess('Login realizado com sucesso!')
        login(data.token, data.usuario)
        setTimeout(() => navigate('/ponto'), 800)
      } else {
        setError(data.error ?? 'Erro ao fazer login com Google')
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // TODO SYS-178: Microsoft login — preparado mas não ativado
  // ============================================================
  // const handleMicrosoftLogin = async () => { ... }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div
      className="min-h-dvh flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg, #0F1B3D 0%, #1a2d5a 50%, #0F1B3D 100%)' }}
    >
      {/* Google SDK */}
      <script src="https://accounts.google.com/gsi/client" async />

      <div className="w-full max-w-[420px]">
        <div
          className="bg-white rounded-2xl p-10"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <Logo />

          {error   && <Alert variant="error"   onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Botão Google (renderizado pelo SDK) */}
          <div id="googleButtonContainer" className="flex justify-center mb-6 min-h-[44px]" />

          {!googleReady && (
            <div className="flex justify-center mb-6">
              <span className="text-gray-400 text-sm">Carregando Google Sign-In...</span>
            </div>
          )}

          {/* Divisor */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-500 text-sm">ou entre com e-mail</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Formulário email + senha */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            {/* Senha com toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B84B] focus:ring-2 focus:ring-[#E8B84B]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: '#0F1B3D' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          {/* Links */}
          <div className="text-center mt-5 space-y-3">
            <a
              href={`${API_URL.replace('api.', 'tur.')}/recuperar-senha`}
              className="block text-sm font-medium transition-colors"
              style={{ color: '#0F1B3D' }}
            >
              Esqueci minha senha
            </a>
          </div>
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          © 2025 SYSTELOS · Sistemas com propósito
        </p>
      </div>
    </div>
  )
}
