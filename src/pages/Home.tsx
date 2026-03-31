import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import InfoSection from '../components/InfoSection'
import PricingSection from '../components/PricingSection'
import TestimonialsSection from '../components/TestimonialsSection'
import ResultsSection from '../components/ResultsSection'
import CTASection from '../components/CTASection'
import AboutSection from '../components/AboutSection'
import MediaSection from '../components/MediaSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import { theme } from '../lib/theme'

function Home() {
  useEffect(() => {
    // Force dark theme for landing page
    theme.setTheme('dark')
  }, [])

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
        <MediaSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}

export default Home
