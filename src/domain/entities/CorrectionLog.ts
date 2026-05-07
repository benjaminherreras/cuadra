export type CorrectionAction = 'confirm' | 'reject' | 'manual_match'

export interface CorrectionLog {
  id: string
  sessionId: string
  transaccionId: string
  registroId: string
  action: CorrectionAction
  previousScore: number
  reason?: string
  createdAt: Date
}
