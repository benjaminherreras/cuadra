import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Database, DollarSign, Clock, Plus } from 'lucide-react'
import { fetchSessions, type SessionSummary } from '../lib/api'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function formatDate(s: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(s))
}

function MatchRateBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? '#22c55e' : rate >= 75 ? '#eab308' : '#E63B2E'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rate}%`, background: color }} />
      </div>
      <span className="font-mono text-xs tabular-nums" style={{ color }}>{rate}%</span>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string; value: string; sub?: string
}) {
  return (
    <div className="bg-dark border border-white/8 rounded-[1.5rem] p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-signal/10 border border-signal/20 flex items-center justify-center">
          <Icon size={14} className="text-signal" />
        </div>
        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-mono text-3xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="font-mono text-xs text-white/30">{sub}</div>}
    </div>
  )
}

function bancoColor(banco: string) {
  const map: Record<string, string> = {
    BBVA: '#5B9BD5', BANORTE: '#FF6B6B', SANTANDER: '#FF4444', HSBC: '#FF8080',
  }
  return map[banco.toUpperCase()] ?? '#aaa'
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalSessions = sessions.length
  const avgMatchRate = totalSessions
    ? Math.round(sessions.reduce((s, x) => s + x.matchRate, 0) / totalSessions)
    : 0
  const totalAmount = sessions.reduce((s, x) => s + x.totalMontoConciliado, 0)
  const lastSession = sessions[0]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4">
          <span className="font-grotesk font-black text-xl text-white tracking-tight">CUADRA</span>
          <div className="w-px h-5 bg-white/15" />
          <span className="font-mono text-xs text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-signal' : 'bg-green-400 pulse-dot'}`} />
            <span className="font-mono text-xs text-white/30">
              {error ? 'Backend offline' : 'Conectado'}
            </span>
          </div>
          <Link
            to="/reconcile"
            className="flex items-center gap-2 font-mono text-xs bg-signal text-white px-4 py-2 rounded-full hover:bg-signal/80 transition-colors duration-200"
          >
            <Plus size={12} />
            Nueva sesión
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs text-white/40 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft size={12} />
            Inicio
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-grotesk font-black text-4xl text-white mb-2">
            Sesiones de conciliación
          </h1>
          <p className="font-grotesk text-sm text-white/40">Histórico de sesiones procesadas por Cuadra</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Database} label="Total Sesiones" value={String(totalSessions)} sub="procesadas" />
          <StatCard icon={TrendingUp} label="Match Rate Prom." value={`${avgMatchRate}%`} sub="promedio histórico" />
          <StatCard
            icon={DollarSign}
            label="Monto Conciliado"
            value={formatCurrency(totalAmount).replace('MX$', '$')}
            sub="total acumulado"
          />
          <StatCard
            icon={Clock}
            label="Última Sesión"
            value={lastSession ? formatDate(lastSession.processedAt) : '—'}
            sub={lastSession?.banco ?? ''}
          />
        </div>

        <div className="bg-dark border border-white/8 rounded-[2rem] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="font-grotesk font-semibold text-white">Sesiones</h2>
            <span className="font-mono text-xs text-white/30">{sessions.length} registros</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="font-mono text-xs text-white/30 animate-pulse">Cargando sesiones…</div>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="font-mono text-xs text-signal">Backend no disponible — {error}</div>
              <Link to="/reconcile" className="font-mono text-xs text-white/40 hover:text-white underline">
                Crear primera sesión →
              </Link>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="font-mono text-xs text-white/30">Sin sesiones todavía</div>
              <Link to="/reconcile" className="font-mono text-xs text-signal hover:underline">
                Crear primera sesión →
              </Link>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Sesión ID', 'Banco', 'Fecha', 'Trans.', 'CFDIs', 'Match Rate', 'Conciliado'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left font-mono text-[10px] text-white/30 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.sessionId}
                      className="table-row-hover border-b border-white/5 last:border-0 cursor-pointer"
                      onClick={() => navigate(`/dashboard/${s.sessionId}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-white/60 bg-white/5 px-2 py-1 rounded-lg">
                          {s.sessionId.substring(0, 12)}…
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-grotesk text-sm font-semibold" style={{ color: bancoColor(s.banco) }}>
                          {s.banco}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-white/60">{formatDate(s.processedAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-white/80 tabular-nums">{s.totalTransacciones}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-white/80 tabular-nums">{s.totalRegistros}</span>
                      </td>
                      <td className="px-6 py-4">
                        <MatchRateBar rate={s.matchRate} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-white tabular-nums">
                          {formatCurrency(s.totalMontoConciliado).replace('MX$', '$')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
