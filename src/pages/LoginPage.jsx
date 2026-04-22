import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message || 'Login failed. Please check your credentials and try again.')
      return
    }

    navigate('/ebooks')
  }

  return (
    <PageTransition>
      <div className="page-wrapper" style={{ background: '#F8F9FB' }}>
        <Navbar />

        {/* Background orbs */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div
            className="blur-orb"
            style={{
              width: 400,
              height: 400,
              background: 'rgba(201,169,110,0.1)',
              top: '-60px',
              right: '-80px',
            }}
          />
          <div
            className="blur-orb"
            style={{
              width: 280,
              height: 280,
              background: 'rgba(201,169,110,0.07)',
              bottom: '-40px',
              left: '-60px',
            }}
          />
        </div>

        {/* Centered card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 24px 64px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="card"
            style={{
              width: '100%',
              maxWidth: 400,
              padding: 40,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <img
                src="/logo.png"
                alt="Boi Khadok logo"
                style={{
                  width: 56,
                  height: 56,
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto 20px',
                }}
              />
              <h1
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 26,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 6,
                }}
              >
                Welcome back
              </h1>
              <p style={{ color: '#6B7280', fontSize: 14 }}>
                Sign in to your Boi Khadok account
              </p>
            </div>

            {/* Error feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="feedback-error"
                style={{ marginBottom: 24 }}
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email */}
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label className="label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C9A96E',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                    }}
                    onClick={() => {}}
                  >
                    
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    className="input-field"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      fontSize: 16,
                      padding: 4,
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <motion.button
                  type="submit"
                  className="btn-primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  style={{ width: '100%', opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Login'}
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
            </form>

            {/* Divider + register hint */}
            <div style={{ marginTop: 28, textAlign: 'center' }}>
              <div className="divider" style={{ marginBottom: 20 }} />
              <p style={{ color: '#6B7280', fontSize: 13 }}>
                Don't have an account?{' '}
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C9A96E',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                  }}
                  onClick={() => navigate('/request-access')}
                >
                  Request access
                </button>
              </p>
            </div>
          </motion.div>
        </div>

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
