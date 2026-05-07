import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/client.js'
import type { IConciliacionRepository, SessionSummary } from '../../domain/interfaces/IConciliacionRepository.js'
import type { ConciliacionResult } from '../../domain/entities/ConciliacionResult.js'
import type { CorrectionLog, CorrectionAction } from '../../domain/entities/CorrectionLog.js'

interface SessionRow {
  id: string
  banco: string
  total_transacciones: number
  total_registros: number
  match_rate: number
  total_monto_conciliado: number
  total_monto_sin_conciliar: number
  result_json: string
  processed_at: string
}

interface CorrectionRow {
  id: string
  session_id: string
  transaccion_id: string
  registro_id: string
  action: string
  previous_score: number
  reason: string | null
  created_at: string
}

export class SQLiteConciliacionRepository implements IConciliacionRepository {
  async saveSession(result: ConciliacionResult): Promise<void> {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sessions
        (id, banco, total_transacciones, total_registros, match_rate,
         total_monto_conciliado, total_monto_sin_conciliar, result_json, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      result.sessionId,
      result.banco,
      result.totalTransacciones,
      result.totalRegistros,
      result.summary.matchRate,
      result.summary.totalMontoConciliado,
      result.summary.totalMontoSinConciliar,
      JSON.stringify(result),
      result.processedAt.toISOString(),
    )
  }

  async getSessions(limit = 50): Promise<SessionSummary[]> {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT id, banco, total_transacciones, total_registros, match_rate,
                total_monto_conciliado, total_monto_sin_conciliar, processed_at
         FROM sessions ORDER BY processed_at DESC LIMIT ?`,
      )
      .all(limit) as SessionRow[]
    return rows.map((r) => ({
      sessionId: r.id,
      banco: r.banco,
      totalTransacciones: r.total_transacciones,
      totalRegistros: r.total_registros,
      matchRate: r.match_rate,
      totalMontoConciliado: r.total_monto_conciliado,
      totalMontoSinConciliar: r.total_monto_sin_conciliar,
      processedAt: r.processed_at,
    }))
  }

  async getSession(sessionId: string): Promise<ConciliacionResult | null> {
    const db = getDb()
    const row = db.prepare('SELECT result_json FROM sessions WHERE id = ?').get(sessionId) as
      | Pick<SessionRow, 'result_json'>
      | undefined
    if (!row) return null
    const result = JSON.parse(row.result_json) as ConciliacionResult
    result.processedAt = new Date(result.processedAt)
    return result
  }

  async saveCorrection(log: CorrectionLog): Promise<void> {
    const db = getDb()
    db.prepare(`
      INSERT INTO corrections
        (id, session_id, transaccion_id, registro_id, action, previous_score, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.id ?? uuidv4(),
      log.sessionId,
      log.transaccionId,
      log.registroId,
      log.action,
      log.previousScore,
      log.reason ?? null,
      log.createdAt.toISOString(),
    )
  }

  async getCorrections(sessionId: string): Promise<CorrectionLog[]> {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM corrections WHERE session_id = ? ORDER BY created_at DESC')
      .all(sessionId) as CorrectionRow[]
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      transaccionId: r.transaccion_id,
      registroId: r.registro_id,
      action: r.action as CorrectionAction,
      previousScore: r.previous_score,
      reason: r.reason ?? undefined,
      createdAt: new Date(r.created_at),
    }))
  }
}
