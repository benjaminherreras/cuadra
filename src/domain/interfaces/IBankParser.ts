import type { TransaccionBancaria } from '../entities/TransaccionBancaria.js'

export interface IBankParser {
  readonly banco: string
  parse(fileContent: Buffer, sessionId: string): Promise<TransaccionBancaria[]>
  canParse(fileContent: Buffer): boolean
}
