const Hero = () => {

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleViewLessonsClick = () => {
    const infoSection = document.getElementById('info-section')
    if (infoSection) {
      infoSection.scrollIntoView({ behavior: 'smooth' })
      // Open all accordions with dramatic animation
      const accordionItems = document.querySelectorAll('.accordion-item')
      accordionItems.forEach((item, idx) => {
        setTimeout(() => {
          item.classList.add('open', 'dramatic')
        }, idx * 350) // stagger for drama
      })
      setTimeout(() => {
        accordionItems.forEach(item => item.classList.remove('dramatic'))
      }, accordionItems.length * 350 + 1000)
    }
  }

  return (
    <section id="hero" className="hero-demo-section">
      <div className="hero-content">
        <h1 className="hero-title">FIND YOUR RHYTHM</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          <h2 className="hero-subtitle">Private drum lessons in <b>Claremore & Tulsa, Oklahoma.</b></h2>
          <p className="hero-desc">Personalized for all ages and skill levels.</p>
          <p className="hero-desc">918-779-9878.</p>
        </div>
        <div className="hero-actions">
          <div className="hero-buttons">
            <button 
              className="hero-btn hero-btn-yellow" 
              id="contactBtn"
              onClick={() => scrollToSection('contact-section')}
            >
              Contact Me
            </button>
            <button 
              className="hero-btn hero-btn-dark" 
              id="viewLessonsBtn"
              onClick={handleViewLessonsClick}
            >
              View Lessons
            </button>
          </div>
          <div className="sabian-education-logo-wrapper fadeInUpLogo">
            <img src="/sabianEducationNetwork.png" alt="Sabian Education Network" className="sabian-education-logo" />
          </div>
        </div>
      </div>
      <div className="hero-bg"></div>
    </section>
  )
}

export default Hero
