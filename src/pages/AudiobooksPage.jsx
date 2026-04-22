import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import AudioPlayer from '../components/AudioPlayer'
import { supabase } from '../lib/supabaseClient'

// ─── Internet Archive API (full CORS, hosts all LibriVox) ───────────────────
const IA = 'https://archive.org'
const ROWS_PER_REQUEST = 60
const CURRENT_YEAR = new Date().getFullYear()
const MIN_LIBRIVOX_YEAR = 2005

async function searchIA(query = '', offset = 0, year = null) {
  const baseQuery = query.trim()
    ? `collection:librivoxaudio AND (title:(${query}) OR creator:(${query}))`
    : 'collection:librivoxaudio AND mediatype:audio'

  const q = year
    ? `${baseQuery} AND publicdate:[${year}-01-01 TO ${year}-12-31]`
    : baseQuery

  const url =
    `${IA}/advancedsearch.php` +
    `?q=${encodeURIComponent(q)}` +
    `&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=description&fl[]=subject` +
    `&sort[]=publicdate+desc&sort[]=identifier+asc&output=json&rows=${ROWS_PER_REQUEST}&start=${offset}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return {
    docs: data.response?.docs || [],
    total: data.response?.numFound || 0,
  }
}

async function fetchChapters(identifier) {
  const res = await fetch(`${IA}/metadata/${identifier}`)
  if (!res.ok) throw new Error('Could not load chapters')
  const data = await res.json()

  const mp3s = (data.files || [])
    .filter(f =>
      f.name.toLowerCase().endsWith('.mp3') &&
      !f.name.includes('_meta') &&
      !f.name.toLowerCase().includes('thumbs') &&
      f.source !== 'metadata'
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  return mp3s.map((f, i) => ({
    title: prettifyChapterName(f.name, i + 1),
    url: `${IA}/download/${identifier}/${encodeURIComponent(f.name)}`,
    duration: f.length ? fmtSeconds(Number(f.length)) : '',
  }))
}

function prettifyChapterName(filename, n) {
  return filename
    .replace(/\.mp3$/i, '')
    .replace(/_\d+kb$/i, '')
    .replace(/^.*?(\d{2,})/, (_, num) => `Chapter ${parseInt(num, 10)}`)
    .replace(/_/g, ' ')
    .trim() || `Chapter ${n}`
}

function fmtSeconds(s) {
  if (!s || isNaN(s)) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function iaCover(identifier) {
  return `${IA}/services/img/${identifier}`
}

// ─── Card ────────────────────────────────────────────────────────────────────
function AudiobookCard({ book, onPlay, isActive }) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const cover = iaCover(book.identifier)

  const author = Array.isArray(book.creator)
    ? book.creator[0]
    : book.creator || 'Unknown Author'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onPlay(book)}
      style={{
        background: isActive ? 'linear-gradient(135deg,#1A1A2E,#16213E)' : '#fff',
        border: isActive ? '1.5px solid rgba(201,169,110,0.5)' : '1px solid #E5E7EB',
        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered
          ? '0 16px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(201,169,110,0.12)'
          : isActive ? '0 8px 32px rgba(201,169,110,0.2)' : '0 1px 12px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Cover */}
      <div style={{
        position: 'relative', aspectRatio: '3/4', overflow: 'hidden',
        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
      }}>
        {!imgError ? (
          <img
            src={cover}
            alt={book.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.4s',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20,
          }}>
            <span style={{ fontSize: 52 }}>🎧</span>
            <span style={{
              fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center',
              fontWeight: 600, fontFamily: 'Playfair Display, serif',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{book.title}</span>
          </div>
        )}

        {/* Hover play button */}
        <motion.div
          animate={{ opacity: hovered || isActive ? 1 : 0 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)',
            display: 'flex', alignItems: 'flex-end', padding: 14,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: isActive ? '#C9A96E' : 'rgba(255,255,255,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive ? '#fff' : '#111827'}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 14px 16px' }}>
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.35,
          fontFamily: 'Playfair Display, serif',
          color: isActive ? '#F9FAFB' : '#111827',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{book.title}</h3>
        <p style={{
          margin: '5px 0 0', fontSize: 12, fontFamily: 'Inter, sans-serif',
          color: isActive ? '#C9A96E' : '#6B7280',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{author}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AudiobooksPage() {
  const navigate = useNavigate()
  const sentinelRef = useRef(null)
  const offsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const yearRef = useRef(CURRENT_YEAR)
  const yearOffsetRef = useRef(0)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [activeBook, setActiveBook] = useState(null)
  const [activeCover, setActiveCover] = useState(null)
  const [chapters, setChapters] = useState([])
  const [chapterIndex, setChapterIndex] = useState(0)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [chaptersError, setChaptersError] = useState('')

  const loadSliceForAllBooks = useCallback(async () => {
    while (yearRef.current >= MIN_LIBRIVOX_YEAR) {
      const currentYear = yearRef.current
      const currentOffset = yearOffsetRef.current
      const { docs, total } = await searchIA('', currentOffset, currentYear)

      const nextOffset = currentOffset + docs.length
      const sliceExhausted = docs.length === 0 || nextOffset >= total

      if (sliceExhausted) {
        yearRef.current -= 1
        yearOffsetRef.current = 0
      } else {
        yearOffsetRef.current = nextOffset
      }

      if (docs.length > 0) {
        return docs
      }
    }

    return []
  }, [])

  const load = useCallback(async ({ query = '', reset = false } = {}) => {
    if (!reset && loadingMoreRef.current) return

    if (reset) {
      offsetRef.current = 0
      yearRef.current = CURRENT_YEAR
      yearOffsetRef.current = 0
      setLoading(true)
      setError('')
    } else {
      loadingMoreRef.current = true
      setLoadingMore(true)
    }

    try {
      const trimmedQuery = query.trim()
      let docs = []
      let total = 0

      if (trimmedQuery) {
        const currentOffset = offsetRef.current
        const result = await searchIA(trimmedQuery, currentOffset)
        docs = result.docs
        total = result.total
        setTotalCount(total)
        offsetRef.current = currentOffset + docs.length
        setHasMore(currentOffset + docs.length < total)
      } else {
        docs = await loadSliceForAllBooks()
        setTotalCount(0)
        setHasMore(docs.length > 0 || yearRef.current >= MIN_LIBRIVOX_YEAR)
      }

      setBooks(prev => {
        const merged = reset ? docs : [...prev, ...docs]
        const unique = new Map(merged.map(book => [book.identifier, book]))
        return [...unique.values()]
      })

      if (reset && docs.length === 0) {
        setError('No audiobooks found. Try a different search.')
      }
    } catch (e) {
      if (reset) {
        setError('Could not load audiobooks. Please check your connection.')
      }
    } finally {
      if (reset) setLoading(false)
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    load({ query: activeQuery, reset: true })
  }, [activeQuery, load])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting) {
          load({ query: activeQuery, reset: false })
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [activeQuery, hasMore, load, loading, loadingMore])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    setHasMore(true)
    setActiveQuery(searchQuery.trim())
  }, [searchQuery])

  const handlePlay = useCallback(async (book) => {
    setActiveBook(book)
    setActiveCover(iaCover(book.identifier))
    setChapterIndex(0)
    setChapters([])
    setChaptersError('')
    setChaptersLoading(true)
    try {
      const chs = await fetchChapters(book.identifier)
      if (!chs.length) throw new Error('No audio files found for this book.')
      setChapters(chs)
    } catch (e) {
      setChaptersError(e.message || 'Could not load chapters.')
      setActiveBook(null)
    } finally {
      setChaptersLoading(false)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <PageTransition>
      <div
        className="page-wrapper"
        style={{ background: '#F8F9FB', minHeight: '100vh', paddingBottom: activeBook ? 110 : 0 }}
      >
        <Navbar />

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 24px 60px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 32 }}>🎧</span>
                <h1 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 'clamp(26px,4vw,38px)', color: '#111827', fontWeight: 600 }}>
                  Audiobooks
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={() => navigate('/ebooks')} style={{ padding: '10px 18px', fontSize: 14 }}>
                📖 eBooks
              </button>
              <button className="btn-outline" onClick={handleSignOut} style={{ padding: '10px 18px', fontSize: 14 }}>
                ← Sign Out
              </button>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search audiobooks by title or author..."
                style={{
                  width: '100%', padding: '11px 16px 11px 40px',
                  border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14,
                  fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', color: '#111827',
                }}
                onFocus={e => { e.target.style.borderColor = '#C9A96E'; e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '11px 24px', fontSize: 14, whiteSpace: 'nowrap' }}>Search</button>
            {searchQuery && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setSearchQuery('')
                  setHasMore(true)
                  setActiveQuery('')
                }}
                style={{ padding: '11px 16px', fontSize: 14 }}
              >
                Clear
              </button>
            )}
          </form>

          {/* Status banners */}
          <AnimatePresence>
            {chaptersLoading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  marginBottom: 20, padding: '12px 20px', background: '#FFF8EA',
                  border: '1px solid #F5D7A1', borderRadius: 12, fontSize: 14, color: '#8A5A00',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid #F5D7A1', borderTop: '2px solid #C9A96E', borderRadius: '50%', flexShrink: 0 }} />
                Loading chapters for <strong>{activeBook?.title}</strong>…
              </motion.div>
            )}
            {chaptersError && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="feedback-error" style={{ marginBottom: 20 }}
              >
                {chaptersError}
              </motion.div>
            )}
          </AnimatePresence>

          {error && !loading && (
            <div className="feedback-error" style={{ marginBottom: 20 }}>{error}</div>
          )}

          {/* Skeleton loader */}
          {loading ? (
            <div className="audiobooks-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div style={{
                    aspectRatio: '3/4',
                    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                  }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ height: 14, background: '#F3F4F6', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 11, background: '#F3F4F6', borderRadius: 4, width: '60%' }} />
                  </div>
                </div>
              ))}
              <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            </div>
          ) : (
            <div className="audiobooks-grid">
              {books.map((book) => (
                <div key={book.identifier}>
                  <AudiobookCard
                    book={book}
                    onPlay={handlePlay}
                    isActive={activeBook?.identifier === book.identifier}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && books.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎧</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#111827' }}>No audiobooks found</h2>
              <button
                className="btn-outline"
                onClick={() => {
                  setSearchQuery('')
                  setHasMore(true)
                  setActiveQuery('')
                }}
                style={{ marginTop: 16 }}
              >
                Browse Popular
              </button>
            </div>
          )}

          {!loading && books.length > 0 && (
            <div style={{ marginTop: 28, textAlign: 'center' }}>
              {loadingMore && <p style={{ color: '#6B7280', fontSize: 14 }}>Loading more audiobooks...</p>}
              {!hasMore && <p style={{ color: '#9CA3AF', fontSize: 13 }}>You reached the end of the current results.</p>}
              <div ref={sentinelRef} style={{ height: 1 }} />
            </div>
          )}
        </main>

        {/* Spotify-style bottom player */}
        <AnimatePresence>
          {activeBook && chapters.length > 0 && !chaptersLoading && (
            <AudioPlayer
              book={{ title: activeBook.title, cover: activeCover }}
              chapters={chapters}
              chapterIndex={chapterIndex}
              setChapterIndex={setChapterIndex}
              onClose={() => { setActiveBook(null); setChapters([]) }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
