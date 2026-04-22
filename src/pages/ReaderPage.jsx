import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOKS } from '../lib/booksData'
import { fetchGutenbergBookById } from '../lib/gutenbergClient'

// Strip Gutenberg header/footer boilerplate from text
function cleanGutenbergText(raw) {
  const startMarkers = [
    /\*\*\* START OF (THE|THIS) PROJECT GUTENBERG/i,
    /\*\*\*START OF (THE|THIS) PROJECT GUTENBERG/i,
    /Produced by .+\n/i,
  ]
  const endMarkers = [
    /\*\*\* END OF (THE|THIS) PROJECT GUTENBERG/i,
    /\*\*\*END OF (THE|THIS) PROJECT GUTENBERG/i,
    /End of (the )?Project Gutenberg/i,
  ]

  let text = raw
  for (const marker of startMarkers) {
    const match = text.search(marker)
    if (match !== -1) {
      const lineEnd = text.indexOf('\n', match)
      if (lineEnd !== -1) text = text.slice(lineEnd + 1)
      break
    }
  }
  for (const marker of endMarkers) {
    const match = text.search(marker)
    if (match !== -1) {
      text = text.slice(0, match)
      break
    }
  }
  return text.trim()
}

// Split text into paragraphs and detect chapter headings
function parseIntoBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  let para = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      if (para.length) {
        blocks.push({ type: 'paragraph', text: para.join(' ') })
        para = []
      }
    } else {
      // Detect chapter headings: ALL CAPS or starts with "Chapter"
      const isHeading =
        /^(chapter|book|part|prologue|epilogue|introduction|preface)\s+/i.test(trimmed) ||
        (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && trimmed.length > 2 && /[A-Z]/.test(trimmed))
      if (isHeading && para.length === 0) {
        blocks.push({ type: 'heading', text: trimmed })
      } else {
        para.push(trimmed)
      }
    }
  }
  if (para.length) blocks.push({ type: 'paragraph', text: para.join(' ') })
  return blocks
}

const THEMES = {
  parchment: {
    name: 'Parchment',
    bg: '#FDF8F0',
    surface: '#F5EDD8',
    text: '#3D2B1F',
    accent: '#C9A96E',
    navBg: 'rgba(253,248,240,0.92)',
    border: '#E8D9BE',
  },
  light: {
    name: 'Light',
    bg: '#FFFFFF',
    surface: '#F8F9FB',
    text: '#111827',
    accent: '#7C3AED',
    navBg: 'rgba(255,255,255,0.92)',
    border: '#E5E7EB',
  },
  dark: {
    name: 'Dark',
    bg: '#1A1A2E',
    surface: '#16213E',
    text: '#E2E8F0',
    accent: '#C9A96E',
    navBg: 'rgba(26,26,46,0.95)',
    border: '#2D3748',
  },
  sepia: {
    name: 'Sepia',
    bg: '#F4ECD8',
    surface: '#EBE0C8',
    text: '#5C4A32',
    accent: '#A0522D',
    navBg: 'rgba(244,236,216,0.92)',
    border: '#D9C9A8',
  },
}

export default function ReaderPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const staticBook = BOOKS.find(b => b.id === Number(bookId))
  const parsedGutenbergId = bookId?.startsWith('gutenberg-') ? Number(bookId.replace('gutenberg-', '')) : null
  const hasDynamicGutenbergId = Number.isFinite(parsedGutenbergId)
  const [dynamicBook, setDynamicBook] = useState(location.state?.bookMeta || null)
  const book = staticBook || dynamicBook || (hasDynamicGutenbergId
    ? {
        id: `gutenberg-${parsedGutenbergId}`,
        gutenbergId: parsedGutenbergId,
        title: `Book #${parsedGutenbergId}`,
        author: 'Unknown author',
        year: null,
        cover: '',
        pages: 0,
      }
    : null)
  const effectiveGutenbergId = staticBook?.gutenbergId || dynamicBook?.gutenbergId || (hasDynamicGutenbergId ? parsedGutenbergId : null)

  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.9)
  const [theme, setTheme] = useState('parchment')
  const [showControls, setShowControls] = useState(true)
  const [progress, setProgress] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const readerRef = useRef(null)
  const controlsTimeout = useRef(null)
  const T = THEMES[theme]

  useEffect(() => {
    if (!hasDynamicGutenbergId || dynamicBook) return

    let alive = true
    fetchGutenbergBookById(parsedGutenbergId)
      .then(data => {
        if (alive) setDynamicBook(data)
      })
      .catch(() => {
        // Metadata is optional here because we can still fetch the text body directly.
      })

    return () => {
      alive = false
    }
  }, [dynamicBook, hasDynamicGutenbergId, parsedGutenbergId])

  // Fetch full book text
  useEffect(() => {
    setLoading(true)
    setError('')

    const proxyBase = 'https://corsproxy.io/?url='
    const apiUrl = effectiveGutenbergId ? `/api/gutenberg-text?bookId=${effectiveGutenbergId}` : ''
    if (!effectiveGutenbergId) {
      setError('This title does not have a readable Gutenberg text source.')
      setLoading(false)
      return
    }

    const directUrl = `https://www.gutenberg.org/cache/epub/${effectiveGutenbergId}/pg${effectiveGutenbergId}.txt`

    const fetchBook = async () => {
      let text = null

      // Primary source: same-origin serverless endpoint on Vercel (avoids browser CORS issues)
      try {
        const res = await fetch(apiUrl)
        if (res.ok) {
          text = await res.text()
        }
      } catch {
        // Fall through to browser-side sources.
      }

      // Try direct first (Gutenberg does have CORS headers)
      if (!text) {
        try {
          const res = await fetch(directUrl)
          if (res.ok) {
            text = await res.text()
          }
        } catch {
          // Fall through to proxy
        }
      }

      // Fallback: proxy
      if (!text) {
        try {
          const res = await fetch(`${proxyBase}${encodeURIComponent(directUrl)}`)
          if (res.ok) text = await res.text()
        } catch {
          throw new Error('Could not load book. Please check your connection.')
        }
      }

      if (!text) throw new Error('No content received from the book source.')

      const cleaned = cleanGutenbergText(text)
      const parsed = parseIntoBlocks(cleaned)
      const words = cleaned.split(/\s+/).filter(Boolean).length
      setWordCount(words)
      setBlocks(parsed)
    }

    fetchBook()
      .catch(err => setError(err.message || 'Failed to load book.'))
      .finally(() => setLoading(false))
  }, [effectiveGutenbergId])

  // Restore saved position
  useEffect(() => {
    if (!loading && blocks.length && readerRef.current) {
      const saved = localStorage.getItem(`reader-pos-${bookId}`)
      if (saved) {
        setTimeout(() => {
          if (readerRef.current) readerRef.current.scrollTop = Number(saved)
        }, 100)
      }
    }
  }, [loading, blocks.length, bookId])

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const el = readerRef.current
    if (!el) return
    const scrolled = el.scrollTop
    const total = el.scrollHeight - el.clientHeight
    setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    localStorage.setItem(`reader-pos-${bookId}`, scrolled)
  }, [bookId])

  const jumpToProgress = useCallback((percent) => {
    const el = readerRef.current
    if (!el) return

    const clamped = Math.max(0, Math.min(100, Number(percent) || 0))
    const total = el.scrollHeight - el.clientHeight
    const target = total > 0 ? (clamped / 100) * total : 0

    el.scrollTop = target
    setProgress(clamped)
    localStorage.setItem(`reader-pos-${bookId}`, target)
  }, [bookId])

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    return () => clearTimeout(controlsTimeout.current)
  }, [])

  if (!book) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#111827' }}>Book not found</h2>
          <button className="btn-primary" onClick={() => navigate('/ebooks')} style={{ marginTop: 16 }}>
            ← Back to Library
          </button>
        </div>
      </div>
    )
  }

  const minutesToRead = Math.round(wordCount / 200)

  return (
    <div
      style={{ minHeight: '100vh', background: T.bg, transition: 'background 0.4s ease' }}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      {/* Progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, zIndex: 300,
        height: 3, background: T.border, width: '100%',
      }}>
        <motion.div
          style={{ height: '100%', background: T.accent, transformOrigin: 'left' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 3, left: 0, right: 0, zIndex: 200,
              background: T.navBg, backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: `1px solid ${T.border}`,
              padding: '0 24px', height: 60,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.4s ease, border-color 0.4s ease',
            }}
          >
            {/* Left: back + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <button
                onClick={() => navigate('/ebooks')}
                style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: T.text,
                  fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                  flexShrink: 0,
                }}
              >
                ← Library
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Playfair Display, serif', fontWeight: 600,
                  fontSize: 15, color: T.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {book.title}
                </div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 500 }}>
                  {book.author}
                </div>
              </div>
            </div>

            {/* Right: controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Font size */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '4px 8px',
              }}>
                <button
                  onClick={() => setFontSize(s => Math.max(13, s - 1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, fontSize: 14, padding: '2px 6px', fontWeight: 700 }}
                >A−</button>
                <span style={{ fontSize: 12, color: T.text, fontFamily: 'Inter, sans-serif', minWidth: 24, textAlign: 'center' }}>{fontSize}</span>
                <button
                  onClick={() => setFontSize(s => Math.min(28, s + 1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, fontSize: 14, padding: '2px 6px', fontWeight: 700 }}
                >A+</button>
              </div>

              {/* Line height */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '4px 8px',
              }}>
                <button
                  onClick={() => setLineHeight(h => Math.max(1.4, Math.round((h - 0.1) * 10) / 10))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, fontSize: 12, padding: '2px 4px' }}
                  title="Decrease line spacing"
                >☰−</button>
                <button
                  onClick={() => setLineHeight(h => Math.min(2.8, Math.round((h + 0.1) * 10) / 10))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, fontSize: 12, padding: '2px 4px' }}
                  title="Increase line spacing"
                >☰+</button>
              </div>

              {/* Theme picker */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowThemePicker(p => !p)}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
                    fontSize: 14, color: T.text, display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  title="Change theme"
                >
                  🎨 <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{T.name}</span>
                </button>
                <AnimatePresence>
                  {showThemePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        background: '#fff', border: '1px solid #E5E7EB',
                        borderRadius: 14, padding: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        zIndex: 300, minWidth: 140,
                      }}
                    >
                      {Object.entries(THEMES).map(([key, t]) => (
                        <button
                          key={key}
                          onClick={() => { setTheme(key); setShowThemePicker(false) }}
                          style={{
                            width: '100%', padding: '9px 14px', border: 'none',
                            borderRadius: 8, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: 10, background: theme === key ? '#F3F4F6' : 'transparent',
                            fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#111827',
                            fontWeight: theme === key ? 600 : 400,
                          }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: t.bg, border: '2px solid ' + t.accent, flexShrink: 0 }} />
                          {t.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(progress)}
                  onChange={(e) => jumpToProgress(e.target.value)}
                  style={{ width: 90, accentColor: T.accent, cursor: 'pointer' }}
                  aria-label="Reading progress"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(progress)}
                  onChange={(e) => jumpToProgress(e.target.value)}
                  style={{
                    width: 52, background: 'transparent',
                    border: `1px solid ${T.border}`, borderRadius: 8,
                    fontSize: 12, fontFamily: 'Inter, sans-serif',
                    color: T.text, padding: '4px 6px',
                  }}
                  aria-label="Go to percent"
                />
                <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: T.text, fontWeight: 600 }}>%</span>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Reader content */}
      <div
        ref={readerRef}
        onScroll={handleScroll}
        style={{
          height: '100vh', overflowY: 'auto', paddingTop: showControls ? 80 : 24,
          scrollbarWidth: 'thin',
          scrollbarColor: `${T.border} transparent`,
          transition: 'padding-top 0.3s ease',
        }}
      >
        <div style={{
          maxWidth: 960, margin: '0 auto',
          padding: '40px 32px 120px',
        }}>

          {/* Book header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 56, textAlign: 'center' }}
          >
            {/* Cover thumbnail */}
            <div style={{
              width: 100, height: 140, margin: '0 auto 24px',
              borderRadius: 8, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
              <img
                src={book.cover}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 700,
              color: T.text, marginBottom: 8, lineHeight: 1.2,
              transition: 'color 0.4s',
            }}>
              {book.title}
            </h1>
            <p style={{ color: T.accent, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>
              {book.author}
            </p>
            <p style={{ color: T.text, fontSize: 14, opacity: 0.5 }}>
              {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
            </p>

            {/* Stats */}
            {!loading && wordCount > 0 && (
              <div style={{
                display: 'inline-flex', gap: 24, marginTop: 20,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: '12px 24px',
                transition: 'background 0.4s, border-color 0.4s',
              }}>
                {[
                  { label: 'Words', value: wordCount.toLocaleString() },
                  { label: 'Est. read time', value: `${minutesToRead} min` },
                  { label: 'Pages', value: book.pages },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: T.text, opacity: 0.5, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{
              margin: '32px auto 0', width: 60, height: 2,
              background: `linear-gradient(to right, transparent, ${T.accent}, transparent)`,
            }} />
          </motion.div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 40, height: 40, border: `3px solid ${T.border}`,
                  borderTop: `3px solid ${T.accent}`, borderRadius: '50%',
                  margin: '0 auto 20px',
                }}
              />
              <p style={{ color: T.text, opacity: 0.6, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
                Loading full book text…
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 14,
              padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#9F1239', fontWeight: 600, marginBottom: 8 }}>{error}</p>
              <p style={{ color: '#9F1239', fontSize: 13, opacity: 0.8 }}>
                This may be a network or CORS issue. Try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 16, padding: '10px 24px', background: '#111827',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Book text */}
          {!loading && !error && blocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {blocks.map((block, idx) =>
                block.type === 'heading' ? (
                  <h2
                    key={idx}
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: Math.min(fontSize + 4, 26),
                      fontWeight: 700,
                      color: T.text,
                      margin: '52px 0 20px',
                      textAlign: 'center',
                      letterSpacing: '0.03em',
                      transition: 'color 0.4s',
                      borderBottom: `1px solid ${T.border}`,
                      paddingBottom: 16,
                    }}
                  >
                    {block.text}
                  </h2>
                ) : (
                  <p
                    key={idx}
                    style={{
                      fontFamily: 'Georgia, "Playfair Display", serif',
                      fontSize: fontSize,
                      lineHeight: lineHeight,
                      color: T.text,
                      margin: '0 0 1.2em',
                      textAlign: 'justify',
                      textIndent: '2em',
                      transition: 'font-size 0.2s, line-height 0.2s, color 0.4s',
                      hyphens: 'auto',
                      wordBreak: 'break-word',
                    }}
                  >
                    {block.text}
                  </p>
                )
              )}

              {/* End of book */}
              <div style={{ textAlign: 'center', marginTop: 80, paddingTop: 40, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', color: T.text, fontSize: 22, marginBottom: 8 }}>
                  You've reached the end!
                </h3>
                <p style={{ color: T.text, opacity: 0.6, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                  — {book.title} by {book.author}
                </p>
                <button
                  onClick={() => { navigate('/ebooks'); window.scrollTo(0, 0) }}
                  style={{
                    marginTop: 24, padding: '12px 28px', background: T.accent,
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 15,
                  }}
                >
                  ← Back to Library
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Click anywhere hint */}
      <AnimatePresence>
        {!showControls && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 150,
              background: T.navBg, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '8px 14px',
              fontSize: 12, color: T.text, opacity: 0.7,
              fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)',
            }}
          >
            Move mouse to show controls
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
