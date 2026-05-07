import type { ConciliacionResult } from '../entities/ConciliacionResult.js'

export interface IModulePlugin {
  readonly name: string
  readonly version: string
  onAnalysisComplete?(result: ConciliacionResult): Promise<void>
}
