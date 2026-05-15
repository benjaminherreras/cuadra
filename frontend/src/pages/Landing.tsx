import Header from '../components/Header'
import Hero from '../components/Hero'
import BankMarquee from '../components/BankMarquee'
import Features from '../components/Features'
import Philosophy from '../components/Philosophy'
import Protocol from '../components/Protocol'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Philosophy />
        <BankMarquee />
        <Protocol />
      </main>
      <Footer />
    </div>
  )
}
