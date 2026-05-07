import type { ConciliacionResult } from '../entities/ConciliacionResult.js'
import type { CorrectionLog } from '../entities/CorrectionLog.js'

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

export interface IConciliacionRepository {
  saveSession(result: ConciliacionResult): Promise<void>
  getSession(sessionId: string): Promise<ConciliacionResult | null>
  getSessions(limit?: number): Promise<SessionSummary[]>
  saveCorrection(log: CorrectionLog): Promise<void>
  getCorrections(sessionId: string): Promise<CorrectionLog[]>
}
