import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="page-wrapper">
        <Navbar />

        {/* Hero */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
          }}
        >
          {/* Background blur orbs */}
          <div
            className="blur-orb"
            style={{
              width: 480,
              height: 480,
              background: 'rgba(201,169,110,0.12)',
              top: '-80px',
              right: '-100px',
            }}
          />
          <div
            className="blur-orb"
            style={{
              width: 360,
              height: 360,
              background: 'rgba(201,169,110,0.08)',
              bottom: '-60px',
              left: '-80px',
            }}
          />
          <div
            className="blur-orb"
            style={{
              width: 240,
              height: 240,
              background: 'rgba(139,92,246,0.05)',
              top: '30%',
              left: '10%',
            }}
          />

          {/* Hero content */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: 640,
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}
          >
            {/* Main logo mark */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              style={{
                width: 104,
                height: 104,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <img
                src="/logo.png"
                alt="Boi Khadok logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={2}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(36px, 8vw, 60px)',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              Boi Khadok
            </motion.h1>

            {/* Tagline */}
            <motion.p
              custom={3}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              style={{
                fontSize: 'clamp(16px, 3vw, 19px)',
                color: '#6B7280',
                lineHeight: 1.65,
                maxWidth: 480,
                fontWeight: 400,
              }}
            >
              Maybe you got nothing to read T_T <br /> Request access to get your login credentials.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
                marginTop: 8,
              }}
            >
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{ minWidth: 140 }}
              >
                Login

              </motion.button>
              <motion.button
                className="btn-outline"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/request-access')}
                style={{ minWidth: 140 }}
              >
                Request Access
              </motion.button>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              custom={5}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              style={{
                display: 'flex',
                gap: 0,
                marginTop: 32,
                background: '#F8F9FB',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                overflow: 'hidden',
                width: '100%',
                maxWidth: 420,
              }}
            >
              {[
                { value: '80K+', label: 'eBooks' },
                { value: '40K+', label: 'Audiobooks' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: '20px 16px',
                    textAlign: 'center',
                    borderRight: i < 1 ? '1px solid #E5E7EB' : 'none',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', fontFamily: 'Playfair Display, serif' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 500, letterSpacing: '0.03em' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid #E5E7EB',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{ color: '#6B7280', fontSize: 14 }}>
              &lt;3
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
