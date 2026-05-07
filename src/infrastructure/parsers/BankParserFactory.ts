import { BancoNoSoportadoError } from '../../domain/errors/DomainErrors.js'
import type { IBankParser } from '../../domain/interfaces/IBankParser.js'

// ── CSV parsers ────────────────────────────────────────────────────────────────
import { BBVAParser } from './banks/BBVAParser.js'
import { BanorteParser } from './banks/BanorteParser.js'
import { SantanderParser } from './banks/SantanderParser.js'
import { HSBCParser } from './banks/HSBCParser.js'
import { CitibanamexParser } from './banks/CitibanamexParser.js'
import { ScotiabankParser } from './banks/ScotiabankParser.js'
import { InbursaParser } from './banks/InbursaParser.js'
import { BanBajioParser } from './banks/BanBajioParser.js'
import { AfirmeParser } from './banks/AfirmeParser.js'
import { MultivaParser } from './banks/MultivaParser.js'
import { MifelParser } from './banks/MifelParser.js'

// ── PDF parsers ────────────────────────────────────────────────────────────────
import { BBVAPDFParser } from './banks/BBVAPDFParser.js'
import { BanortePDFParser } from './banks/BanortePDFParser.js'
import { SantanderPDFParser } from './banks/SantanderPDFParser.js'
import { HSBCPDFParser } from './banks/HSBCPDFParser.js'
import { CitibanamexPDFParser } from './banks/CitibanamexPDFParser.js'
import { ScotiabankPDFParser } from './banks/ScotiabankPDFParser.js'
import { InbursaPDFParser } from './banks/InbursaPDFParser.js'
import { BanBajioPDFParser } from './banks/BanBajioPDFParser.js'
import { AfirmePDFParser } from './banks/AfirmePDFParser.js'
import { MultivaPDFParser } from './banks/MultivaPDFParser.js'
import { MifelPDFParser } from './banks/MifelPDFParser.js'

/**
 * To add a new bank:
 *   1. src/infrastructure/parsers/banks/<BANK>PDFParser.ts  — extend BasePDFParser
 *   2. src/infrastructure/parsers/banks/<BANK>Parser.ts     — implement IBankParser (CSV)
 *   3. Import both here, add to PARSERS (PDF before CSV), add name to SUPPORTED_BANCOS.
 *   4. Add the bank label to frontend/src/pages/Reconcile.tsx → BANCOS array.
 *
 * PDF parsers are listed before their CSV counterparts so canParse() resolves
 * PDFs first — the first parser whose canParse() returns true wins.
 */
const PARSERS: IBankParser[] = [
  // PDF parsers (priority)
  new BanortePDFParser(),
  new BBVAPDFParser(),
  new SantanderPDFParser(),
  new HSBCPDFParser(),
  new CitibanamexPDFParser(),
  new ScotiabankPDFParser(),
  new InbursaPDFParser(),
  new BanBajioPDFParser(),
  new AfirmePDFParser(),
  new MultivaPDFParser(),
  new MifelPDFParser(),
  // CSV parsers (fallback)
  new BBVAParser(),
  new BanorteParser(),
  new SantanderParser(),
  new HSBCParser(),
  new CitibanamexParser(),
  new ScotiabankParser(),
  new InbursaParser(),
  new BanBajioParser(),
  new AfirmeParser(),
  new MultivaParser(),
  new MifelParser(),
]

export const SUPPORTED_BANCOS = [
  'BBVA', 'BANORTE', 'SANTANDER', 'HSBC',
  'CITIBANAMEX', 'SCOTIABANK', 'INBURSA', 'BANBAJIO',
  'AFIRME', 'MULTIVA', 'MIFEL',
]

export function getParserForBanco(banco: string, fileContent: Buffer): IBankParser {
  const upper = banco.toUpperCase()
  const candidates = PARSERS.filter((p) => p.banco.toUpperCase() === upper)
  if (candidates.length === 0) throw new BancoNoSoportadoError(banco)
  return candidates.find((p) => p.canParse(fileContent)) ?? candidates[0]!
}

export function autoDetectParser(fileContent: Buffer): IBankParser {
  const parser = PARSERS.find((p) => p.canParse(fileContent))
  if (!parser) throw new BancoNoSoportadoError('auto-detect failed — ningún parser reconoce el formato')
  return parser
}
