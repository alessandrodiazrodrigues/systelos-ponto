// ============================================================================
// SYSTELOS PONTO — Espelho de Ponto Page
// ============================================================================
// Visual baseado em MovimentacoesPage.tsx + MetasComissoesPage.tsx do TUR
// ============================================================================

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import { Loading } from '../components/ui/Loading'

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

// ============================================================================
// HELPERS
// ============================================================================

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function formatarMinutos(min: number): string {
  const sinal = min < 0 ? '-' : ''
  const abs   = Math.abs(min)
  return `${sinal}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, '0')}`
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const TIPO_LABEL: Record<string, string> = {
  ENTRADA: 'Entrada', INTERVALO_OUT: 'Saída almoço',
  INTERVALO_IN: 'Volta almoço', SAIDA: 'Saída',
}

// ============================================================================
// SELETOR DE MÊS — padrão idêntico ao TUR
// ============================================================================

function SeletorMes({ mes, ano, onChange }: {
  mes: number; ano: number; onChange: (m: number, a: number) => void
}) {
  const anterior = () => mes === 1 ? onChange(12, ano - 1) : onChange(mes - 1, ano)
  const proximo  = () => mes === 12 ? onChange(1, ano + 1) : onChange(mes + 1, ano)
  const hoje     = new Date()
  const isAtual  = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
      <button onClick={anterior} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="min-w-[130px] text-center font-medium text-gray-700 text-sm">
        {MESES[mes - 1]} {ano}
      </span>
      <button onClick={proximo} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
        <ChevronRight className="w-5 h-5" />
      </button>
      {!isAtual && (
        <button onClick={() => onChange(hoje.getMonth() + 1, hoje.getFullYear())}
          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium">
          Hoje
        </button>
      )}
    </div>
  )
}

// ============================================================================
// STAT CARD — padrão idêntico ao StatCard do TUR
// ============================================================================

function StatCard({ label, valor, sub, cor = 'gray' }: {
  label: string; valor: string; sub?: string; cor?: 'gray' | 'green' | 'red' | 'blue'
}) {
  const cores = {
    gray:  'text-gray-900',
    green: 'text-green-600',
    red:   'text-red-500',
    blue:  'text-blue-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${cores[cor]}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

export default function EspelhoPage() {
  const { usuario } = useAuth()
  const hoje        = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())

  const funcionarioId = usuario?.funcionario_id ?? ''

  const { data, isLoading } = useQuery({
    queryKey:  ['espelho', funcionarioId, mes, ano],
    queryFn:   async () => {
      const { data } = await axios.get(
        `${API_URL}/api/equipe/jornada/espelho/${funcionarioId}/${ano}/${mes}`
      )
      return data.data
    },
    enabled: !!funcionarioId,
  })

  if (isLoading) {
    return <div className="flex justify-center pt-16"><Loading text="Carregando espelho..." /></div>
  }

  const espelho = data
  const diasComMarcacao = espelho?.dias?.filter((d: any) => d.marcacoes.length > 0) ?? []

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Seletor de mês */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base" style={{ color: '#0F1B3D' }}>Espelho de Ponto</h2>
        <SeletorMes mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a) }} />
      </div>

      {/* StatCards — padrão TUR */}
      {espelho && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Horas trabalhadas"
            valor={formatarMinutos(espelho.total_trabalhado_minutos)}
            sub={`de ${formatarMinutos(espelho.total_esperado_minutos)}`}
          />
          <StatCard
            label="Banco de horas"
            valor={formatarMinutos(espelho.saldo_banco_horas_minutos)}
            cor={espelho.saldo_banco_horas_minutos >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Horas extras"
            valor={formatarMinutos(espelho.total_extra_minutos)}
            cor="blue"
          />
          <StatCard
            label="Faltas"
            valor={String(espelho.total_faltas)}
            cor={espelho.total_faltas > 0 ? 'red' : 'gray'}
          />
        </div>
      )}

      {/* Disclaimer legal — obrigatório */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">{espelho?.disclaimer}</p>
      </div>

      {/* Lista de dias */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-700">Registros do mês</p>
        </div>

        {diasComMarcacao.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Calendar className="w-10 h-10 mb-2" />
            <p className="text-sm">Nenhuma marcação neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {espelho?.dias?.filter((d: any) => !d.falta || d.marcacoes.length > 0).map((dia: any) => (
              <div key={dia.data} className="px-4 py-3">
                {/* Cabeçalho do dia */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 w-8">
                      {DIAS_SEMANA[dia.dia_semana]}
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#0F1B3D' }}>
                      {new Date(dia.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    {dia.falta && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Falta</span>
                    )}
                    {dia.observacao && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">{dia.observacao}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {dia.trabalhado_minutos > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatarMinutos(dia.trabalhado_minutos)}
                      </span>
                    )}
                    {dia.extra_minutos > 0 && (
                      <span className="text-green-600 font-medium">+{formatarMinutos(dia.extra_minutos)}</span>
                    )}
                  </div>
                </div>

                {/* Marcações do dia */}
                {dia.marcacoes.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 ml-10">
                    {dia.marcacoes.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span className="text-gray-400">{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                        <span className="font-medium">{formatarHora(m.data_hora)}</span>
                        {m.corrigida && <span className="text-orange-500 text-[10px]">Corr.</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
