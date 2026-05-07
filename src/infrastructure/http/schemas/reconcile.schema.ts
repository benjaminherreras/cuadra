import { z } from 'zod'

export const ConfirmMatchBodySchema = z.object({
  transaccionId: z.string().uuid(),
  registroId: z.string().uuid(),
  action: z.enum(['confirm', 'reject', 'manual_match']),
  reason: z.string().max(500).optional(),
})

export type ConfirmMatchBody = z.infer<typeof ConfirmMatchBodySchema>
