import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import InfoSection from '../components/InfoSection'
import PricingSection from '../components/PricingSection'
import TestimonialsSection from '../components/TestimonialsSection'
import ResultsSection from '../components/ResultsSection'
import CTASection from '../components/CTASection'
import AboutSection from '../components/AboutSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

function Home() {
  return (
    <div className="home">
      <Navbar />
      <main>
        <Hero />
        <InfoSection />
        <PricingSection />
        <TestimonialsSection />
        <ResultsSection />
        <CTASection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}

export default Home
