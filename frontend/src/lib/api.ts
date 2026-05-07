const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

export interface SessionSummary {
  sessionId: string
  banco: string
  totalTransacciones: number
  totalRegistros: number
  matchRate: number
  totalMontoConciliado: number
  totalMontoSinConciliar: number
  processedAt: string
}

export interface MatchedItem {
  transaccionId: string
  registroId: string
  score: number
  scoreMonto: number
  scoreDescripcion: number
  scoreFecha: number
  status: string
  bankDescripcion?: string
  bankMonto?: number
  cfdiEmisorNombre?: string
  cfdiTotal?: number
  cfdiMontoEsperado?: number
  cfdiUuid?: string
}

export interface UnmatchedBankItem {
  id: string
  descripcion: string
  monto: number
  fecha: string
  referencia?: string
}

export interface UnmatchedCFDIItem {
  id: string
  emisorNombre: string
  emisorRfc: string
  total: number
  montoEsperado: number
  uuid: string
  fecha: string
}

export interface SessionDetail {
  sessionId: string
  banco: string
  totalTransacciones: number
  totalRegistros: number
  matched: MatchedItem[]
  unmatchedBank: string[]
  unmatchedCFDI: string[]
  unmatchedBankDetail?: UnmatchedBankItem[]
  unmatchedCFDIDetail?: UnmatchedCFDIItem[]
  summary: {
    matchRate: number
    totalMontoConciliado: number
    totalMontoSinConciliar: number
  }
  processedAt: string
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${BASE}/v1/sessions`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json() as { sessions: SessionSummary[] }
  return data.sessions
}

export async function fetchSession(sessionId: string): Promise<SessionDetail> {
  const res = await fetch(`${BASE}/v1/sessions/${sessionId}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<SessionDetail>
}

export async function reconcile(
  banco: string,
  csvFile: File,
  cfdiFiles: File[],
  periodo?: string,
): Promise<SessionDetail> {
  const form = new FormData()
  form.append('banco', banco)
  form.append('bank_csv', csvFile)
  for (const f of cfdiFiles) form.append('cfdis', f)
  if (periodo) form.append('periodo', periodo)

  const res = await fetch(`${BASE}/v1/reconcile`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json() as { error?: string }
    throw new Error(err.error ?? `Error ${res.status}`)
  }
  return res.json() as Promise<SessionDetail>
}
