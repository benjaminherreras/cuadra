export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  banco TEXT NOT NULL,
  total_transacciones INTEGER NOT NULL,
  total_registros INTEGER NOT NULL,
  match_rate REAL NOT NULL,
  total_monto_conciliado REAL NOT NULL,
  total_monto_sin_conciliar REAL NOT NULL,
  result_json TEXT NOT NULL,
  processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  fecha TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  monto REAL NOT NULL,
  referencia TEXT,
  banco TEXT NOT NULL,
  raw_line TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS registros (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  uuid TEXT NOT NULL,
  fecha TEXT NOT NULL,
  emisor_rfc TEXT NOT NULL,
  emisor_nombre TEXT NOT NULL,
  receptor_rfc TEXT NOT NULL,
  subtotal REAL NOT NULL,
  iva_traslado REAL NOT NULL,
  iva_retenido REAL NOT NULL,
  isr_retenido REAL NOT NULL,
  total REAL NOT NULL,
  monto_esperado_deposito REAL NOT NULL,
  tipo_de_comprobante TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS corrections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  transaccion_id TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_score REAL NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_session ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_registros_session ON registros(session_id);
CREATE INDEX IF NOT EXISTS idx_corrections_session ON corrections(session_id);
`
