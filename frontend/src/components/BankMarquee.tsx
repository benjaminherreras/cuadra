const allBanks = [
  'BBVA', 'Banorte', 'Santander', 'HSBC',
  'Citibanamex', 'Scotiabank', 'Inbursa',
  'BanBajío', 'Afirme', 'Multiva', 'Mifel',
]

export default function BankMarquee() {
  return (
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
  )
}
