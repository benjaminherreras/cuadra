import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftRef.current,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            once: true,
          },
        }
      )
      gsap.fromTo(
        rightRef.current,
        { opacity: 0, x: 40 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            once: true,
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="philosophy"
      className="relative bg-black py-28 px-6 overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Noise layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto relative">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-20">
          <div className="w-8 h-px bg-signal" />
          <span className="font-mono text-xs tracking-[0.2em] text-white/30 uppercase">
            Filosofía
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: El problema */}
          <div ref={leftRef} style={{ opacity: 0 }}>
            <div className="inline-block font-mono text-xs text-signal/60 tracking-widest uppercase mb-6 border border-signal/20 px-3 py-1 rounded-full">
              El problema
            </div>

            <h2 className="font-serif italic text-[clamp(2rem,4vw,3.5rem)] text-white/80 leading-tight mb-8">
              La conciliación manual<br />es un impuesto invisible.
            </h2>

            <div className="space-y-5">
              {[
                'Contador exporta estado de cuenta a Excel.',
                'Descarga CFDIs del portal SAT uno por uno.',
                'Compara filas manualmente — miles de ellas.',
                'Calcula retenciones ISR/IVA con fórmulas frágiles.',
                'Encuentra diferencias horas después, a veces días.',
                'Repite cada mes, sin aprender del mes anterior.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-mono text-[10px] text-white/30">{i + 1}</span>
                  </div>
                  <p className="font-grotesk text-base text-white/50 leading-snug">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-white/3 border border-white/8 rounded-2xl">
              <p className="font-mono text-xs text-white/30 leading-relaxed">
                Resultado promedio: <span className="text-signal">3–5 días</span> por cierre mensual.<br />
                Error humano: frecuente. Retrabajo: constante.
              </p>
            </div>
          </div>

          {/* Right: Nuestra diferencia */}
          <div ref={rightRef} style={{ opacity: 0 }}>
            <div className="inline-block font-mono text-xs text-green-400/60 tracking-widest uppercase mb-6 border border-green-400/20 px-3 py-1 rounded-full">
              Nuestra diferencia
            </div>

            <h2 className="font-serif italic text-[clamp(2rem,4vw,3.5rem)] text-white leading-tight mb-8">
              Cuadra lee el XML.<br />Cuadra piensa en SAT.
            </h2>

            <div className="space-y-5">
              {[
                { text: 'Sube el estado de cuenta del banco.', accent: false },
                { text: 'Sube los XML CFDI del período.', accent: false },
                { text: 'Motor SAT-aware extrae retenciones ISR/IVA automáticamente.', accent: true },
                { text: 'Algoritmo de matching encuentra pares en segundos.', accent: true },
                { text: 'Revisas solo los casos sin conciliar — típicamente <6%.', accent: true },
                { text: 'Cada corrección entrena el modelo para la próxima sesión.', accent: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.accent ? 'bg-signal/20 border border-signal/40' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <span className={`font-mono text-[10px] ${item.accent ? 'text-signal' : 'text-white/30'}`}>
                      {i + 1}
                    </span>
                  </div>
                  <p className={`font-grotesk text-base leading-snug ${item.accent ? 'text-white' : 'text-white/50'}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-signal/10 border border-signal/30 rounded-2xl">
              <p className="font-mono text-xs text-white/70 leading-relaxed">
                Resultado: <span className="text-signal font-bold">94% match rate</span> promedio.<br />
                Tiempo por cierre: <span className="text-signal font-bold">&lt;15 minutos.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
