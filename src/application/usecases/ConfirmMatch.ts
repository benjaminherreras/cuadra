import { CorrectionEngine } from '../../core/learning/CorrectionEngine.js'
import type { IConciliacionRepository } from '../../domain/interfaces/IConciliacionRepository.js'
import type { ConciliacionResult } from '../../domain/entities/ConciliacionResult.js'
import type { CorrectionAction } from '../../domain/entities/CorrectionLog.js'

export interface ConfirmMatchInput {
  sessionId: string
  transaccionId: string
  registroId: string
  action: CorrectionAction
  reason?: string
}

export class ConfirmMatch {
  private readonly engine: CorrectionEngine

  constructor(repo: IConciliacionRepository) {
    this.engine = new CorrectionEngine(repo)
  }

  async execute(input: ConfirmMatchInput): Promise<ConciliacionResult> {
    return this.engine.applyCorrection(
      input.sessionId,
      input.transaccionId,
      input.registroId,
      input.action,
      input.reason,
    )
  }
}
