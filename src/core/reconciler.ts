import { calculatePairScore, MATCH_THRESHOLD } from './matcher/ScoreCalculator.js'
import { v4 as uuidv4 } from 'uuid'
import type { TransaccionBancaria } from '../domain/entities/TransaccionBancaria.js'
import type { RegistroContable } from '../domain/entities/RegistroContable.js'
import type {
  ConciliacionResult,
  MatchedItem,
  UnmatchedBankItem,
  UnmatchedCFDIItem,
} from '../domain/entities/ConciliacionResult.js'

export function reconcile(
  sessionId: string,
  banco: string,
  transacciones: TransaccionBancaria[],
  registros: RegistroContable[],
): ConciliacionResult {
  const allPairs = []
  for (const t of transacciones) {
    for (const r of registros) {
      allPairs.push(calculatePairScore(t, r))
    }
  }

  allPairs.sort((a, b) => b.score - a.score)

  const usedTransacciones = new Set<string>()
  const usedRegistros = new Set<string>()
  const matched: MatchedItem[] = []

  for (const pair of allPairs) {
    if (pair.score < MATCH_THRESHOLD) break
    if (usedTransacciones.has(pair.transaccionId)) continue
    if (usedRegistros.has(pair.registroId)) continue

    const t = transacciones.find((tx) => tx.id === pair.transaccionId)
    const r = registros.find((re) => re.id === pair.registroId)

    matched.push({
      transaccionId: pair.transaccionId,
      registroId: pair.registroId,
      score: pair.score,
      scoreMonto: pair.scoreMonto,
      scoreDescripcion: pair.scoreDescripcion,
      scoreFecha: pair.scoreFecha,
      status: 'matched',
      bankDescripcion: t?.descripcion,
      bankMonto: t ? Math.abs(t.monto) : undefined,
      cfdiEmisorNombre: r?.emisorNombre,
      cfdiTotal: r?.total,
      cfdiMontoEsperado: r?.montoEsperadoDeposito,
      cfdiUuid: r?.uuid,
    })

    usedTransacciones.add(pair.transaccionId)
    usedRegistros.add(pair.registroId)
  }

  const unmatchedBankTxs = transacciones.filter((t) => !usedTransacciones.has(t.id))
  const unmatchedCFDIRegs = registros.filter((r) => !usedRegistros.has(r.id))

  const unmatchedBank = unmatchedBankTxs.map((t) => t.id)
  const unmatchedCFDI = unmatchedCFDIRegs.map((r) => r.id)

  const unmatchedBankDetail: UnmatchedBankItem[] = unmatchedBankTxs.map((t) => ({
    id: t.id,
    descripcion: t.descripcion,
    monto: Math.abs(t.monto),
    fecha: t.fecha.toISOString().split('T')[0] ?? '',
    referencia: t.referencia,
  }))

  const unmatchedCFDIDetail: UnmatchedCFDIItem[] = unmatchedCFDIRegs.map((r) => ({
    id: r.id,
    emisorNombre: r.emisorNombre,
    emisorRfc: r.emisorRfc,
    total: r.total,
    montoEsperado: r.montoEsperadoDeposito,
    uuid: r.uuid,
    fecha: r.fecha.toISOString().split('T')[0] ?? '',
  }))

  const totalMontoConciliado = matched.reduce((sum, m) => sum + (m.bankMonto ?? 0), 0)
  const totalMontoSinConciliar = unmatchedBankTxs.reduce((sum, t) => sum + Math.abs(t.monto), 0)
  const matchRate =
    transacciones.length > 0 ? Math.round((matched.length / transacciones.length) * 100) : 0

  return {
    sessionId: sessionId || uuidv4(),
    banco,
    totalTransacciones: transacciones.length,
    totalRegistros: registros.length,
    matched,
    unmatchedBank,
    unmatchedCFDI,
    unmatchedBankDetail,
    unmatchedCFDIDetail,
    summary: {
      matchRate,
      totalMontoConciliado: Math.round(totalMontoConciliado * 100) / 100,
      totalMontoSinConciliar: Math.round(totalMontoSinConciliar * 100) / 100,
    },
    processedAt: new Date(),
  }
}
