import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Card 1: Animated progress bar
function ProgressCard() {
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let frame: number
    let start: number | null = null
    const duration = 2200

    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 2.5)
      setProgress(Math.round(eased * 94))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [started])

  const rows = [
    { label: 'SPEI AMAZON', amount: '$45,600', matched: true },
    { label: 'NÓMINA RRHH', amount: '$128,450', matched: true },
    { label: 'CLOUD SERVICES', amount: '$9,533', matched: true },
    { label: 'CARGO VARIOS', amount: '$3,420', matched: false },
  ]

  return (
    <div ref={cardRef} className="space-y-5">
      {/* Match rate bar */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Progreso</span>
          <span className="font-mono text-2xl font-bold text-signal tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-signal rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Mini transaction list */}
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${row.matched && progress > i * 25 ? 'bg-green-400' : 'bg-white/20'}`}
                style={{
                  transition: 'background-color 0.3s ease',
                }}
              />
              <span className="font-mono text-xs text-white/60">{row.label}</span>
            </div>
            <span className="font-mono text-xs text-white/80">{row.amount}</span>
          </div>
        ))}
      </div>

      <div className="font-mono text-xs text-white/30">
        142 movimientos · procesando...
      </div>
    </div>
  )
}

// Card 2: CFDI XML snippet
function CfdiCard() {
  return (
    <div className="space-y-4">
      <div className="bg-black/40 rounded-2xl p-4 font-mono text-xs leading-relaxed border border-white/5">
        <div className="text-white/30">&lt;Comprobante ...&gt;</div>
        <div className="text-white/30 pl-2">&lt;Conceptos&gt;</div>
        <div className="text-white/50 pl-4">&lt;Concepto Importe=&quot;11,000.00&quot;&gt;</div>
        <div className="text-white/30 pl-6">&lt;Impuestos&gt;</div>
        <div className="pl-8">
          <span className="text-white/30">&lt;Retencion Impuesto=&quot;ISR&quot; Importe=&quot;</span>
          <span className="text-signal font-bold">1,100.00</span>
          <span className="text-white/30">&quot;/&gt;</span>
        </div>
        <div className="pl-8">
          <span className="text-white/30">&lt;Retencion Impuesto=&quot;IVA&quot; Importe=&quot;</span>
          <span className="text-signal font-bold">366.67</span>
          <span className="text-white/30">&quot;/&gt;</span>
        </div>
        <div className="text-white/30 pl-6">&lt;/Impuestos&gt;</div>
        <div className="text-white/30 pl-4">&lt;/Concepto&gt;</div>
        <div className="text-white/30 pl-2">&lt;/Conceptos&gt;</div>
        <div className="text-white/30">&lt;/Comprobante&gt;</div>
      </div>

      {/* Arrow + result */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-signal/40" />
        <div className="text-signal text-lg">→</div>
        <div className="flex-1 h-px bg-signal/40" />
      </div>

      <div className="bg-signal/10 border border-signal/30 rounded-2xl px-4 py-3 flex justify-between items-center">
        <span className="font-grotesk text-sm text-white/60">Depósito esperado</span>
        <span className="font-mono text-lg font-bold text-signal">$9,533.33</span>
      </div>

      <div className="font-mono text-xs text-white/30">
        ISR 10% + IVA 16% → retención calculada
      </div>
    </div>
  )
}

// Card 3: Score improving chart
function ScoreCard() {
  const [tick, setTick] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const sessions = [
    { label: 'Ses. 1', score: 71 },
    { label: 'Ses. 2', score: 78 },
    { label: 'Ses. 3', score: 83 },
    { label: 'Ses. 4', score: 89 },
    { label: 'Ses. 5', score: 94 },
  ]

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const interval = setInterval(() => {
            setTick((t) => {
              if (t >= sessions.length - 1) {
                clearInterval(interval)
                return t
              }
              return t + 1
            })
          }, 400)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [sessions.length])

  const maxScore = 100
  const chartHeight = 80

  return (
    <div ref={cardRef} className="space-y-4">
      {/* Chart */}
      <div className="flex items-end gap-2 h-24">
        {sessions.map((s, i) => {
          const visible = i <= tick
          const barH = (s.score / maxScore) * chartHeight
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="font-mono text-xs text-white/0 transition-colors duration-300"
                style={{ color: visible ? (i === tick ? '#E63B2E' : 'rgba(255,255,255,0.4)') : 'transparent' }}
              >
                {s.score}
              </div>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: visible ? `${barH}px` : '4px',
                  backgroundColor: i === tick ? '#E63B2E' : 'rgba(255,255,255,0.15)',
                  transitionDelay: `${i * 80}ms`,
                }}
              />
              <div className="font-mono text-[9px] text-white/30">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Current score callout */}
      <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
        <div>
          <div className="font-mono text-xs text-white/40 uppercase tracking-widest">Precisión actual</div>
          <div className="font-mono text-4xl font-bold text-signal mt-1 tabular-nums">
            {sessions[tick]?.score ?? 71}
            <span className="text-lg">%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-green-400">↑ +{(sessions[tick]?.score ?? 71) - sessions[0].score}pts</div>
          <div className="font-mono text-xs text-white/30">desde sesión 1</div>
        </div>
      </div>
    </div>
  )
}

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('.feature-card')
      if (!cards) return

      gsap.fromTo(
        cards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const features = [
    {
      number: '01',
      title: 'Cierra en minutos',
      description: 'Un mes de movimientos conciliados automáticamente.',
      component: <ProgressCard />,
    },
    {
      number: '02',
      title: 'SAT-aware nativo',
      description: 'El único motor que lee retenciones ISR/IVA directo del XML CFDI para calcular el depósito exacto.',
      component: <CfdiCard />,
    },
    {
      number: '03',
      title: 'Aprende contigo',
      description: 'Cada corrección afina el motor. Cuadra se vuelve más preciso con cada sesión.',
      component: <ScoreCard />,
    },
  ]

  return (
    <section
      ref={sectionRef}
      id="features"
      className="bg-dark py-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-start justify-between mb-16 flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-signal" />
              <span className="font-mono text-xs tracking-[0.2em] text-white/30 uppercase">
                Funcionalidades
              </span>
            </div>
            <h2 className="font-grotesk font-black text-5xl md:text-6xl text-white leading-none">
              Por qué<br />
              <span className="text-signal">Cuadra.</span>
            </h2>
          </div>
          <p className="font-grotesk text-base text-white/50 max-w-xs leading-relaxed self-end">
            Construido específicamente para el ecosistema fiscal mexicano.
            Sin compromisos.
          </p>
        </div>

        {/* Cards grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feat) => (
            <div
              key={feat.number}
              className="feature-card bg-black rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5 hover:border-signal/30 transition-colors duration-300"
              style={{ opacity: 0 }}
            >
              {/* Card header */}
              <div>
                <div className="font-mono text-xs text-signal mb-3 tracking-widest">{feat.number}</div>
                <h3 className="font-grotesk font-bold text-xl text-white mb-2">{feat.title}</h3>
                <p className="font-grotesk text-sm text-white/50 leading-relaxed">{feat.description}</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Micro-UI */}
              <div className="flex-1">
                {feat.component}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
