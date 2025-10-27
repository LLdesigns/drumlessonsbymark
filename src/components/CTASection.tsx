const CTASection = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="cta-section" className="cta-section">
      <div className="cta-container">
        <div className="cta-headline">Ready to Start<br />Drumming?</div>
        <a 
          href="#" 
          className="btn btn-tertiary cta-btn"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('contact-section')
          }}
        >
          Get In Touch
        </a>
      </div>
    </section>
  )
}

export default CTASection
