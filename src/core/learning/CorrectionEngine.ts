import { v4 as uuidv4 } from 'uuid'
import type { IConciliacionRepository } from '../../domain/interfaces/IConciliacionRepository.js'
import type { ConciliacionResult, MatchStatus } from '../../domain/entities/ConciliacionResult.js'
import type { CorrectionLog, CorrectionAction } from '../../domain/entities/CorrectionLog.js'
import { MatchNotFoundError } from '../../domain/errors/DomainErrors.js'

export class CorrectionEngine {
  constructor(private readonly repo: IConciliacionRepository) {}

  async applyCorrection(
    sessionId: string,
    transaccionId: string,
    registroId: string,
    action: CorrectionAction,
    reason?: string,
  ): Promise<ConciliacionResult> {
    const result = await this.repo.getSession(sessionId)
    if (!result) throw new MatchNotFoundError(`sesión ${sessionId} no encontrada`)

    const matchIdx = result.matched.findIndex(
      (m) => m.transaccionId === transaccionId && m.registroId === registroId,
    )

    let previousScore = 0
    if (matchIdx >= 0) {
      const match = result.matched[matchIdx]!
      previousScore = match.score
      const newStatus: MatchStatus = action === 'confirm' ? 'confirmed' : 'rejected'
      result.matched[matchIdx] = { ...match, status: newStatus }
    } else if (action === 'manual_match') {
      result.matched.push({
        transaccionId,
        registroId,
        score: 100,
        scoreMonto: 100,
        scoreDescripcion: 100,
        scoreFecha: 100,
        status: 'confirmed',
      })
      result.unmatchedBank = result.unmatchedBank.filter((id) => id !== transaccionId)
      result.unmatchedCFDI = result.unmatchedCFDI.filter((id) => id !== registroId)
    } else {
      throw new MatchNotFoundError(`transacción ${transaccionId} / registro ${registroId}`)
    }

    await this.repo.saveSession(result)

    const log: CorrectionLog = {
      id: uuidv4(),
      sessionId,
      transaccionId,
      registroId,
      action,
      previousScore,
      reason,
      createdAt: new Date(),
    }
    await this.repo.saveCorrection(log)

    return result
  }
}
