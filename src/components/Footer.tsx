const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-links">
          <a href="https://www.facebook.com" target="_blank" className="footer-link" aria-label="Facebook">
            <img src="/facebook.png" alt="Facebook" className="social-icon" />
          </a>
          <a href="https://www.instagram.com" target="_blank" className="footer-link" aria-label="Instagram">
            <img src="/instagram.png" alt="Instagram" className="social-icon" />
          </a>
        </div>
        <div className="footer-contact-container">
          <div className="footer-location">Claremore, OK &nbsp; | &nbsp; Tulsa, Ok</div>
          <div className="footer-number" style={{ marginTop: '12px' }}>918-779-9879</div>
          <div className="footer-email" style={{ marginTop: '12px' }}>mrkprctr@yahoo.com</div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
