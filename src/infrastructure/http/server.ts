import 'dotenv/config'
import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import { config } from '../../shared/config/index.js'
import { logger } from '../../shared/logger/index.js'
import { loggerMiddleware } from './middlewares/logger.js'
import { reconcileRouter } from './routes/reconcile.js'

const app: Express = express()

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.sendStatus(204); return }
  next()
})

app.use(express.json())
app.use(loggerMiddleware)
app.use(reconcileRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

if (process.env['NODE_ENV'] !== 'test') {
  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'Cuadra server started')
  })
}

export { app }
