import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { fetchSession, type SessionDetail as SessionDetailType, type MatchedItem, type UnmatchedBankItem, type UnmatchedCFDIItem } from '../lib/api'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function formatDate(s: string) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(s))
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 90 ? 'score-high' : score >= 75 ? 'score-mid' : 'score-low'
  return (
    <span className={`font-mono text-xs px-2.5 py-1 rounded-full tabular-nums font-bold ${cls}`}>
      {score}
    </span>
  )
}

function MatchedTable({ items }: { items: MatchedItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {['Banco — Descripción', 'Emisor CFDI', 'Monto Banco', 'Monto CFDI', 'Esperado', 'Score'].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-white/30 uppercase tracking-widest whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.transaccionId} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors duration-150">
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-white/70">{m.bankDescripcion ?? m.transaccionId.substring(0, 12)}</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-grotesk text-xs text-white/80">{m.cfdiEmisorNombre ?? '—'}</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-white tabular-nums">
                  {m.bankMonto != null ? formatCurrency(m.bankMonto).replace('MX$', '$') : '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-white tabular-nums">
                  {m.cfdiTotal != null ? formatCurrency(m.cfdiTotal).replace('MX$', '$') : '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-white/60 tabular-nums">
                  {m.cfdiMontoEsperado != null ? formatCurrency(m.cfdiMontoEsperado).replace('MX$', '$') : '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <ScoreBadge score={m.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UnmatchedView({
  bankItems, cfdiItems,
}: {
  bankItems: UnmatchedBankItem[]
  cfdiItems: UnmatchedCFDIItem[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-black/30 border border-white/8 rounded-[1.5rem] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <AlertCircle size={14} className="text-signal" />
          <span className="font-mono text-xs text-white/50 uppercase tracking-widest">
            Sin conciliar — Banco ({bankItems.length})
          </span>
        </div>
        {bankItems.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-xs text-white/25">Sin movimientos sin conciliar</div>
        ) : (
          <div className="divide-y divide-white/5">
            {bankItems.map((item) => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-xs text-white/70 mb-1">{item.descripcion}</div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/30">{item.fecha}</span>
                      {item.referencia && (
                        <span className="font-mono text-[10px] text-white/20">{item.referencia}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-signal tabular-nums whitespace-nowrap">
                    {formatCurrency(item.monto).replace('MX$', '$')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-black/30 border border-white/8 rounded-[1.5rem] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <AlertCircle size={14} className="text-yellow-400" />
          <span className="font-mono text-xs text-white/50 uppercase tracking-widest">
            Sin conciliar — CFDI ({cfdiItems.length})
          </span>
        </div>
        {cfdiItems.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-xs text-white/25">Sin CFDIs sin conciliar</div>
        ) : (
          <div className="divide-y divide-white/5">
            {cfdiItems.map((item) => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-grotesk text-xs text-white/70 mb-1">{item.emisorNombre}</div>
                    <div className="font-mono text-[10px] text-white/20 break-all">{item.uuid.substring(0, 18)}…</div>
                    <div className="font-mono text-[10px] text-white/30 mt-1">{item.fecha}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-yellow-400 tabular-nums whitespace-nowrap block">
                      {formatCurrency(item.total).replace('MX$', '$')}
                    </span>
                    <span className="font-mono text-[10px] text-white/30 whitespace-nowrap">
                      esp. {formatCurrency(item.montoEsperado).replace('MX$', '$')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'matched' | 'unmatched'>('matched')

  useEffect(() => {
    if (!sessionId) return
    fetchSession(sessionId)
      .then(setSession)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="font-mono text-xs text-white/30 animate-pulse">Cargando sesión…</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="font-mono text-2xl text-signal">404</div>
        <div className="font-grotesk text-white/40">{error ?? 'Sesión no encontrada'}</div>
        <Link to="/dashboard" className="font-mono text-xs text-signal hover:underline mt-2">
          ← Volver al dashboard
        </Link>
      </div>
    )
  }

  const unmatchedBank = session.unmatchedBankDetail ?? []
  const unmatchedCFDI = session.unmatchedCFDIDetail ?? []
  const unmatchedCount = session.unmatchedBank.length + session.unmatchedCFDI.length
  const { matchRate, totalMontoConciliado } = session.summary

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4">
          <span className="font-grotesk font-black text-xl text-white tracking-tight">CUADRA</span>
          <div className="w-px h-5 bg-white/15" />
          <span className="font-mono text-xs text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full">Sesión</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-mono text-xs text-white/40 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={12} />
          Dashboard
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
            <div>
              <div className="font-mono text-xs text-white/30 mb-3">{session.sessionId}</div>
              <h1 className="font-grotesk font-black text-4xl text-white mb-1">
                {session.banco}
                <span className="font-mono text-xl text-white/30 ml-3 font-normal">
                  {formatDate(session.processedAt)}
                </span>
              </h1>
            </div>
            <div className="bg-dark border border-white/8 rounded-[1.5rem] px-8 py-5 text-center">
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">Match Rate</div>
              <div
                className="font-mono text-5xl font-bold tabular-nums"
                style={{ color: matchRate >= 90 ? '#22c55e' : matchRate >= 75 ? '#eab308' : '#E63B2E' }}
              >
                {matchRate}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Transacciones', value: String(session.totalTransacciones) },
              { label: 'CFDIs', value: String(session.totalRegistros) },
              { label: 'Conciliados', value: String(session.matched.length) },
              { label: 'Sin conciliar', value: String(unmatchedCount) },
            ].map((stat) => (
              <div key={stat.label} className="bg-dark border border-white/8 rounded-2xl px-5 py-4">
                <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-signal/10 border border-signal/20 rounded-2xl px-6 py-4 flex items-center justify-between mb-8">
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Monto total conciliado</span>
          <span className="font-mono text-2xl font-bold text-signal tabular-nums">
            {formatCurrency(totalMontoConciliado).replace('MX$', '$')}
          </span>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'matched', label: 'Conciliados', count: session.matched.length, icon: CheckCircle2, color: '#22c55e' },
            { key: 'unmatched', label: 'Sin conciliar', count: unmatchedCount, icon: AlertCircle, color: '#E63B2E' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'matched' | 'unmatched')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={12} style={{ color: activeTab === tab.key ? tab.color : 'inherit' }} />
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] tabular-nums ${activeTab === tab.key ? 'bg-black/10' : 'bg-white/10'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-dark border border-white/8 rounded-[2rem] overflow-hidden">
          {activeTab === 'matched' ? (
            session.matched.length === 0 ? (
              <div className="py-16 text-center font-mono text-xs text-white/25">Sin pares conciliados</div>
            ) : (
              <MatchedTable items={session.matched} />
            )
          ) : (
            <div className="p-4">
              <UnmatchedView bankItems={unmatchedBank} cfdiItems={unmatchedCFDI} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
