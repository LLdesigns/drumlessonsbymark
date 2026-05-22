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
import ScrollToTopButton from '../components/ScrollToTopButton'
import { applyThemeMode, resolveThemeMode } from '../lib/theme-preference'
import { useThemeStore } from '../store/themeStore'

function Home() {
  useEffect(() => {
    // Public marketing page stays on the original dark presentation
    applyThemeMode('dark')
    return () => {
      const { preference } = useThemeStore.getState()
      applyThemeMode(resolveThemeMode(preference))
    }
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
      <ScrollToTopButton />
    </div>
  )
}

export default Home
