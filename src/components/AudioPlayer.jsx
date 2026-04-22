import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ book, chapters, chapterIndex, setChapterIndex, onClose }) {
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isLoading, setIsLoading] = useState(true)
  const [showChapters, setShowChapters] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const chapter = chapters[chapterIndex]

  // Load new chapter when index changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !chapter?.url) return
    setIsLoading(true)
    setCurrentTime(0)
    setDuration(0)
    audio.src = chapter.url
    audio.load()
    audio.volume = volume
    audio.playbackRate = playbackRate
    // autoplay when chapter changes (except first load)
    if (chapterIndex > 0 || isPlaying) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [chapterIndex, chapter?.url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = playbackRate
  }, [playbackRate])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [isPlaying])

  const seek = useCallback((delta) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta))
  }, [duration])

  const nextChapter = useCallback(() => {
    if (chapterIndex < chapters.length - 1) setChapterIndex(i => i + 1)
  }, [chapterIndex, chapters.length, setChapterIndex])

  const prevChapter = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
    } else if (chapterIndex > 0) {
      setChapterIndex(i => i - 1)
    }
  }, [chapterIndex, setChapterIndex])

  const handleProgressClick = useCallback((e) => {
    const bar = progressRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }, [duration])

  const handleProgressDrag = useCallback((e) => {
    if (!isDragging) return
    handleProgressClick(e)
  }, [isDragging, handleProgressClick])

  const pct = duration ? (currentTime / duration) * 100 : 0
  const [imgError, setImgError] = useState(false)

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => !isDragging && setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onEnded={nextChapter}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <motion.div
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        exit={{ y: 120 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
          background: 'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%)',
          borderTop: '1px solid rgba(201,169,110,0.2)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          userSelect: 'none',
        }}
      >
        {/* Scrub bar */}
        <div
          ref={progressRef}
          onMouseDown={(e) => { setIsDragging(true); handleProgressClick(e) }}
          onMouseMove={handleProgressDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onClick={handleProgressClick}
          style={{
            height: 4, background: 'rgba(255,255,255,0.12)', cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{ height: '100%', width: `${pct}%`, background: '#C9A96E', position: 'relative', transition: isDragging ? 'none' : 'width 0.2s' }}>
            <div style={{
              position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%', background: '#fff',
              boxShadow: '0 0 6px rgba(201,169,110,0.8)',
            }} />
          </div>
        </div>

        <div style={{ padding: '10px 24px 14px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

          {/* Book info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 180px' }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 8, overflow: 'hidden', 
              flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {book.cover && !imgError ? (
                <img 
                  src={book.cover} alt={book.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={() => setImgError(true)} 
                />
              ) : (
                <span style={{ fontSize: 20 }}>🎧</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', fontFamily: 'Playfair Display, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {book.title}
              </div>
              <div style={{ fontSize: 11, color: '#C9A96E', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                {chapter?.title || `Chapter ${chapterIndex + 1}`}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>

            {/* Prev chapter */}
            <CtrlBtn onClick={prevChapter} title="Previous chapter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </CtrlBtn>

            {/* -15s */}
            <CtrlBtn onClick={() => seek(-15)} title="Rewind 15s">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.37" />
              </svg>
              <span style={{ fontSize: 9, position: 'absolute', bottom: 1, fontWeight: 700 }}>15</span>
            </CtrlBtn>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              style={{
                width: 48, height: 48, borderRadius: '50%', border: 'none',
                background: '#C9A96E', cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(201,169,110,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} />
              ) : isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              )}
            </button>

            {/* +15s */}
            <CtrlBtn onClick={() => seek(15)} title="Forward 15s" style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-.48-3.38" />
              </svg>
              <span style={{ fontSize: 9, position: 'absolute', bottom: 1, fontWeight: 700 }}>15</span>
            </CtrlBtn>

            {/* Next chapter */}
            <CtrlBtn onClick={nextChapter} title="Next chapter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6h2v12h-2zm-3.5 6L4 6v12z" />
              </svg>
            </CtrlBtn>
            
            {/* Speed toggle */}
            <button
              onClick={() => {
                const speeds = [1, 1.25, 1.5, 2, 2.5, 3]
                const idx = speeds.indexOf(playbackRate)
                setPlaybackRate(speeds[(idx + 1) % speeds.length])
              }}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, height: 32, padding: '0 10px', cursor: 'pointer',
                color: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                marginLeft: 4, width: 44,
              }}
              title="Playback speed"
            >
              {playbackRate}x
            </button>
          </div>

          {/* Time */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 120px', justifyContent: 'flex-end', maxWidth: 180 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />}
            </svg>
            <input
              type="range" min="0" max="1" step="0.02" value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#C9A96E', cursor: 'pointer', height: 3 }}
            />
          </div>

          {/* Chapter list toggle */}
          <button
            onClick={() => setShowChapters(p => !p)}
            style={{
              background: showChapters ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(201,169,110,0.3)', borderRadius: 8, padding: '6px 12px',
              color: showChapters ? '#C9A96E' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
            Chapters
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            title="Close player"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Chapter drawer */}
        <AnimatePresence>
          {showChapters && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 240 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ height: 240, overflowY: 'auto', padding: '8px 0' }}>
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    onClick={() => { setChapterIndex(i); setShowChapters(false) }}
                    style={{
                      width: '100%', padding: '9px 24px', border: 'none',
                      background: i === chapterIndex ? 'rgba(201,169,110,0.15)' : 'transparent',
                      color: i === chapterIndex ? '#C9A96E' : 'rgba(255,255,255,0.65)',
                      textAlign: 'left', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: i === chapterIndex ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 10, opacity: 0.5, minWidth: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</span>
                    {ch.duration && <span style={{ fontSize: 11, opacity: 0.4 }}>{ch.duration}</span>}
                    {i === chapterIndex && isPlaying && (
                      <span style={{ display: 'flex', gap: 2 }}>
                        {[0, 1, 2].map(b => (
                          <motion.span key={b} style={{ display: 'block', width: 2, height: 10, background: '#C9A96E', borderRadius: 2 }}
                            animate={{ scaleY: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: b * 0.2 }} />
                        ))}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

function CtrlBtn({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: 'rgba(255,255,255,0.07)', cursor: 'pointer',
        color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'background 0.15s, color 0.15s',
        position: 'relative', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.2)'; e.currentTarget.style.color = '#C9A96E' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
    >
      {children}
    </button>
  )
}
