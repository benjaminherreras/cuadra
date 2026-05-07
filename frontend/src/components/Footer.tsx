import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        footerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            once: true,
          },
        }
      )
    }, footerRef)

    return () => ctx.revert()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer
      ref={footerRef}
      className="bg-darker rounded-t-[3rem] px-8 pt-16 pb-10 mt-0"
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top: Logo + status */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-16">
          {/* Left */}
          <div>
            <div className="font-grotesk font-black text-7xl md:text-9xl text-white/90 tracking-tighter leading-none mb-4">
              CUADRA
            </div>
            <p className="font-serif italic text-xl text-white/40 max-w-xs">
              Conciliación bancaria SAT-aware para México.
            </p>
          </div>

          {/* Right: Status + CTA */}
          <div className="flex flex-col gap-6 md:items-end">
            {/* Status */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 pulse-dot" />
              <span className="font-mono text-sm text-white/70">Sistema operativo</span>
            </div>

            {/* CTA */}
            <button
              onClick={() => scrollTo('hero-cta')}
              className="btn-magnetic rounded-[2rem] px-8 py-4 bg-signal text-white font-grotesk font-bold text-base"
            >
              <span className="btn-layer bg-white/20" />
              <span className="relative z-10">Empieza a conciliar</span>
            </button>
          </div>
        </div>

        {/* Links row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[
            {
              label: 'Producto',
              links: [
                { text: 'Características', id: 'features' },
                { text: 'Bancos', id: 'protocol' },
                { text: 'Dashboard', path: '/dashboard' },
              ],
            },
            {
              label: 'Tecnología',
              links: [
                { text: 'Motor SAT-aware', id: 'features' },
                { text: 'API REST', id: '' },
                { text: 'Seguridad', id: '' },
              ],
            },
            {
              label: 'Empresa',
              links: [
                { text: 'Filosofía', id: 'philosophy' },
                { text: 'Contacto', id: '' },
                { text: 'Blog', id: '' },
              ],
            },
            {
              label: 'Legal',
              links: [
                { text: 'Privacidad', id: '' },
                { text: 'Términos', id: '' },
                { text: 'Cookies', id: '' },
              ],
            },
          ].map((group) => (
            <div key={group.label}>
              <div className="font-mono text-xs text-white/25 uppercase tracking-widest mb-4">
                {group.label}
              </div>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.text}>
                    {link.path ? (
                      <a
                        href={link.path}
                        className="font-grotesk text-sm text-white/50 hover:text-white transition-colors duration-200"
                      >
                        {link.text}
                      </a>
                    ) : (
                      <button
                        onClick={() => link.id && scrollTo(link.id)}
                        className="font-grotesk text-sm text-white/50 hover:text-white transition-colors duration-200"
                      >
                        {link.text}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-white/25">
            © 2026 Cuadra. Todos los derechos reservados.
          </div>

          <div className="font-mono text-xs text-white/30 flex items-center gap-2">
            <span>Hecho en México</span>
            <span>🇲🇽</span>
            <span className="text-white/15 mx-1">·</span>
            <span>BBVA · Banorte · Santander · HSBC</span>
          </div>

          <div className="font-mono text-xs text-white/20">
            v2.0.0-beta
          </div>
        </div>
      </div>
    </footer>
  )
}
