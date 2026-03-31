import { useState, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { supabase } from '../lib/supabase'
import { TextField, Textarea, Button } from './ui'

const ContactSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleRecaptchaChange = (value: string | null) => {
    setIsRecaptchaVerified(!!value)
    if (value) {
      setError('') // Clear any previous errors when reCAPTCHA is completed
    }
  }

  const handleRecaptchaExpired = () => {
    setIsRecaptchaVerified(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const form = e.target as HTMLFormElement
    const firstName = (form.querySelector('[name="firstName"]') as HTMLInputElement).value
    const lastName = (form.querySelector('[name="lastName"]') as HTMLInputElement).value
    const email = (form.querySelector('[name="email"]') as HTMLInputElement).value
    const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement).value

    // Verify CAPTCHA
    const recaptchaValue = recaptchaRef.current?.getValue()
    if (!recaptchaValue) {
      setError('Please complete the CAPTCHA verification.')
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            email: email,
            message: message,
            created_at: new Date().toISOString(),
            type: 'contact_form'
          }
        ])

      if (error) {
        throw error
      }

      setIsSubmitted(true)
      form.reset()
      recaptchaRef.current?.reset()
      setIsRecaptchaVerified(false)
    } catch (error) {
      console.error('Error submitting message:', error)
      setError('Failed to send message. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact-section" className="contact-section">
      <div className="contact-container">
        <div className="contact-info">
          <h2 className="contact-title">Get in Touch</h2>
          <p className="contact-desc">Contact me for more information and to schedule your first lesson.</p>
        </div>
        {!isSubmitted ? (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-row">
              <TextField 
                name="firstName" 
                placeholder="First name" 
                required 
              />
              <TextField 
                name="lastName" 
                placeholder="Last name" 
                required 
              />
            </div>
            <div className="contact-row">
              <TextField 
                name="email" 
                type="email"
                placeholder="Email" 
                fullWidth
                required 
              />
            </div>
            <div className="contact-row">
              <Textarea 
                name="message" 
                placeholder="Your message" 
                fullWidth
                required 
              />
            </div>
            <div className="contact-row">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LfpRfgrAAAAADKnlAAQ696lz8DB93jBEsx_FHXD"
                theme="dark"
                size="normal"
                onChange={handleRecaptchaChange}
                onExpired={handleRecaptchaExpired}
              />
            </div>
            {error && (
              <div className="contact-error" style={{ color: '#ff6b6b', marginTop: '1rem' }}>
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              variant="primary"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || !isRecaptchaVerified}
            >
              {isSubmitting ? 'Sending...' : isRecaptchaVerified ? 'Submit' : 'Complete reCAPTCHA to submit'}
            </Button>
          </form>
        ) : (
          <div className="contact-success" style={{ display: 'block' }}>
            Request sent! Thank you for reaching out. I'll be in touch soon.
          </div>
        )}
      </div>
    </section>
  )
}

export default ContactSection
