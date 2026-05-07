import { v4 as uuidv4 } from 'uuid'
import type { Request, Response, NextFunction } from 'express'
import { createRequestLogger } from '../../../shared/logger/index.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string
      log: ReturnType<typeof createRequestLogger>
    }
  }
}

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4()
  req.requestId = requestId
  req.log = createRequestLogger(requestId)

  const start = Date.now()
  req.log.info({ method: req.method, url: req.url, ip: req.ip }, 'request received')

  res.on('finish', () => {
    const ms = Date.now() - start
    req.log.info(
      { method: req.method, url: req.url, status: res.statusCode, duration_ms: ms },
      'request completed',
    )
  })

  next()
}
