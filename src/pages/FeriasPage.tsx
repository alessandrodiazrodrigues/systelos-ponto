// ============================================================================
// SYSTELOS PONTO — Férias e Afastamentos Page
// ============================================================================

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Umbrella, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import { Loading } from '../components/ui/Loading'

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://api.systelos.com.br'

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Abas — padrão idêntico ao TUR (#FFB800 ativo, #0F1B3D inativo)
function Abas({ ativa, onChange }: { ativa: string; onChange: (v: string) => void }) {
  const abas = [
    { id: 'ferias',      label: 'Férias' },
    { id: 'afastamentos', label: 'Atestados' },
  ]
  return (
    <div className="flex bg-gray-100 p-1 gap-1 rounded-xl">
      {abas.map(a => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            ativa === a.id
              ? 'bg-[#E8B84B] text-[#0F1B3D] shadow-sm'
              : 'bg-[#0F1B3D] text-white hover:bg-[#1a2a52]'
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

function StatusBadgePequeno({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    PENDENTE_AGENDAMENTO: { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: Clock,        label: 'Pendente' },
    SOLICITADA:           { bg: 'bg-amber-100',  text: 'text-amber-700',  icon: Clock,        label: 'Aguardando' },
    APROVADA:             { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle,  label: 'Aprovada' },
    REJEITADA:            { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle,      label: 'Rejeitada' },
    EM_GOZO:              { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Umbrella,     label: 'Em gozo' },
    CONCLUIDA:            { bg: 'bg-gray-100',   text: 'text-gray-500',   icon: CheckCircle,  label: 'Concluída' },
    VENCIDA:              { bg: 'bg-red-100',    text: 'text-red-700',    icon: AlertTriangle, label: 'Vencida' },
    PENDENTE:             { bg: 'bg-amber-100',  text: 'text-amber-700',  icon: Clock,        label: 'Pendente' },
    VALIDADO:             { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle,  label: 'Validado' },
    REJEITADO:            { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle,      label: 'Rejeitado' },
  }
  const c = cfg[status] ?? cfg['PENDENTE']
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}

export default function FeriasPage() {
  const { usuario }   = useAuth()
  const [aba, setAba] = useState('ferias')
  const funcionarioId = usuario?.funcionario_id ?? ''

  const { data: ferias, isLoading: loadFerias } = useQuery({
    queryKey: ['ferias', funcionarioId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/equipe/ferias/${funcionarioId}`)
      return data.data
    },
    enabled: !!funcionarioId && aba === 'ferias',
  })

  const { data: afastamentos, isLoading: loadAfast } = useQuery({
    queryKey: ['afastamentos', funcionarioId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/equipe/afastamentos?funcionario_id=${funcionarioId}`)
      return data.data
    },
    enabled: !!funcionarioId && aba === 'afastamentos',
  })

  const isLoading = aba === 'ferias' ? loadFerias : loadAfast

  return (
    <div className="flex flex-col gap-4 p-4">

      <h2 className="font-bold text-base" style={{ color: '#0F1B3D' }}>Férias e Atestados</h2>

      <Abas ativa={aba} onChange={setAba} />

      {isLoading ? (
        <div className="flex justify-center pt-8"><Loading text="Carregando..." /></div>
      ) : aba === 'ferias' ? (
        // ==================== FÉRIAS ====================
        <div className="flex flex-col gap-3">
          {ferias?.ferias?.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Umbrella className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum período de férias cadastrado</p>
            </div>
          ) : (
            ferias?.ferias?.map((f: any) => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Período aquisitivo</p>
                    <p className="text-sm font-semibold" style={{ color: '#0F1B3D' }}>
                      {formatarData(f.periodo_aquisitivo_ini)} – {formatarData(f.periodo_aquisitivo_fim)}
                    </p>
                  </div>
                  <StatusBadgePequeno status={f.status} />
                </div>

                {f.data_inicio_gozo && (
                  <div className="border-t border-gray-50 pt-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-400">Início</p>
                      <p className="text-sm font-medium">{formatarData(f.data_inicio_gozo)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Fim</p>
                      <p className="text-sm font-medium">{f.data_fim_gozo ? formatarData(f.data_fim_gozo) : '—'}</p>
                    </div>
                    {f.dias_gozados && (
                      <div>
                        <p className="text-xs text-gray-400">Dias</p>
                        <p className="text-sm font-medium">{f.dias_gozados} dias</p>
                      </div>
                    )}
                  </div>
                )}

                {f.vencida && (
                  <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg p-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600 font-medium">Férias vencidas — fale com seu gestor</p>
                  </div>
                )}

                {f.urgente && !f.vencida && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <p className="text-xs text-amber-700">Vence em {f.dias_ate_vencer} dias — agende suas férias!</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        // ==================== ATESTADOS ====================
        <div className="flex flex-col gap-3">
          {afastamentos?.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum atestado cadastrado</p>
            </div>
          ) : (
            afastamentos?.map((a: any) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: '#0F1B3D' }}>
                    {a.tipo.replace(/_/g, ' ')}
                  </p>
                  <StatusBadgePequeno status={a.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Início</p>
                    <p className="font-medium">{formatarData(a.data_inicio)}</p>
                  </div>
                  {a.data_fim && (
                    <div>
                      <p className="text-xs text-gray-400">Fim</p>
                      <p className="font-medium">{formatarData(a.data_fim)}</p>
                    </div>
                  )}
                  {a.dias && (
                    <div>
                      <p className="text-xs text-gray-400">Dias</p>
                      <p className="font-medium">{a.dias}</p>
                    </div>
                  )}
                  {a.cid && (
                    <div>
                      <p className="text-xs text-gray-400">CID</p>
                      <p className="font-medium">{a.cid}</p>
                    </div>
                  )}
                </div>
                {a.encaminhado_inss && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <CheckCircle className="w-3 h-3" />
                    Encaminhado ao INSS
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  )
}
