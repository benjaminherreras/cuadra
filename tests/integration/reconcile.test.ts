import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.env['NODE_ENV'] = 'test'
process.env['API_KEY_TEST'] = 'test-key'
process.env['SQLITE_PATH'] = ':memory:'

const { app } = await import('../../src/infrastructure/http/server.js')

const cfdiGoodPath = resolve(__dirname, '../fixtures/cfdis/cfdi_caso_bueno.xml')
const cfdiPath = (name: string): string => resolve(__dirname, `../fixtures/cfdis/${name}`)
const csvPath = (name: string): string => resolve(__dirname, `../fixtures/csvs/${name}`)

function cfdi(): Buffer {
  return Buffer.from(readFileSync(cfdiGoodPath, 'utf-8'))
}

describe('GET /health', () => {
  it('returns ok and lists all 4 banks', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.supported_bancos).toContain('BBVA')
    expect(res.body.supported_bancos).toContain('BANORTE')
    expect(res.body.supported_bancos).toContain('SANTANDER')
    expect(res.body.supported_bancos).toContain('HSBC')
  })
})

describe('POST /v1/reconcile — BBVA', () => {
  it('reconciles BBVA CSV with one CFDI', async () => {
    const res = await request(app)
      .post('/v1/reconcile')
      .field('banco', 'BBVA')
      .attach('bank_csv', Buffer.from(readFileSync(csvPath('bbva_sample.csv'), 'utf-8')), 'bbva.csv')
      .attach('cfdis', cfdi(), 'cfdi.xml')

    expect(res.status).toBe(200)
    expect(res.body.sessionId).toBeDefined()
    expect(res.body.totalTransacciones).toBe(3)
    expect(res.body.totalRegistros).toBe(1)
    expect(res.body.summary.matchRate).toBeGreaterThan(0)
  })
})

describe('POST /v1/reconcile — BANORTE', () => {
  it('reconciles Banorte CSV with one CFDI', async () => {
    const res = await request(app)
      .post('/v1/reconcile')
      .field('banco', 'BANORTE')
      .attach('bank_csv', Buffer.from(readFileSync(csvPath('banorte_sample.csv'), 'utf-8')), 'banorte.csv')
      .attach('cfdis', cfdi(), 'cfdi.xml')

    expect(res.status).toBe(200)
    expect(res.body.totalTransacciones).toBe(3)
    expect(res.body.totalRegistros).toBe(1)
    expect(res.body.banco).toBe('BANORTE')
    expect(res.body.summary.matchRate).toBeGreaterThan(0)
  })
})

describe('POST /v1/reconcile — SANTANDER', () => {
  it('reconciles Santander CSV with one CFDI', async () => {
    const res = await request(app)
      .post('/v1/reconcile')
      .field('banco', 'SANTANDER')
      .attach('bank_csv', Buffer.from(readFileSync(csvPath('santander_sample.csv'), 'utf-8')), 'santander.csv')
      .attach('cfdis', cfdi(), 'cfdi.xml')

    expect(res.status).toBe(200)
    expect(res.body.totalTransacciones).toBe(3)
    expect(res.body.totalRegistros).toBe(1)
    expect(res.body.banco).toBe('SANTANDER')
    expect(res.body.summary.matchRate).toBeGreaterThan(0)
  })
})

describe('POST /v1/reconcile — HSBC', () => {
  it('reconciles HSBC CSV with one CFDI', async () => {
    const res = await request(app)
      .post('/v1/reconcile')
      .field('banco', 'HSBC')
      .attach('bank_csv', Buffer.from(readFileSync(csvPath('hsbc_sample.csv'), 'utf-8')), 'hsbc.csv')
      .attach('cfdis', cfdi(), 'cfdi.xml')

    expect(res.status).toBe(200)
    expect(res.body.totalTransacciones).toBe(3)
    expect(res.body.totalRegistros).toBe(1)
    expect(res.body.banco).toBe('HSBC')
    expect(res.body.summary.matchRate).toBeGreaterThan(0)
  })
})

describe('POST /v1/reconcile — errores', () => {
  it('returns 400 when bank_csv is missing', async () => {
    const res = await request(app)
      .post('/v1/reconcile')
      .field('banco', 'BBVA')
      .attach('cfdis', cfdi(), 'cfdi.xml')
    expect(res.status).toBe(400)
  })

  it('returns 400 for banco no soportado', async () => {
    const res = await request(app)
      .post('/v1/reconcile')
      .field('banco', 'BANCOCHINO')
      .attach('bank_csv', Buffer.from('Fecha,Descripcion,Cargo,Abono\n2026-01-01,test,0,100'), 'test.csv')
      .attach('cfdis', cfdi(), 'cfdi.xml')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('E3_BANCO_NO_SOPORTADO')
  })
})
