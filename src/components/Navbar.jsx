import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const links = [
    { label: 'Home', path: '/' },
    ...(session
      ? [
          { label: '📖 eBooks', path: '/ebooks' },
          { label: '🎧 Audiobooks', path: '/audiobooks' },
        ]
      : []),
    { label: 'Request Access', path: '/request-access' },
  ]

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div
        style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <img src="/logo.png" alt="Boi Khadok" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 18, color: '#111827', letterSpacing: '-0.01em' }}>
            Boi Khadok
          </span>
        </button>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(link => {
            const active = location.pathname === link.path
            return (
              <motion.button
                key={link.path}
                onClick={() => navigate(link.path)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: active ? '#F8F9FB' : 'none',
                  border: active ? '1px solid #E5E7EB' : '1px solid transparent',
                  borderRadius: 10, padding: '7px 14px',
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  color: active ? '#111827' : '#6B7280',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {link.label}
              </motion.button>
            )
          })}

          {session ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSignOut}
              style={{
                background: '#111827', color: '#fff', border: 'none',
                borderRadius: 10, padding: '7px 16px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginLeft: 6,
              }}
            >
              Sign Out
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                background: '#111827', color: '#fff', border: 'none',
                borderRadius: 10, padding: '7px 16px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginLeft: 6,
              }}
            >
              Login
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  )
}
