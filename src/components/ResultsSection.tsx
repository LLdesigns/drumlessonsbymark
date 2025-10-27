import { useEffect } from 'react'

const ResultsSection = () => {
  useEffect(() => {
    const isInViewport = (el: Element) => {
      const rect = el.getBoundingClientRect()
      return (
        rect.top < window.innerHeight - 60 &&
        rect.bottom > 60
      )
    }

    const handleParallaxFloat = () => {
      const floatEls = document.querySelectorAll('.results-image, .results-transformation')
      floatEls.forEach(el => {
        if (isInViewport(el)) {
          el.classList.add('parallax-float')
        } else {
          el.classList.remove('parallax-float')
        }
      })
    }

    window.addEventListener('scroll', handleParallaxFloat)
    window.addEventListener('resize', handleParallaxFloat)
    handleParallaxFloat() // Initial call

    return () => {
      window.removeEventListener('scroll', handleParallaxFloat)
      window.removeEventListener('resize', handleParallaxFloat)
    }
  }, [])

  return (
    <section id="results-section" className="results-section">
      <div className="results-headline">From First Lesson to Confident Performer</div>
      <div className="results-vertical">
        <div className="results-image results-image-one">
          <img src="/imageOne.png" alt="Student at first lesson" />
        </div>
        <div className="results-transformation">Beginner <span className="arrow-transform">→</span> Confident Performer</div>
        <div className="results-image results-image-two">
          <img src="/imageTwo.png" alt="Student performing confidently" />
        </div>
      </div>
      <div className="results-quote">"Mark's lessons are hands-on, personal, and honestly a lot of fun. I made more progress in a few months than I ever expected."</div>
    </section>
  )
}

export default ResultsSection
