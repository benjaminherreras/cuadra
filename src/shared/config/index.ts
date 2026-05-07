import 'dotenv/config'
import { z } from 'zod'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  SQLITE_PATH: z.string().default('./cuadra.db'),
  API_KEY_TEST: z.string().min(1, 'API_KEY_TEST es requerida'),
})

function loadConfig(): z.infer<typeof configSchema> {
  const result = configSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')
    throw new Error(`Configuración de entorno inválida:\n${errors}`)
  }
  return result.data
}

export const config = loadConfig()
