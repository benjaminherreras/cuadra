import Header from '../components/Header'
import Hero from '../components/Hero'
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
        <Protocol />
      </main>
      <Footer />
    </div>
  )
}
