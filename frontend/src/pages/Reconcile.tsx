import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, X, FileText, FileBadge2, ChevronLeft, ChevronRight } from 'lucide-react'
import { reconcile } from '../lib/api'

const BANCOS = [
  'BBVA', 'BANORTE', 'SANTANDER', 'HSBC',
  'CITIBANAMEX', 'SCOTIABANK', 'INBURSA', 'BANBAJIO',
  'AFIRME', 'MULTIVA', 'MIFEL',
]

const MESES = [
  { key: 1,  label: 'ENE', full: 'Enero' },
  { key: 2,  label: 'FEB', full: 'Febrero' },
  { key: 3,  label: 'MAR', full: 'Marzo' },
  { key: 4,  label: 'ABR', full: 'Abril' },
  { key: 5,  label: 'MAY', full: 'Mayo' },
  { key: 6,  label: 'JUN', full: 'Junio' },
  { key: 7,  label: 'JUL', full: 'Julio' },
  { key: 8,  label: 'AGO', full: 'Agosto' },
  { key: 9,  label: 'SEP', full: 'Septiembre' },
  { key: 10, label: 'OCT', full: 'Octubre' },
  { key: 11, label: 'NOV', full: 'Noviembre' },
  { key: 12, label: 'DIC', full: 'Diciembre' },
]

function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
      <FileBadge2 size={11} className="text-white/40 shrink-0" />
      <span className="font-mono text-[10px] text-white/60 truncate max-w-[180px]">{name}</span>
      <button type="button" onClick={onRemove} className="text-white/20 hover:text-signal transition-colors">
        <X size={11} />
      </button>
    </div>
  )
}

export default function Reconcile() {
  const navigate = useNavigate()
  const csvRef = useRef<HTMLInputElement>(null)
  const cfdiRef = useRef<HTMLInputElement>(null)

  const now = new Date()
  const [banco, setBanco] = useState('')
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [anio, setAnio] = useState(now.getFullYear())
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [cfdiFiles, setCfdiFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !!banco && !!csvFile && cfdiFiles.length > 0 && !loading
  const periodoLabel = `${MESES.find(m => m.key === mes)?.full ?? ''} ${anio}`
  const periodoISO = `${anio}-${String(mes).padStart(2, '0')}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const session = await reconcile(banco, csvFile!, cfdiFiles, periodoISO)
      navigate(`/dashboard/${session.sessionId}`)
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvFile(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  function handleCfdiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])
    setCfdiFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...incoming.filter(f => !names.has(f.name))]
    })
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4">
          <span className="font-grotesk font-black text-xl text-white tracking-tight">CUADRA</span>
          <div className="w-px h-5 bg-white/15" />
          <span className="font-mono text-xs text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            Nueva sesión
          </span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-mono text-xs text-white/40 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={12} />
          Dashboard
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="font-grotesk font-black text-4xl text-white mb-2">Conciliar archivos</h1>
          <p className="font-grotesk text-sm text-white/40">
            Sube el estado de cuenta bancario y los XMLs de CFDI para conciliar automáticamente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Periodo ─────────────────────────────────────────────────────── */}
          <div className="bg-dark border border-white/8 rounded-[1.5rem] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest">Periodo</div>
              {/* Year navigator */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAnio(a => a - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono text-sm font-bold text-white tabular-nums w-12 text-center">
                  {anio}
                </span>
                <button
                  type="button"
                  onClick={() => setAnio(a => a + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-6 gap-2">
              {MESES.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMes(m.key)}
                  className={`py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider transition-all duration-150 ${
                    mes === m.key
                      ? 'bg-signal text-white'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/8'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Selected period display */}
            <div className="mt-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-white/5" />
              <span className="font-mono text-xs text-white/40 px-2">
                Periodo seleccionado:&nbsp;
                <span className="text-white font-bold">{periodoLabel}</span>
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
          </div>

          {/* ── Banco ───────────────────────────────────────────────────────── */}
          <div className="bg-dark border border-white/8 rounded-[1.5rem] p-6">
            <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-4">Banco</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {BANCOS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBanco(b)}
                  className={`py-3 rounded-xl font-mono text-xs font-bold tracking-wider transition-all duration-150 ${
                    banco === b
                      ? 'bg-signal text-white'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/8'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* ── Estado de cuenta ────────────────────────────────────────────── */}
          <div className="bg-dark border border-white/8 rounded-[1.5rem] p-6">
            <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-4">
              Estado de cuenta — PDF o CSV
            </div>
            {csvFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-signal" />
                  <div>
                    <div className="font-mono text-xs text-white">{csvFile.name}</div>
                    <div className="font-mono text-[10px] text-white/30">
                      {(csvFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCsvFile(null)}
                  className="text-white/20 hover:text-signal transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => csvRef.current?.click()}
                className="w-full border border-dashed border-white/15 rounded-xl py-8 flex flex-col items-center gap-3 hover:border-signal/50 hover:bg-signal/5 transition-all duration-200 group"
              >
                <Upload size={20} className="text-white/20 group-hover:text-signal/60 transition-colors" />
                <span className="font-mono text-xs text-white/30 group-hover:text-white/50">
                  Seleccionar PDF o CSV
                </span>
              </button>
            )}
            <input ref={csvRef} type="file" accept=".pdf,.csv" className="hidden" onChange={handleCsvChange} />
          </div>

          {/* ── CFDIs ───────────────────────────────────────────────────────── */}
          <div className="bg-dark border border-white/8 rounded-[1.5rem] p-6">
            <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-4">
              CFDIs — XML ({cfdiFiles.length} archivo{cfdiFiles.length !== 1 ? 's' : ''})
            </div>
            {cfdiFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {cfdiFiles.map((f, i) => (
                  <FileChip
                    key={f.name}
                    name={f.name}
                    onRemove={() => setCfdiFiles(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => cfdiRef.current?.click()}
              className="w-full border border-dashed border-white/15 rounded-xl py-6 flex flex-col items-center gap-3 hover:border-signal/50 hover:bg-signal/5 transition-all duration-200 group"
            >
              <Upload size={18} className="text-white/20 group-hover:text-signal/60 transition-colors" />
              <span className="font-mono text-xs text-white/30 group-hover:text-white/50">
                {cfdiFiles.length > 0 ? 'Agregar más XMLs' : 'Seleccionar XMLs'}
              </span>
            </button>
            <input ref={cfdiRef} type="file" accept=".xml" multiple className="hidden" onChange={handleCfdiChange} />
          </div>

          {error && (
            <div className="bg-signal/10 border border-signal/20 rounded-xl px-5 py-4">
              <span className="font-mono text-xs text-signal">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-mono text-sm font-bold uppercase tracking-widest transition-all duration-200 ${
              canSubmit
                ? 'bg-signal text-white hover:bg-signal/80'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {loading
              ? <span className="animate-pulse">Procesando…</span>
              : `Conciliar ${periodoLabel}`}
          </button>

          {!canSubmit && !loading && (
            <div className="text-center font-mono text-[10px] text-white/20">
              {!banco && 'Selecciona un banco · '}
              {!csvFile && 'Sube el estado de cuenta · '}
              {cfdiFiles.length === 0 && 'Sube al menos un CFDI'}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
