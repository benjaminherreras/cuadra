import { v4 as uuidv4 } from 'uuid'
import { reconcile } from '../../core/reconciler.js'
import { parseCFDIToRegistro } from '../../infrastructure/parsers/CFDIParser.js'
import { getParserForBanco } from '../../infrastructure/parsers/BankParserFactory.js'
import type { IConciliacionRepository } from '../../domain/interfaces/IConciliacionRepository.js'
import type { IFiscalStrategy } from '../../domain/interfaces/IFiscalStrategy.js'
import type { ConciliacionResult } from '../../domain/entities/ConciliacionResult.js'

export interface ReconcileInput {
  banco: string
  bankFile: Buffer
  xmlFiles: string[]
}

export class ReconcileStatement {
  constructor(
    private readonly repo: IConciliacionRepository,
    private readonly fiscalStrategy: IFiscalStrategy,
  ) {}

  async execute(input: ReconcileInput): Promise<ConciliacionResult> {
    const sessionId = uuidv4()
    const parser = getParserForBanco(input.banco, input.bankFile)
    const transacciones = await parser.parse(input.bankFile, sessionId)
    const registros = input.xmlFiles.map((xml) =>
      parseCFDIToRegistro(xml, sessionId, this.fiscalStrategy),
    )

    const result = reconcile(sessionId, input.banco, transacciones, registros)
    await this.repo.saveSession(result)
    return result
  }
}
