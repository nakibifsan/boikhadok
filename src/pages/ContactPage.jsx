import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import emailjs from '@emailjs/browser'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'

export default function ContactPage() {
  useEffect(() => {
    emailjs.init('service_3rfo4zr')
  }, [])
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', referral: '' })
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email.'
    if (!form.password.trim()) errs.password = 'Password is required.'
    else if (form.password.trim().length < 6) errs.password = 'Password must be at least 6 characters.'
    if (!form.referral.trim()) errs.referral = 'Please select how you know us.'
    return errs
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setStatus(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    
    emailjs.send('service_3rfo4zr', 'template_q2luqja', {
      name: form.name,
      email: form.email,
      password: form.password,
      referral: form.referral,
    })
      .then(() => {
        setLoading(false)
        setStatus('success')
        setForm({ name: '', email: '', password: '', referral: '' })
      })
      .catch(() => {
        setLoading(false)
        setStatus('error')
      })
  }

  const isFormComplete =
    form.name.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.referral.trim() &&
    Object.keys(validate()).length === 0

  return (
    <PageTransition>
      <div className="page-wrapper" style={{ background: '#F8F9FB' }}>
        <Navbar />

        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div
            className="blur-orb"
            style={{ width: 440, height: 440, background: 'rgba(201,169,110,0.09)', top: '-80px', left: '-80px' }}
          />
          <div
            className="blur-orb"
            style={{ width: 320, height: 320, background: 'rgba(201,169,110,0.07)', bottom: '-60px', right: '-60px' }}
          />
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 1,
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
            padding: '100px 24px 64px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 48,
            flexWrap: 'wrap',
          }}
        >
          {/* Left info panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: '1 1 280px', maxWidth: 380, paddingTop: 8 }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#F5EDD8',
                border: '1px solid rgba(201,169,110,0.3)',
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#a07840',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              📩 Request Access
            </div>

            <h1
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Golden Age of Piracy
            </h1>
            <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
              Fill this form with real info to get access of the website. You will get an email with your login credentials.
            </p>

          </motion.div>

          {/* Right form card */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="card"
            style={{ flex: '1 1 340px', maxWidth: 480, padding: 'clamp(28px, 5vw, 40px)' }}
          >
            {/* Success state */}
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{ textAlign: 'center', padding: '32px 0' }}
                >
                  <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
                  <h2
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: 24,
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: 10,
                    }}
                  >
                    Message sent!
                  </h2>
                  <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.65 }}>
                    Your request has been received. You can now connect EmailJS to send these details.
                  </p>
                  <div className="feedback-success" style={{ marginBottom: 24 }}>
                    ✓ Your form data has been captured successfully.
                  </div>
                  <motion.button
                    className="btn-outline"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStatus(null)}
                    style={{ width: '100%' }}
                  >
                    Send another message
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
                  noValidate
                >
                  <div>
                    <h2
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 22,
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: 6,
                      }}
                    >
                      Request Access
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: 13 }}>All fields are required.</p>
                  </div>

                  {/* Error banner */}
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="feedback-error"
                    >
                      Something went wrong. Please try again.
                    </motion.div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="label" htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Rafiq Islam"
                      value={form.name}
                      onChange={handleChange}
                      required
                      style={errors.name ? { borderColor: '#F87171' } : {}}
                    />
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: 500 }}
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="input-field"
                      placeholder="e.g. rafiq@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={errors.email ? { borderColor: '#F87171' } : {}}
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: 500 }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="label" htmlFor="password">Password You Want To Set</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="input-field"
                      placeholder="Enter your preferred password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      style={errors.password ? { borderColor: '#F87171' } : {}}
                    />
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: 500 }}
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Referral Source */}
                  <div>
                    <label className="label" htmlFor="referral">How Do You Know Me?</label>
                    <textarea
                      id="referral"
                      name="referral"
                      className="input-field"
                      placeholder="Write how you know me..."
                      value={form.referral}
                      onChange={handleChange}
                      rows={4}
                      required
                      style={{
                        resize: 'vertical',
                        minHeight: 110,
                        ...(errors.referral ? { borderColor: '#F87171' } : {}),
                      }}
                    />
                    {errors.referral && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: 500 }}
                      >
                        {errors.referral}
                      </motion.p>
                    )}
                  </div>

                  {/* Submit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={loading || !isFormComplete}
                      style={{
                        width: '100%',
                        opacity: loading || !isFormComplete ? 0.75 : 1,
                        cursor: loading || !isFormComplete ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <>
                          Submit Request
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      type="button"
                      className="btn-outline"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/')}
                      style={{ width: '100%' }}
                    >
                      ← Back to Home
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #E5E7EB', padding: '24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ color: '#6B7280', fontSize: 13 }}>
            © 2025 BOi Khadok — Sonar Boi. Built with ❤️ for readers.
          </p>
        </footer>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </PageTransition>
  )
}
