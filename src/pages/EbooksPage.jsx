import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES } from '../lib/booksData'
import { fetchGutenbergBooks } from '../lib/gutenbergClient'

const StarRating = ({ rating }) => {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= full ? '#C9A96E' : i === full + 1 && half ? 'url(#half)' : '#E5E7EB'}>
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#C9A96E" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>{rating}</span>
    </div>
  )
}

const CategoryBadge = ({ category }) => {
  const colors = {
    Classic: { bg: '#FFF8E7', text: '#92650A', border: '#F5D87A' },
    Adventure: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
    Romance: { bg: '#FFF0F9', text: '#831843', border: '#F9A8D4' },
    Mystery: { bg: '#F0F9FF', text: '#0C4A6E', border: '#7DD3FC' },
    Philosophy: { bg: '#F5F3FF', text: '#4C1D95', border: '#C4B5FD' },
    Science: { bg: '#FFF7ED', text: '#7C2D12', border: '#FDB87D' },
    Poetry: { bg: '#FDF4FF', text: '#701A75', border: '#E879F9' },
  }
  const c = colors[category] || { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
      textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {category}
    </span>
  )
}

const BookCard = ({ book, index, onRead, onNavigateRead }) => {
  const [hovered, setHovered] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hovered
          ? '0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(201,169,110,0.1)'
          : '0 1px 12px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
    >
      {/* Cover */}
      <div style={{
        position: 'relative',
        aspectRatio: '3 / 4',
        background: 'linear-gradient(135deg, #F5EDD8 0%, #EDE0C4 100%)',
        overflow: 'hidden',
      }}>
        {!imgErr ? (
          <img
            src={book.cover}
            alt={book.title}
            onError={() => setImgErr(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.4s ease',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16,
          }}>
            <span style={{ fontSize: 40 }}>📖</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.4 }}>
              {book.title}
            </span>
          </div>
        )}
        {/* Overlay on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
            display: 'flex', alignItems: 'flex-end', padding: 16,
          }}
        >
          <button
            onClick={() => onNavigateRead(book)}
            style={{
              width: '100%', padding: '10px 0', background: '#C9A96E',
              color: '#fff', border: 'none', borderRadius: 10,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', letterSpacing: '0.02em',
            }}
          >
            Read Now →
          </button>
        </motion.div>

        {/* Category badge */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <CategoryBadge category={book.category} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 15, fontWeight: 700, color: '#111827',
            lineHeight: 1.35, fontFamily: 'Playfair Display, serif',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {book.title}
          </h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13, fontWeight: 500 }}>
            {book.author}
          </p>
        </div>

        <p style={{
          margin: 0, color: '#9CA3AF', fontSize: 12, lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {book.description}
        </p>

        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StarRating rating={book.rating} />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            {book.pages} pages
          </span>
        </div>
      </div>
    </motion.article>
  )
}

export default function EbooksPage() {
  const navigate = useNavigate()
  const sentinelRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [modalBook, setModalBook] = useState(null)
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')

  const handleReadBook = (book) => {
    const routeId = book.gutenbergId ? `gutenberg-${book.gutenbergId}` : book.id
    navigate(`/read/${routeId}`, { state: { bookMeta: book } })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const loadBooksPage = useCallback(async (targetPage, { reset = false } = {}) => {
    if (reset) {
      setLoading(true)
      setLoadError('')
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await fetchGutenbergBooks({ page: targetPage, limit: 32 })
      setTotalCount(data.count || 0)
      setHasMore(Boolean(data.next))
      setPage(targetPage)

      setBooks(prev => {
        const merged = reset ? data.books : [...prev, ...data.books]
        const unique = new Map(merged.map(book => [book.id, book]))
        return [...unique.values()]
      })
    } catch {
      setLoadError('Could not load ebooks right now. Please try again in a moment.')
    } finally {
      if (reset) setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    loadBooksPage(1, { reset: true })
  }, [loadBooksPage])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting) {
          loadBooksPage(page + 1)
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadBooksPage, page])

  const filteredBooks = useMemo(() => {
    let result = [...books]
    if (activeCategory !== 'All') result = result.filter(b => b.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      )
    }
    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'title') result.sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'year') result.sort((a, b) => b.year - a.year)
    else if (sortBy === 'pages') result.sort((a, b) => a.pages - b.pages)
    return result
  }, [activeCategory, books, searchQuery, sortBy])

  return (
    <PageTransition>
      <div className="page-wrapper" style={{ background: '#F8F9FB', minHeight: '100vh' }}>
        <Navbar />

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 24px 60px' }}>

          {/* — Header — */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 32 }}>📖</span>
                <h1 style={{
                  margin: 0, fontFamily: 'Playfair Display, serif',
                  fontSize: 'clamp(26px, 4vw, 38px)', color: '#111827', fontWeight: 600,
                }}>
                  eBooks
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-outline"
                onClick={() => navigate('/audiobooks')}
                style={{ padding: '10px 18px', fontSize: 14 }}
              >
                🎧 Audiobooks
              </button>
              <button
                className="btn-outline"
                onClick={handleSignOut}
                style={{ padding: '10px 20px', fontSize: 14 }}
              >
                ← Sign Out
              </button>
            </div>
          </div>

          {/* — Search + Sort row — */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#9CA3AF', fontSize: 16, pointerEvents: 'none',
              }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or description..."
                style={{
                  width: '100%', padding: '11px 16px 11px 40px',
                  border: '1.5px solid #E5E7EB', borderRadius: 12,
                  fontSize: 14, fontFamily: 'Inter, sans-serif',
                  background: '#fff', outline: 'none', color: '#111827',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#C9A96E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E5E7EB'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: '#F3F4F6', border: 'none', borderRadius: 6,
                    width: 22, height: 22, cursor: 'pointer', fontSize: 12, color: '#6B7280',
                  }}
                >✕</button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '11px 36px 11px 14px', border: '1.5px solid #E5E7EB',
                borderRadius: 12, fontSize: 14, fontFamily: 'Inter, sans-serif',
                background: '#fff', outline: 'none', color: '#374151',
                cursor: 'pointer', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
              }}
            >
              <option value="rating">Sort: Top Rated</option>
              <option value="title">Sort: A → Z</option>
              <option value="year">Sort: Newest First</option>
              <option value="pages">Sort: Shortest First</option>
            </select>
          </div>

          {/* — Category Pills — */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.18s ease',
                  border: '1.5px solid',
                  borderColor: activeCategory === cat ? '#C9A96E' : '#E5E7EB',
                  background: activeCategory === cat ? '#C9A96E' : '#fff',
                  color: activeCategory === cat ? '#fff' : '#374151',
                  boxShadow: activeCategory === cat ? '0 4px 12px rgba(201,169,110,0.3)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* — Grid — */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 20 }}>
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
          ) : filteredBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '80px 24px' }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#111827', marginBottom: 8 }}>No books found</h2>
              <p style={{ color: '#6B7280' }}>{loadError || 'Try a different search term or category.'}</p>
              <button
                className="btn-outline"
                onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                style={{ marginTop: 20 }}
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="ebooks-grid">
                {filteredBooks.map((book, idx) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={idx}
                    onRead={setModalBook}
                    onNavigateRead={handleReadBook}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {!loading && !loadError && (
            <div style={{ marginTop: 28, textAlign: 'center' }}>
              {loadingMore && <p style={{ color: '#6B7280', fontSize: 14 }}>Loading more ebooks...</p>}
              {!hasMore && books.length > 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>You reached the end of the current Gutenberg results.</p>}
              <div ref={sentinelRef} style={{ height: 1 }} />
            </div>
          )}
        </main>

        {/* — Book Detail Modal — */}
        <AnimatePresence>
          {modalBook && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalBook(null)}
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                  zIndex: 200, backdropFilter: 'blur(4px)',
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 32 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 32 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 201, width: '90%', maxWidth: 560,
                  background: '#fff', borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Cover panel */}
                  <div style={{
                    width: 160, flexShrink: 0,
                    background: 'linear-gradient(135deg,#F5EDD8,#EDE0C4)',
                    minHeight: 260,
                  }}>
                    <img
                      src={modalBook.cover}
                      alt={modalBook.title}
                      onError={e => e.target.style.display = 'none'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                      onClick={() => setModalBook(null)}
                      style={{
                        alignSelf: 'flex-end', background: '#F3F4F6', border: 'none',
                        borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
                        fontSize: 14, color: '#6B7280',
                      }}
                    >✕</button>

                    <CategoryBadge category={modalBook.category} />

                    <h2 style={{
                      margin: 0, fontFamily: 'Playfair Display, serif',
                      fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3,
                    }}>
                      {modalBook.title}
                    </h2>

                    <p style={{ margin: 0, color: '#6B7280', fontSize: 14, fontWeight: 500 }}>
                      {modalBook.author} · {modalBook.year == null ? 'Unknown year' : modalBook.year < 0 ? `${Math.abs(modalBook.year)} BC` : modalBook.year}
                    </p>

                    <StarRating rating={modalBook.rating} />

                    <p style={{ margin: 0, color: '#374151', fontSize: 13, lineHeight: 1.65 }}>
                      {modalBook.description}
                    </p>

                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: '#9CA3AF' }}>
                      <span>📄 {modalBook.pages} pages</span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                      <button
                        onClick={() => { setModalBook(null); handleReadBook(modalBook) }}
                        style={{
                          flex: 1, padding: '11px 0', background: '#111827',
                          color: '#fff', borderRadius: 12, fontFamily: 'Inter, sans-serif',
                          fontWeight: 600, fontSize: 14, textAlign: 'center',
                          border: 'none', cursor: 'pointer',
                          transition: 'background 0.18s',
                        }}
                        onMouseEnter={e => e.target.style.background = '#1F2937'}
                        onMouseLeave={e => e.target.style.background = '#111827'}
                      >
                        📖 Read Full Book
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
