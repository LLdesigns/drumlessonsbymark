import { useEffect } from 'react'

const InfoSection = () => {
  useEffect(() => {
    const accordionItems = document.querySelectorAll('.accordion-item')

    const getCenteredAccordionItem = () => {
      let minDiff = Infinity
      let centered = null
      const viewportCenter = window.innerHeight / 2
      accordionItems.forEach(item => {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.top + rect.height / 2
        const diff = Math.abs(itemCenter - viewportCenter)
        if (diff < minDiff) {
          minDiff = diff
          centered = item
        }
      })
      return centered
    }

    const highlightCenteredAccordion = () => {
      const centered = getCenteredAccordionItem()
      accordionItems.forEach(item => {
        if (item === centered) {
          (item as Element).classList.add('active')
        } else {
          (item as Element).classList.remove('active')
        }
      })
    }

    window.addEventListener('scroll', highlightCenteredAccordion)
    window.addEventListener('resize', highlightCenteredAccordion)
    highlightCenteredAccordion() // Initial call

    return () => {
      window.removeEventListener('scroll', highlightCenteredAccordion)
      window.removeEventListener('resize', highlightCenteredAccordion)
    }
  }, [])

  return (
    <section id="info-section" className="info-section">
      <div className="accordion">
        <div className="accordion-item" tabIndex={0}>
          <div className="accordion-title">
            <span>Getting Started with Drums</span>
          </div>
          <div className="accordion-content">
            <b>Master the basics with confidence</b><br />
            Learn how to hold sticks properly, sit with good posture, and play your first grooves on the snare and hi-hat. Perfect for total beginners, younger students, or anyone returning to drums after a break.
            <ul>
              <li>Play along to 2–3 basic songs</li>
              <li>Understand your gear and setup</li>
              <li>Keep a steady beat using both hands</li>
            </ul>
          </div>
        </div>
        <div className="accordion-item" tabIndex={0}>
          <div className="accordion-title">
            <span>Rock, Country & Worship Styles (and more!)</span>
          </div>
          <div className="accordion-content">
            <b>Play the music you love</b><br />
            From classic rock and country to worship grooves and beyond, you'll learn patterns that translate to real songs and real stages.
            <ul>
              <li>Students who already know the basics</li>
              <li>Players wanting to join a band or worship team</li>
              <li>Anyone looking to jam with confidence</li>
            </ul>
          </div>
        </div>
        <div className="accordion-item" tabIndex={0}>
          <div className="accordion-title">
            <span>Timing, Tempo & Rudiments</span>
          </div>
          <div className="accordion-content">
            <b>Sharpen your skills and sound tighter</b><br />
            Drummers are timekeepers — and this section trains your ear, hands, and coordination with essential rudiments and tempo drills.
            <ul>
              <li>Learn the 5 most-used rudiments</li>
              <li>Improve timing with a metronome</li>
              <li>Feel more in control of fills and grooves</li>
            </ul>
          </div>
        </div>
        <div className="accordion-item" tabIndex={0}>
          <div className="accordion-title">
            <span>Custom Lessons for Your Goals</span>
          </div>
          <div className="accordion-content">
            <b>Personalized coaching, your way</b><br />
            Have something specific in mind? Whether it's speed, technique, learning a song, or preparing for an audition — we'll build a custom plan just for you.
            <ul>
              <li>Students with specific goals</li>
              <li>Intermediate players stuck in a rut</li>
              <li>Anyone who wants to level up with intent</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InfoSection
