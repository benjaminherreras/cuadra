import { textSimilarity } from './LevenshteinMatcher.js'
import { amountScore } from './AmountMatcher.js'
import type { TransaccionBancaria } from '../../domain/entities/TransaccionBancaria.js'
import type { RegistroContable } from '../../domain/entities/RegistroContable.js'

const WEIGHT_MONTO = 0.50
const WEIGHT_DESCRIPCION = 0.30
const WEIGHT_FECHA = 0.20

export const MATCH_THRESHOLD = 60

function fechaScore(t: Date, r: Date): number {
  const diffDays = Math.abs(t.getTime() - r.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays <= 0.5) return 100
  if (diffDays <= 1) return 90
  if (diffDays <= 3) return 70
  if (diffDays <= 7) return 40
  return 20
}

export interface PairScore {
  transaccionId: string
  registroId: string
  score: number
  scoreMonto: number
  scoreDescripcion: number
  scoreFecha: number
}

export function calculatePairScore(
  transaccion: TransaccionBancaria,
  registro: RegistroContable,
): PairScore {
  const scoreMonto = amountScore(transaccion.monto, registro.montoEsperadoDeposito)
  const scoreDescripcion = textSimilarity(transaccion.descripcion, registro.emisorNombre)
  const scoreFecha = fechaScore(transaccion.fecha, registro.fecha)

  const score = Math.round(
    scoreMonto * WEIGHT_MONTO +
    scoreDescripcion * WEIGHT_DESCRIPCION +
    scoreFecha * WEIGHT_FECHA,
  )

  return { transaccionId: transaccion.id, registroId: registro.id, score, scoreMonto, scoreDescripcion, scoreFecha }
}
