import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    closeMenu()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const sidePanel = document.querySelector('.navbar-sidepanel')
      const menuBtn = document.querySelector('.navbar-menu-btn')
      
      if (isMenuOpen && sidePanel && menuBtn && 
          !sidePanel.contains(e.target as Node) && 
          !menuBtn.contains(e.target as Node)) {
        closeMenu()
      }
    }

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <nav className="navbar-demo transparent">
      <div className="navbar-logo">
        <img src="/logoMP.svg" alt="Mark Proctor Logo" className="logo-img-svg" />
        <span className="navbar-title">Mark Proctor</span>
      </div>
      <ul className="navbar-links">
        <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('hero') }}>Home</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('info-section') }}>What You Learn</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('pricing-section') }}>Prices</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('about-section') }}>About Me</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('contact-section') }}>Contact</a></li>
        <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
      </ul>
      <button className="navbar-menu-btn" aria-label="Open menu" onClick={toggleMenu}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="7" width="32" height="3.5" rx="1.75" fill="var(--primary)"/>
          <rect y="14" width="32" height="3.5" rx="1.75" fill="var(--primary)"/>
          <rect y="21" width="32" height="3.5" rx="1.75" fill="var(--primary)"/>
        </svg>
      </button>
      <div className={`navbar-sidepanel ${isMenuOpen ? 'open' : ''}`} tabIndex={-1}>
        <button className="sidepanel-close" aria-label="Close menu" onClick={closeMenu}>&times;</button>
        <ul className="sidepanel-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('hero') }}>Home</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('info-section') }}>What You Learn</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('pricing-section') }}>Prices</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('about-section') }}>About Me</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('contact-section') }}>Contact</a></li>
          <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
