// ============================================================================
// SYSTELOS PONTO — Marcar Ponto Page
// ============================================================================
// Arquivo: src/pages/MarcarPontoPage.tsx
// Versão: 1.0.0 | Criado: 04/2026
//
// Fluxo:
// 1. Busca marcações do dia (GET /api/equipe/ponto/hoje/:id)
// 2. Botão muda automaticamente conforme última marcação
// 3. Aperta → câmera frontal (selfie) + GPS
// 4. Preview → Confirmar → POST /api/equipe/ponto/marcar
// 5. Comprovante verde com NSR + "Email enviado ✅"
// ============================================================================

import { useState, useEffect, useRef } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'

// ============================================================================
// TIPOS
// ============================================================================

type TipoPonto = 'ENTRADA' | 'INTERVALO_OUT' | 'INTERVALO_IN' | 'SAIDA'

interface Marcacao {
  id:        string
  tipo:      TipoPonto
  data_hora: string
  nsr:       number
}

interface MarcacoesHoje {
  marcacoes:        Marcacao[]
  proxima_marcacao: TipoPonto | null
  jornada_completa: boolean
}

interface Comprovante {
  nsr:       number
  data_hora: string
  tipo:      TipoPonto
}

// ============================================================================
// HELPERS
// ============================================================================

const TIPO_LABEL: Record<TipoPonto, string> = {
  ENTRADA:       'Entrada',
  INTERVALO_OUT: 'Saída almoço',
  INTERVALO_IN:  'Volta almoço',
  SAIDA:         'Saída',
}

const TIPO_EMOJI: Record<TipoPonto, string> = {
  ENTRADA:       '🌅',
  INTERVALO_OUT: '🍽️',
  INTERVALO_IN:  '🔙',
  SAIDA:         '🏠',
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function horaServidor(offset = 0) {
  return new Date(Date.now() + offset).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

// ============================================================================
// COMPONENTE RELÓGIO
// ============================================================================

function Relogio() {
  const [hora, setHora] = useState(horaServidor())

  useEffect(() => {
    const t = setInterval(() => setHora(horaServidor()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="text-center py-4">
      <div className="text-5xl font-bold tracking-tight" style={{ color: '#0F1B3D', fontVariantNumeric: 'tabular-nums' }}>
        {hora}
      </div>
      <div className="text-xs text-gray-400 mt-1">hora do servidor</div>
    </div>
  )
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

type Etapa = 'inicio' | 'camera' | 'preview' | 'confirmando' | 'comprovante' | 'erro'

export default function MarcarPontoPage() {
  const { usuario, logout } = useAuth()
  const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

  // Estado principal
  const [marcacoesHoje, setMarcacoesHoje] = useState<MarcacoesHoje | null>(null)
  const [carregando, setCarregando]       = useState(true)
  const [etapa, setEtapa]                 = useState<Etapa>('inicio')
  const [comprovante, setComprovante]     = useState<Comprovante | null>(null)
  const [erroMsg, setErroMsg]             = useState('')

  // GPS e foto
  const [gpsStatus, setGpsStatus]         = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [gpsLabel, setGpsLabel]           = useState('Obtendo localização...')
  const [latitude, setLatitude]           = useState<number | null>(null)
  const [longitude, setLongitude]         = useState<number | null>(null)
  const [gpsAccuracy, setGpsAccuracy]     = useState<number | null>(null)
  const [fotoBase64, setFotoBase64]       = useState<string | null>(null)
  const [fotoPreview, setFotoPreview]     = useState<string | null>(null)
  const [isLoading, setIsLoading]         = useState(false)

  const funcionarioId = usuario?.funcionario_id ?? ''

  // ============================================================
  // Busca marcações do dia ao montar
  // ============================================================
  useEffect(() => {
    if (!funcionarioId) return
    buscarMarcacoes()
    obterGPS()
  }, [funcionarioId])

  async function buscarMarcacoes() {
    setCarregando(true)
    try {
      const token = localStorage.getItem('systelos_ponto_token')
      const { data } = await axios.get(
        `${API_URL}/api/equipe/ponto/hoje/${funcionarioId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMarcacoesHoje(data.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErroMsg('Sua sessão expirou. Faça login novamente.')
        setEtapa('erro')
        setTimeout(() => logout(), 2500)
      } else {
        setMarcacoesHoje({ marcacoes: [], proxima_marcacao: 'ENTRADA', jornada_completa: false })
      }
    } finally {
      setCarregando(false)
    }
  }

  // ============================================================
  // GPS
  // ============================================================
  async function obterGPS() {
    try {
      if (Capacitor.isNativePlatform()) {
        await Geolocation.requestPermissions()
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      setLatitude(pos.coords.latitude)
      setLongitude(pos.coords.longitude)
      setGpsAccuracy(pos.coords.accuracy)
      setGpsStatus('ok')
      setGpsLabel(`Precisão: ${Math.round(pos.coords.accuracy)}m`)
    } catch {
      setGpsStatus('erro')
      setGpsLabel('GPS indisponível')
    }
  }

  // ============================================================
  // Câmera — selfie frontal
  // ============================================================
  async function abrirCamera() {
    // Bloquear se funcionario_id não estiver disponível
    if (!funcionarioId) {
      setErroMsg('Seu usuário não está vinculado a um registro de funcionário. Entre em contato com o RH ou administrador.')
      setEtapa('erro')
      return
    }
    setEtapa('camera')
    try {
      const foto = await Camera.getPhoto({
        quality:          90,
        allowEditing:     false,
        resultType:       CameraResultType.Base64,
        source:           CameraSource.Camera,
        direction:        'front' as any,
        presentationStyle: 'fullscreen',
      })

      if (foto.base64String) {
        setFotoBase64(foto.base64String)
        setFotoPreview(`data:image/jpeg;base64,${foto.base64String}`)
        setEtapa('preview')
      } else {
        setEtapa('inicio')
      }
    } catch {
      // Usuário cancelou a câmera
      setEtapa('inicio')
    }
  }

  // ============================================================
  // Confirmar marcação
  // ============================================================
  async function confirmarMarcacao() {
    const proxima = marcacoesHoje?.proxima_marcacao
    if (!proxima) return

    setEtapa('confirmando')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('systelos_ponto_token')
      const { data } = await axios.post(`${API_URL}/api/equipe/ponto/marcar`, {
        funcionario_id: funcionarioId,
        tipo:           proxima,
        metodo:         Capacitor.isNativePlatform() ? 'APP' : 'WEB',
        latitude,
        longitude,
        gps_accuracy:   gpsAccuracy,
        foto_base64:    fotoBase64,
      }, { headers: { Authorization: `Bearer ${token}` } })

      setComprovante({
        nsr:       data.data.nsr,
        data_hora: data.data.data_hora,
        tipo:      data.data.tipo,
      })
      setEtapa('comprovante')
      setIsLoading(false)
      // Recarrega marcações em segundo plano
      setTimeout(buscarMarcacoes, 1000)

    } catch (err: any) {
      const status = err.response?.status
      if (status === 401) {
        // Sessão expirada — avisa e redireciona para login
        setErroMsg('Sua sessão expirou. Faça login novamente.')
        setEtapa('erro')
        setIsLoading(false)
        setTimeout(() => logout(), 2500)
        return
      }
      setErroMsg(err.response?.data?.message ?? 'Erro ao registrar ponto. Tente novamente.')
      setEtapa('erro')
      setIsLoading(false)
    }
  }

  function reiniciar() {
    setEtapa('inicio')
    setFotoBase64(null)
    setFotoPreview(null)
    setErroMsg('')
    setIsLoading(false)
  }

  // ============================================================
  // RENDER — COMPROVANTE
  // ============================================================
  if (etapa === 'comprovante' && comprovante) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[--color-bg]">
        <div className="w-full max-w-sm">
          {/* Card verde de sucesso */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-green-100">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Ponto registrado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              {TIPO_LABEL[comprovante.tipo]} às {formatarHora(comprovante.data_hora)}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium">{TIPO_LABEL[comprovante.tipo]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horário</span>
                <span className="font-medium">{formatarHora(comprovante.data_hora)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">NSR</span>
                <span className="font-mono font-medium">{comprovante.nsr}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Comprovante enviado por email
            </div>
          </div>

          <button
            onClick={reiniciar}
            className="w-full mt-4 py-3 rounded-xl font-medium text-gray-600 bg-white border border-gray-200"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER — PREVIEW (foto tirada, aguardando confirmação)
  // ============================================================
  if (etapa === 'preview' && fotoPreview) {
    const proxima = marcacoesHoje?.proxima_marcacao
    return (
      <div className="min-h-screen flex flex-col p-6 bg-[--color-bg]">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 pt-8">
          <h2 className="text-lg font-bold text-center" style={{ color: '#0F1B3D' }}>
            Confirmar marcação
          </h2>

          {/* Foto */}
          <div className="rounded-2xl overflow-hidden aspect-square bg-gray-100">
            <img src={fotoPreview} alt="Selfie" className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="bg-white rounded-xl p-4 space-y-2 border border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tipo</span>
              <span className="font-medium">{proxima ? TIPO_LABEL[proxima] : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Horário</span>
              <span className="font-medium">{horaServidor()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">GPS</span>
              <span className={`font-medium ${gpsStatus === 'ok' ? 'text-green-600' : 'text-orange-500'}`}>
                {gpsStatus === 'ok' ? `✓ ${gpsLabel}` : '⚠ ' + gpsLabel}
              </span>
            </div>
          </div>

          {/* Botões */}
          <button
            onClick={confirmarMarcacao}
            disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-60"
            style={{ background: '#0F1B3D' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </span>
            ) : 'Confirmar'}
          </button>

          <button
            onClick={reiniciar}
            className="w-full py-3 rounded-xl font-medium text-gray-500 bg-white border border-gray-200"
          >
            Tirar nova foto
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER — ERRO
  // ============================================================
  if (etapa === 'erro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Erro ao registrar</h2>
          <p className="text-gray-500 text-sm mb-6">{erroMsg}</p>
          <button
            onClick={erroMsg.includes('sessão expirou') ? logout : reiniciar}
            className="w-full py-3 rounded-xl font-medium text-white"
            style={{ background: '#0F1B3D' }}
          >
            {erroMsg.includes('sessão expirou') ? 'Fazer login' : 'Tentar novamente'}
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER — TELA PRINCIPAL
  // ============================================================
  const proxima       = marcacoesHoje?.proxima_marcacao
  const completo      = marcacoesHoje?.jornada_completa
  const marcacoes     = marcacoesHoje?.marcacoes ?? []

  const tiposOrdem: TipoPonto[] = ['ENTRADA', 'INTERVALO_OUT', 'INTERVALO_IN', 'SAIDA']

  // Monta linha de marcações (batida ou —)
  const linhas = tiposOrdem.map(tipo => {
    const m = marcacoes.find(x => x.tipo === tipo)
    return { tipo, hora: m ? formatarHora(m.data_hora) : null, nsr: m?.nsr }
  })

  const nome = usuario?.nome?.split(' ')[0] ?? 'Funcionário'
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  })

  return (
    <div className="flex flex-col min-h-full bg-[--color-bg]">

      {/* Saudação */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-gray-500 text-sm">{dataHoje}</p>
        <p className="text-xl font-bold" style={{ color: '#0F1B3D' }}>
          Olá, {nome}! 👋
        </p>
      </div>

      {/* Relógio */}
      <Relogio />

      {/* GPS Status */}
      <div className="mx-5 mb-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
          gpsStatus === 'ok'      ? 'bg-green-50 text-green-700' :
          gpsStatus === 'erro'    ? 'bg-orange-50 text-orange-700' :
                                    'bg-gray-50 text-gray-500'
        }`}>
          <span>{gpsStatus === 'ok' ? '📍' : gpsStatus === 'erro' ? '⚠️' : '⏳'}</span>
          <span>{gpsLabel}</span>
          {gpsStatus !== 'ok' && (
            <button onClick={obterGPS} className="ml-auto text-xs underline">
              tentar novamente
            </button>
          )}
        </div>
      </div>

      {/* Marcações do dia */}
      <div className="mx-5 mb-5 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-700">Marcações de hoje</p>
        </div>

        {carregando ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0F1B3D] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {linhas.map(({ tipo, hora }) => (
              <div key={tipo} className="flex items-center px-4 py-3">
                <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                  hora ? 'bg-green-400' :
                  tipo === proxima ? 'bg-yellow-400' : 'bg-gray-200'
                }`} />
                <span className="text-sm text-gray-600 flex-1">{TIPO_LABEL[tipo]}</span>
                {hora ? (
                  <span className="text-sm font-semibold text-gray-900">{hora}</span>
                ) : (
                  <span className="text-sm text-gray-300">—</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão principal */}
      <div className="px-5 pb-4 mt-auto">
        {completo ? (
          <div className="w-full py-4 rounded-2xl bg-green-50 text-green-700 font-semibold text-center">
            ✅ Jornada completa!
          </div>
        ) : proxima ? (
          <button
            onClick={abrirCamera}
            className="w-full py-5 rounded-2xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #0F1B3D 0%, #1a2d5a 100%)' }}
          >
            <span className="mr-2">{TIPO_EMOJI[proxima]}</span>
            REGISTRAR {TIPO_LABEL[proxima].toUpperCase()}
          </button>
        ) : null}

        {/* Solicitar correção */}
        <button className="w-full mt-3 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Solicitar correção de ponto
        </button>
      </div>

    </div>
  )
}
