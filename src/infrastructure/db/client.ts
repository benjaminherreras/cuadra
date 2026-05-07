import { createRequire } from 'module'
import { CREATE_TABLES_SQL } from './schema.js'
import { config } from '../../shared/config/index.js'
import { logger } from '../../shared/logger/index.js'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BetterSqlite3 = require('better-sqlite3') as any
type Database = import('better-sqlite3').Database

let _db: Database | null = null

export function getDb(): Database {
  if (!_db) {
    _db = new BetterSqlite3(config.SQLITE_PATH) as Database
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    _db.exec(CREATE_TABLES_SQL)
    logger.info({ path: config.SQLITE_PATH }, 'SQLite database initialized')
  }
  return _db
}

export function closeDb(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}
