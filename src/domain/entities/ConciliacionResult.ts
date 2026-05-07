export type MatchStatus = 'matched' | 'unmatched_bank' | 'unmatched_cfdi' | 'confirmed' | 'rejected'

export interface MatchedItem {
  transaccionId: string
  registroId: string
  score: number
  scoreMonto: number
  scoreDescripcion: number
  scoreFecha: number
  status: MatchStatus
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

export interface ConciliacionResult {
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
  processedAt: Date
}
