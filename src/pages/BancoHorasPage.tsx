// ============================================================================
// SYSTELOS PONTO — Banco de Horas Page
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import { Loading } from '../components/ui/Loading'

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

function formatarMinutos(min: number): string {
  const sinal = min < 0 ? '-' : '+'
  const abs   = Math.abs(min)
  return `${sinal}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, '0')}`
}

export default function BancoHorasPage() {
  const { usuario } = useAuth()
  const funcionarioId = usuario?.funcionario_id ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['banco-horas', funcionarioId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/equipe/jornada/banco-horas/${funcionarioId}`)
      return data.data
    },
    enabled: !!funcionarioId,
  })

  if (isLoading) {
    return <div className="flex justify-center pt-16"><Loading text="Carregando..." /></div>
  }

  const saldo     = data?.saldo_minutos ?? 0
  const alertas   = data?.alertas ?? []
  const positivo  = saldo >= 0

  return (
    <div className="flex flex-col gap-4 p-4">

      <h2 className="font-bold text-base" style={{ color: '#0F1B3D' }}>Banco de Horas</h2>

      {/* Card principal de saldo */}
      <div
        className="rounded-2xl p-6 text-center text-white"
        style={{ background: positivo
          ? 'linear-gradient(135deg, #0F1B3D 0%, #1a2d5a 100%)'
          : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
        }}
      >
        <p className="text-sm opacity-70 mb-2">Saldo atual</p>
        <div className="flex items-center justify-center gap-3">
          {positivo
            ? <TrendingUp className="w-8 h-8 text-green-300" />
            : <TrendingDown className="w-8 h-8 text-red-300" />
          }
          <span className="text-4xl font-bold tracking-tight">
            {formatarMinutos(saldo)}
          </span>
        </div>
        <p className="text-xs opacity-60 mt-3">
          Prazo para compensar: {data?.prazo_meses ?? 6} meses
        </p>
      </div>

      {/* Alertas de vencimento */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700">Alertas</p>
          {alertas.map((alerta: any, i: number) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
              alerta.tipo === 'VENCIDO'
                ? 'bg-red-50 border-red-200'
                : alerta.tipo === 'VENCIMENTO_15'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                alerta.tipo === 'VENCIDO' ? 'text-red-500' :
                alerta.tipo === 'VENCIMENTO_15' ? 'text-orange-500' : 'text-amber-500'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-800">{alerta.mensagem}</p>
                <p className="text-xs text-gray-500 mt-0.5">{alerta.data_referencia}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Como funciona</p>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Horas extras</p>
            <p className="text-xs text-gray-500">Horas trabalhadas acima da jornada são creditadas no banco</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Compensação</p>
            <p className="text-xs text-gray-500">Combine com seu gestor para sair mais cedo ou tirar dias de folga</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Vencimento</p>
            <p className="text-xs text-gray-500">Horas não compensadas em {data?.prazo_meses ?? 6} meses viram hora extra paga</p>
          </div>
        </div>
      </div>

    </div>
  )
}
