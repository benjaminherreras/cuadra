import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      ref={headerRef}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4"
    >
      <div
        className={`
          rounded-[2rem] px-6 py-3 flex items-center justify-between gap-6
          transition-all duration-500
          ${scrolled
            ? 'bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl'
            : 'bg-black/40 backdrop-blur-md border border-white/5'
          }
        `}
      >
        {/* Logo */}
        <Link
          to="/"
          className="font-grotesk font-bold text-xl tracking-tight text-white hover:text-signal transition-colors duration-200"
        >
          CUADRA
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Producto', id: 'features' },
            { label: 'Bancos', id: 'protocol' },
            { label: 'Dashboard', path: '/dashboard' },
          ].map((item) => (
            item.path ? (
              <button
                key={item.label}
                onClick={() => navigate(item.path!)}
                className="font-grotesk text-sm font-medium text-white/60 hover:text-white px-4 py-2 rounded-full transition-colors duration-200 hover:bg-white/5"
              >
                {item.label}
              </button>
            ) : (
              <button
                key={item.label}
                onClick={() => scrollTo(item.id!)}
                className="font-grotesk text-sm font-medium text-white/60 hover:text-white px-4 py-2 rounded-full transition-colors duration-200 hover:bg-white/5"
              >
                {item.label}
              </button>
            )
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={() => scrollTo('hero-cta')}
          className="btn-magnetic rounded-[2rem] px-5 py-2.5 bg-signal text-white font-grotesk font-semibold text-sm"
        >
          <span className="btn-layer bg-white/20" />
          <span className="relative z-10">Empieza a conciliar</span>
        </button>
      </div>
    </header>
  )
}
