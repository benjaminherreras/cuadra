import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const [count, setCount] = useState(0)

  // Animate count from 0 to 94
  useEffect(() => {
    let frame: number
    let start: number | null = null
    const duration = 2000
    const target = 94

    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(step)
    }, 800)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 })

      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 60, skewY: 3 },
        { opacity: 1, y: 0, skewY: 0, duration: 1.1, ease: 'power3.out' }
      )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          '-=0.6'
        )
        .fromTo(
          counterRef.current,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo(
          barRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 1.2, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.4'
        )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[100dvh] bg-paper grid-texture overflow-hidden flex flex-col justify-center pt-24 pb-16"
    >
      {/* Horizontal accent bars */}
      <div className="absolute top-0 left-0 right-0 h-px bg-black/10" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-black/10" />

      {/* Signal Red bar — dramatic vertical accent */}
      <div
        ref={barRef}
        className="absolute left-0 bottom-0 h-1 bg-signal"
        style={{ width: '100%' }}
      />

      {/* Corner labels — brutalist detail */}
      <div className="absolute top-8 left-8 font-mono text-xs text-black/30 tracking-widest uppercase">
        v2.0 · 2026
      </div>
      <div className="absolute top-8 right-8 font-mono text-xs text-black/30 tracking-widest uppercase">
        MX · SAT-AWARE
      </div>
      <div className="absolute bottom-8 left-8 font-mono text-xs text-black/30 tracking-widest uppercase">
        BBVA · BANORTE · SANTANDER · HSBC
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4 items-end">

          {/* Title block — spans most columns */}
          <div className="col-span-12 lg:col-span-10">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-signal" />
              <span className="font-mono text-xs tracking-[0.2em] text-black/50 uppercase">
                Conciliación bancaria · México
              </span>
            </div>

            {/* CUADRA — massive title */}
            <h1
              ref={titleRef}
              className="font-grotesk font-black text-[clamp(5rem,18vw,16rem)] leading-none tracking-tighter text-black uppercase"
              style={{ opacity: 0 }}
            >
              CUADRA
            </h1>

            {/* Subline in DM Serif italic */}
            <p
              ref={subRef}
              className="font-serif italic text-[clamp(1.25rem,3vw,2.5rem)] text-black/60 mt-4 leading-tight"
              style={{ opacity: 0 }}
            >
              Lo que tardabas días, ahora en minutos.
            </p>
          </div>

          {/* Side counter — right column */}
          <div className="col-span-12 lg:col-span-2 lg:pb-4">
            <div
              ref={counterRef}
              className="font-mono text-right lg:text-right"
              style={{ opacity: 0 }}
            >
              <div className="text-xs text-black/40 uppercase tracking-widest mb-1">Match rate</div>
              <div className="text-[clamp(3rem,8vw,5rem)] font-bold text-signal leading-none tabular-nums">
                {count}
                <span className="text-[0.5em]">%</span>
              </div>
              <div className="text-xs text-black/30 mt-1">promedio histórico</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-black/10" />

        {/* Bottom row: tagline + CTA */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
          style={{ opacity: 0 }}
          id="hero-cta"
        >
          <div className="max-w-lg">
            <p className="font-grotesk text-base text-black/70 leading-relaxed">
              El único motor de conciliación bancaria que lee retenciones ISR/IVA
              directo del XML CFDI. Preciso desde el primer día.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={scrollToFeatures}
              className="btn-magnetic rounded-[2rem] px-8 py-4 bg-black text-white font-grotesk font-bold text-base"
            >
              <span className="btn-layer bg-signal" />
              <span className="relative z-10">Empieza a conciliar</span>
            </button>

            <div className="font-mono text-xs text-black/40 leading-snug">
              <div>Sin tarjeta.</div>
              <div>Sin compromisos.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <div className="w-px h-8 bg-black overflow-hidden">
          <div className="w-full bg-signal" style={{ height: '50%', animation: 'scan-line 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  )
}
