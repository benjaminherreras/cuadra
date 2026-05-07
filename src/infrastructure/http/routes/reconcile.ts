import { Router, type IRouter } from 'express'
import multer from 'multer'
import { ReconcileStatement } from '../../../application/usecases/ReconcileStatement.js'
import { ConfirmMatch } from '../../../application/usecases/ConfirmMatch.js'
import { SQLiteConciliacionRepository } from '../../repositories/SQLiteConciliacionRepository.js'
import { MexicoFiscalStrategy } from '../../fiscal/MexicoFiscalStrategy.js'
import { ConfirmMatchBodySchema } from '../schemas/reconcile.schema.js'
import { DomainError } from '../../../domain/errors/DomainErrors.js'
import { SUPPORTED_BANCOS } from '../../parsers/BankParserFactory.js'

const router: IRouter = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/pdf', 'text/xml', 'application/xml', 'text/plain', 'application/octet-stream']
    cb(null, allowed.includes(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.xml'))
  },
})

const repo = new SQLiteConciliacionRepository()
const fiscalStrategy = new MexicoFiscalStrategy()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0', supported_bancos: SUPPORTED_BANCOS })
})

router.get('/v1/sessions', async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query as Record<string, string>)['limit'] ?? '50'), 200)
    const sessions = await repo.getSessions(limit)
    res.json({ sessions, total: sessions.length })
  } catch (err) {
    req.log?.error({ err }, 'error fetching sessions')
    res.status(500).json({ error: 'Error interno', code: 'E6_INTERNAL' })
  }
})

router.get('/v1/sessions/:sessionId', async (req, res) => {
  try {
    const result = await repo.getSession(req.params.sessionId ?? '')
    if (!result) {
      res.status(404).json({ error: 'Sesión no encontrada', code: 'E4_SESSION_NOT_FOUND' })
      return
    }
    res.json(result)
  } catch (err) {
    req.log?.error({ err }, 'error fetching session')
    res.status(500).json({ error: 'Error interno', code: 'E6_INTERNAL' })
  }
})

router.post(
  '/v1/reconcile',
  upload.fields([
    { name: 'bank_csv', maxCount: 1 },
    { name: 'cfdis', maxCount: 100 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined
      const csvFiles = files?.['bank_csv']
      const cfdiFiles = files?.['cfdis']

      if (!csvFiles || csvFiles.length === 0) {
        res.status(400).json({ error: 'Se requiere bank_csv' })
        return
      }
      if (!cfdiFiles || cfdiFiles.length === 0) {
        res.status(400).json({ error: 'Se requiere al menos un CFDI en cfdis' })
        return
      }

      const banco = (req.body as { banco?: string }).banco?.toUpperCase()
      if (!banco) {
        res.status(400).json({ error: 'Se requiere el campo banco' })
        return
      }

      const bankFile = csvFiles[0]!.buffer
      const xmlFiles = cfdiFiles.map((f) => f.buffer.toString('utf-8'))

      const usecase = new ReconcileStatement(repo, fiscalStrategy)
      const result = await usecase.execute({ banco, bankFile, xmlFiles })

      req.log?.info({ sessionId: result.sessionId, matchRate: result.summary.matchRate }, 'reconciliation completed')
      res.json(result)
    } catch (err) {
      if (err instanceof DomainError) {
        res.status(err.httpStatus).json({ error: err.message, code: err.code })
        return
      }
      req.log?.error({ err }, 'unexpected error in reconcile')
      res.status(500).json({ error: 'Error interno', code: 'E6_INTERNAL' })
    }
  },
)

router.post('/v1/reconcile/:sessionId/confirm', async (req, res) => {
  try {
    const parsed = ConfirmMatchBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload inválido', details: parsed.error.flatten() })
      return
    }

    const usecase = new ConfirmMatch(repo)
    const result = await usecase.execute({
      sessionId: req.params.sessionId ?? '',
      ...parsed.data,
    })

    res.json({ ok: true, sessionId: result.sessionId })
  } catch (err) {
    if (err instanceof DomainError) {
      res.status(err.httpStatus).json({ error: err.message, code: err.code })
      return
    }
    req.log?.error({ err }, 'unexpected error in confirm')
    res.status(500).json({ error: 'Error interno', code: 'E6_INTERNAL' })
  }
})

export { router as reconcileRouter }
