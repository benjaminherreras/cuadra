import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface BankCard {
  name: string
  accent: string
  accentText: string
  format: string
  csvRow: string
  description: string
  fields: string[]
}

const banks: BankCard[] = [
  {
    name: 'BBVA',
    accent: '#004481',
    accentText: '#5B9BD5',
    format: 'XLSX / CSV · Formato BBVA Empresas',
    csvRow: '30/04/2026,SPEI RECIBIDO AMAZON MX,45600.00,0.00,1847320.50,REF-7721-A',
    description: 'Compatible con exportación de BBVA Net Cash y BBVA Bancomer Empresas. Columnas de fecha, descripción, cargo, abono, saldo.',
    fields: ['Fecha', 'Descripción', 'Cargo', 'Abono', 'Saldo', 'Referencia'],
  },
  {
    name: 'Banorte',
    accent: '#8B0000',
    accentText: '#FF6B6B',
    format: 'CSV · Portal Banorte en Línea',
    csvRow: '28/04/2026,ABONO TRANSFERENCIA,210000.00,0.00,634910.00,BNR-2604-001',
    description: 'Soporte para extractos de Banorte en Línea Empresarial. Procesamiento automático de cargos por comisiones.',
    fields: ['Fecha Operación', 'Concepto', 'Depósitos', 'Retiros', 'Saldo', 'No. Referencia'],
  },
  {
    name: 'Santander',
    accent: '#CC0000',
    accentText: '#FF4444',
    format: 'XLSX / TXT · SuperNet Empresas',
    csvRow: '25/04/2026,DEPOSITO EFECTIVO,120000.00,0.00,298450.75,SAN-04-2026',
    description: 'Compatible con el formato de descarga de Santander SuperNet. Parseo inteligente de referencias cruzadas.',
    fields: ['Fecha', 'Movimiento', 'Crédito', 'Débito', 'Saldo Disponible', 'Clave Rastreo'],
  },
  {
    name: 'HSBC',
    accent: '#DB0011',
    accentText: '#FF8080',
    format: 'CSV · Business Banking HSBC',
    csvRow: '20/04/2026,PAGO INTERNACIONAL USD,95000.00,0.00,156230.00,HSB-INTL-0420',
    description: 'Soporte para transacciones en MXN y USD. Conversión automática con tipo de cambio registrado en el extracto.',
    fields: ['Value Date', 'Description', 'Credit Amount', 'Debit Amount', 'Balance', 'Transaction Ref'],
  },
]

const allBanks = [
  'BBVA', 'Banorte', 'Santander', 'HSBC',
  'Citibanamex', 'Scotiabank', 'Inbursa',
  'BanBajío', 'Afirme', 'Multiva', 'Mifel',
]

export default function Protocol() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsContainerRef.current?.querySelectorAll('.bank-card')
      if (!cards || cards.length === 0) return

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="protocol"
      className="bg-darker py-20"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs tracking-[0.2em] text-white/30 uppercase">
              Protocolo de bancos
            </span>
            <div className="w-8 h-px bg-signal" />
          </div>
          <h2 className="font-grotesk font-black text-5xl md:text-6xl text-white leading-none mb-4">
            11 bancos.<br />
            <span className="text-signal">Un solo flujo.</span>
          </h2>
          <p className="font-grotesk text-base text-white/40 max-w-md mx-auto">
            Conecta tu estado de cuenta bancario en el formato nativo de cada institución. Cuadra hace el resto.
          </p>
        </div>

        {/* Stacking cards */}
        <div ref={cardsContainerRef} className="flex flex-col gap-4 pb-32">
          {banks.map((bank, i) => (
            <div
              key={bank.name}
              className="bank-card rounded-[2.5rem] overflow-hidden border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${bank.accent}18 0%, #0D0D0D 60%)`,
                zIndex: i + 1,
                position: 'sticky',
                top: `${80 + i * 24}px`,
              }}
            >
              <div className="p-8 md:p-12 grid md:grid-cols-2 gap-10 items-start">
                {/* Left: Bank info */}
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <h3
                      className="font-grotesk font-black text-6xl md:text-8xl tracking-tighter leading-none"
                      style={{ color: bank.accentText }}
                    >
                      {bank.name}
                    </h3>
                    <div
                      className="w-3 h-3 rounded-full mt-2 shrink-0"
                      style={{ background: bank.accentText }}
                    />
                  </div>

                  <div className="font-mono text-xs text-white/40 mb-6 uppercase tracking-wider">
                    {bank.format}
                  </div>

                  <p className="font-grotesk text-sm text-white/60 leading-relaxed mb-6 max-w-sm">
                    {bank.description}
                  </p>

                  {/* Field tags */}
                  <div className="flex flex-wrap gap-2">
                    {bank.fields.map((field) => (
                      <span
                        key={field}
                        className="font-mono text-[10px] px-3 py-1 rounded-full border border-white/10 text-white/30"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: CSV snippet */}
                <div>
                  <div className="font-mono text-xs text-white/20 mb-3 uppercase tracking-widest">
                    Ejemplo de fila CSV
                  </div>
                  <div className="bg-black/60 rounded-2xl p-5 border border-white/5">
                    <div className="font-mono text-[10px] text-white/25 mb-2 pb-2 border-b border-white/8">
                      {bank.fields.join(' · ')}
                    </div>
                    <div
                      className="font-mono text-xs leading-relaxed break-all"
                      style={{ color: bank.accentText }}
                    >
                      {bank.csvRow}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: bank.accentText, boxShadow: `0 0 8px ${bank.accentText}` }}
                    />
                    <span className="font-mono text-xs text-white/30">Formato verificado · Compatible</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee — full width, all banks */}
      <div className="w-full border-y border-white/8 py-5 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #0D0D12, transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #0D0D12, transparent)' }} />
        <div className="flex gap-0 animate-marquee">
          {[...Array(3)].map((_, set) => (
            <div key={set} className="flex items-center gap-0 shrink-0">
              {allBanks.map((name) => (
                <div key={name} className="flex items-center">
                  <span className="font-mono text-sm font-medium tracking-widest uppercase text-white/50 px-8 whitespace-nowrap hover:text-white/80 transition-colors duration-300">
                    {name}
                  </span>
                  <span className="text-signal/40 text-xs">◆</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
