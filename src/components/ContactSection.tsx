import { useState, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { submitWebsiteContactInquiry } from '../lib/contact-inquiry'
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
      setError('')
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
    const phone = (form.querySelector('[name="phone"]') as HTMLInputElement | null)?.value?.trim()
    const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement).value

    const recaptchaToken = recaptchaRef.current?.getValue()
    if (!recaptchaToken) {
      setError('Please complete the CAPTCHA verification.')
      setIsSubmitting(false)
      return
    }

    try {
      await submitWebsiteContactInquiry({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        message,
        recaptchaToken,
      })

      setIsSubmitted(true)
      form.reset()
      recaptchaRef.current?.reset()
      setIsRecaptchaVerified(false)
    } catch (err: unknown) {
      console.error('Error submitting message:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again later.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact-section" className="contact-section">
      <div className="contact-container">
        <div className="contact-info">
          <h2 className="contact-title">Get in Touch</h2>
          <p className="contact-desc">
            Send a message to schedule your first lesson — Mark will see it in his studio Messages
            and get notified right away.
          </p>
        </div>
        {!isSubmitted ? (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-row">
              <TextField name="firstName" placeholder="First name" required />
              <TextField name="lastName" placeholder="Last name" required />
            </div>
            <div className="contact-row">
              <TextField name="email" type="email" placeholder="Email" fullWidth required />
            </div>
            <div className="contact-row">
              <TextField name="phone" type="tel" placeholder="Phone (optional)" fullWidth />
            </div>
            <div className="contact-row">
              <Textarea name="message" placeholder="Your message" fullWidth required />
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
            {error ? (
              <div className="contact-error" style={{ color: '#ff6b6b', marginTop: '1rem' }}>
                {error}
              </div>
            ) : null}
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
            Message sent! Mark will see it in his studio portal and get a notification. Thank you
            for reaching out.
          </div>
        )}
      </div>
    </section>
  )
}

export default ContactSection
