const GUTENDEX_BASE_URL = import.meta.env.VITE_GUTENDEX_BASE_URL || 'https://gutendex.com'

function inferCategory(subjects = [], title = '') {
  const text = `${subjects.join(' ')} ${title}`.toLowerCase()
  if (/adventure|voyage|journey|sea|travel/.test(text)) return 'Adventure'
  if (/romance|love|courtship|marriage/.test(text)) return 'Romance'
  if (/mystery|detective|crime|murder/.test(text)) return 'Mystery'
  if (/philosophy|ethics|stoic|reason|justice/.test(text)) return 'Philosophy'
  if (/science|scientific|future|machine|technology/.test(text)) return 'Science'
  if (/poetry|poem|verse/.test(text)) return 'Poetry'
  return 'Classic'
}

/**
 * Fetch books from Project Gutenberg via Gutendex API
 * @param {Object} options - Query options
 * @param {string} options.search - Search query
 * @param {string} options.topic - Topic/genre filter
 * @param {number} options.page - Page number
 * @param {number} options.limit - Results per page (max 32)
 * @returns {Promise<Object>} - Books data with results array
 */
export async function fetchGutenbergBooks({ search = '', topic = '', page = 1, limit = 24 } = {}) {
  const params = new URLSearchParams()

  if (search) params.append('search', search)
  if (topic) params.append('topic', topic)
  params.append('page', page)

  const url = `${GUTENDEX_BASE_URL}/books?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gutenberg API request failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  // Normalize Gutenberg book format to match our app's structure
  const normalizedBooks = data.results
    ?.slice(0, limit)
    .map((book, index) => {
      // Get the best available format URL (prefer HTML, then EPUB, then TXT)
      const formats = book.formats || {}
      const readUrl =
        formats['text/html'] ||
        formats['application/epub+zip'] ||
        formats['text/plain'] ||
        formats['text/html; charset=utf-8'] ||
        null

      // Get cover image from formats
      const cover =
        formats['image/jpeg'] ||
        `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg` ||
        book.cover_url ||
        null

      const downloadCount = book.download_count || 0
      const rating = Math.max(3.8, Math.min(5, 4 + Math.log10(downloadCount + 10) / 5))
      const estimatedPages = Math.max(120, Math.min(1200, Math.round(downloadCount / 35) || 240))
      const primaryAuthor = book.authors?.[0]

      return {
        id: `gutenberg-${book.id}`,
        gutenbergId: book.id,
        source: 'gutenberg',
        title: book.title || 'Untitled Book',
        author: book.authors?.map(a => a.name).join(', ') || 'Unknown author',
        cover: cover,
        description: book.summaries?.[0] || book.subjects?.join(', ') || 'Classic literature from Project Gutenberg.',
        category: inferCategory(book.subjects || [], book.title || ''),
        rating: Number(rating.toFixed(1)),
        pages: estimatedPages,
        year: primaryAuthor?.birth_year || null,
        readUrl: readUrl,
        audioUrl: null, // Gutenberg doesn't provide audio
        subjects: book.subjects || [],
        languages: book.languages || [],
        downloadCount,
      }
    }) || []

  return {
    books: normalizedBooks,
    count: data.count || 0,
    next: data.next || null,
    previous: data.previous || null,
  }
}

/**
 * Get a specific book by ID from Project Gutenberg
 * @param {number|string} bookId - The Gutenberg book ID
 * @returns {Promise<Object>} - Normalized book data
 */
export async function fetchGutenbergBookById(bookId) {
  const url = `${GUTENDEX_BASE_URL}/books/${bookId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gutenberg API request failed (${response.status}): ${text}`)
  }

  const book = await response.json()

  const formats = book.formats || {}
  const readUrl =
    formats['text/html'] ||
    formats['application/epub+zip'] ||
    formats['text/plain'] ||
    formats['text/html; charset=utf-8'] ||
    null

  const cover =
    formats['image/jpeg'] ||
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg` ||
    book.cover_url ||
    null

  const downloadCount = book.download_count || 0
  const rating = Math.max(3.8, Math.min(5, 4 + Math.log10(downloadCount + 10) / 5))
  const estimatedPages = Math.max(120, Math.min(1200, Math.round(downloadCount / 35) || 240))
  const primaryAuthor = book.authors?.[0]

  return {
    id: `gutenberg-${book.id}`,
    gutenbergId: book.id,
    source: 'gutenberg',
    title: book.title || 'Untitled Book',
    author: book.authors?.map(a => a.name).join(', ') || 'Unknown author',
    cover: cover,
    description: book.summaries?.[0] || book.subjects?.join(', ') || 'Classic literature from Project Gutenberg.',
    category: inferCategory(book.subjects || [], book.title || ''),
    rating: Number(rating.toFixed(1)),
    pages: estimatedPages,
    year: primaryAuthor?.birth_year || null,
    readUrl: readUrl,
    audioUrl: null,
    subjects: book.subjects || [],
    languages: book.languages || [],
    downloadCount,
  }
}

/**
 * Search books by topic/subject from Project Gutenberg
 * @param {string} topic - Topic to search for
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of normalized books
 */
export async function fetchGutenbergBooksByTopic(topic, limit = 12) {
  return fetchGutenbergBooks({ topic, limit })
}
