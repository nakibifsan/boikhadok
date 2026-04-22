const LIBRIVOX_BASE_URL = import.meta.env.VITE_LIBRIVOX_BASE_URL || 'https://librivox.org/api'
const LIBRIVOX_CDN_URL = 'https://archive.org/download'

/**
 * Fetch audiobooks from LibriVox API
 * @param {Object} options - Query options
 * @param {string} options.search - Search query for title/author (uses title search)
 * @param {string} options.author - Search by author last name
 * @param {string} options.title - Search by title
 * @param {string} options.genre - Genre filter
 * @param {number} options.since - UNIX timestamp - get books cataloged since that time
 * @param {number} options.limit - Max results (default 24, max 50)
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.extended - Get full data set (default true)
 * @param {boolean} options.coverart - Include cover art links (default true)
 * @param {string[]} options.fields - Specific fields to return (optional)
 * @returns {Promise<Array>} - Array of normalized audiobook data
 */
export async function fetchLibrivoxBooks({
  search = '',
  author = '',
  title = '',
  genre = '',
  since = null,
  limit = 24,
  offset = 0,
  extended = true,
  coverart = true,
  fields = null,
} = {}) {
  const params = new URLSearchParams()

  // Search parameters - per API docs, can use ^ to anchor search term
  if (search) {
    params.append('title', search)
  }
  if (title) {
    params.append('title', title)
  }
  if (author) {
    params.append('author', author)
  }
  if (genre) {
    params.append('genre', genre)
  }
  if (since) {
    params.append('since', since.toString())
  }

  // Response options
  if (extended) {
    params.append('extended', '1')
  }
  if (coverart) {
    params.append('coverart', '1')
  }

  // Field selection - per API docs: &fields={id,title,authors,url_rss}
  if (fields && Array.isArray(fields) && fields.length > 0) {
    params.append('fields', `{${fields.join(',')}}`)
  }

  // Pagination
  params.append('format', 'json')
  params.append('limit', Math.min(limit, 50).toString()) // API max is 50
  params.append('offset', offset.toString())

  const url = `${LIBRIVOX_BASE_URL}/feed/audiobooks/?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LibriVox API request failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  // Handle both single book and array responses
  const books = Array.isArray(data.books) ? data.books : data.books ? [data.books] : []

  // Normalize LibriVox book format to match our app's structure
  const normalizedBooks = books.map((book, index) => {
    // Get audio URL from the zip file or RSS feed
    const audioUrl = book.url_zip_file || book.url_rss || null

    // Construct cover URL - API returns coverart fields when coverart=1
    const cover =
      book.coverart_thumbnail ||
      book.coverart_jpg ||
      book.url_image ||
      book.cover_url ||
      null

    // Get genres array if available (from extended data)
    const genres = book.genres || (book.genre ? [book.genre] : [])
    const genreText = genres.join(', ') || book.genre || ''

    // Build description from various fields
    const descriptionParts = []
    if (book.description && book.description !== 'null') {
      descriptionParts.push(book.description)
    }
    if (genreText) {
      descriptionParts.push(`Genre: ${genreText}`)
    }
    if (book.language) {
      descriptionParts.push(`Language: ${book.language}`)
    }
    if (book.totaltime) {
      descriptionParts.push(`Duration: ${book.totaltime}`)
    }
    if (book.copyright_year) {
      descriptionParts.push(`Year: ${book.copyright_year}`)
    }

    const description = descriptionParts.length > 0
      ? descriptionParts.join(' | ')
      : 'Free audiobook from LibriVox - public domain literature read by volunteers.'

    return {
      id: `librivox-${book.id || index}`,
      source: 'librivox',
      title: book.title || 'Untitled Audiobook',
      author: book.authors?.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).join(', ') ||
              book.author || 'Unknown author',
      cover: cover,
      description: description,
      readUrl: null, // LibriVox only provides audio
      audioUrl: audioUrl,
      genre: genreText,
      genres: genres,
      language: book.language || '',
      duration: book.totaltime || '',
      durationSecs: book.totaltimesecs || 0,
      copyrightYear: book.copyright_year || '',
      numSections: book.num_sections || 0,
      urlProject: book.url_project || '',
      urlLibrivox: book.url_librivox || '',
      urlIArchive: book.url_iarchive || '',
      urlTextSource: book.url_text_source || '',
      date: book.release_date || '',
      rssUrl: book.url_rss || '',
    }
  })

  return normalizedBooks
}

/**
 * Get a specific audiobook by ID from LibriVox
 * @param {number|string} bookId - The LibriVox book ID
 * @param {boolean} options.extended - Get full data set (default true)
 * @param {boolean} options.coverart - Include cover art links (default true)
 * @returns {Promise<Object>} - Normalized audiobook data
 */
export async function fetchLibrivoxBookById(bookId, { extended = true, coverart = true } = {}) {
  const cleanId = bookId.toString().replace('librivox-', '')
  const params = new URLSearchParams()
  params.append('id', cleanId)
  params.append('format', 'json')
  if (extended) params.append('extended', '1')
  if (coverart) params.append('coverart', '1')

  const url = `${LIBRIVOX_BASE_URL}/feed/audiobooks/?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LibriVox API request failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  const book = Array.isArray(data.books) ? data.books[0] : data.books

  if (!book) {
    throw new Error('Audiobook not found')
  }

  const audioUrl = book.url_zip_file || book.url_rss || null
  const cover =
    book.coverart_thumbnail ||
    book.coverart_jpg ||
    book.url_image ||
    book.cover_url ||
    null

  const genres = book.genres || (book.genre ? [book.genre] : [])
  const genreText = genres.join(', ') || book.genre || ''

  const descriptionParts = []
  if (book.description && book.description !== 'null') {
    descriptionParts.push(book.description)
  }
  if (genreText) {
    descriptionParts.push(`Genre: ${genreText}`)
  }
  if (book.language) {
    descriptionParts.push(`Language: ${book.language}`)
  }
  if (book.totaltime) {
    descriptionParts.push(`Duration: ${book.totaltime}`)
  }
  if (book.copyright_year) {
    descriptionParts.push(`Year: ${book.copyright_year}`)
  }

  const description = descriptionParts.length > 0
    ? descriptionParts.join(' | ')
    : 'Free audiobook from LibriVox - public domain literature read by volunteers.'

  return {
    id: `librivox-${book.id}`,
    source: 'librivox',
    title: book.title || 'Untitled Audiobook',
    author: book.authors?.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).join(', ') ||
            book.author || 'Unknown author',
    cover: cover,
    description: description,
    readUrl: null,
    audioUrl: audioUrl,
    genre: genreText,
    genres: genres,
    language: book.language || '',
    duration: book.totaltime || '',
    durationSecs: book.totaltimesecs || 0,
    copyrightYear: book.copyright_year || '',
    numSections: book.num_sections || 0,
    urlProject: book.url_project || '',
    urlLibrivox: book.url_librivox || '',
    urlIArchive: book.url_iarchive || '',
    urlTextSource: book.url_text_source || '',
    date: book.release_date || '',
    rssUrl: book.url_rss || '',
  }
}

/**
 * Get featured/popular audiobooks from LibriVox
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of normalized audiobooks
 */
export async function fetchFeaturedLibrivoxBooks(limit = 12) {
  return fetchLibrivoxBooks({ limit })
}

/**
 * Get audiobooks by genre from LibriVox
 * @param {string} genre - Genre to filter by
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of normalized audiobooks
 */
export async function fetchLibrivoxBooksByGenre(genre, limit = 12) {
  return fetchLibrivoxBooks({ genre, limit })
}

/**
 * Search audiobooks by author last name
 * @param {string} lastName - Author's last name to search for
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of normalized audiobooks
 */
export async function fetchLibrivoxBooksByAuthor(lastName, limit = 12) {
  return fetchLibrivoxBooks({ author: lastName, limit })
}

/**
 * Get recently cataloged audiobooks from LibriVox
 * @param {number} daysBack - Number of days to look back (default 30)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of normalized audiobooks
 */
export async function fetchRecentLibrivoxBooks(daysBack = 30, limit = 12) {
  const since = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60)
  return fetchLibrivoxBooks({ since, limit, extended: true, coverart: true })
}

/**
 * Fetch audio tracks (sections) for a specific LibriVox project
 * Endpoint: https://librivox.org/api/feed/audiotracks
 * @param {number|string} projectId - The LibriVox project ID
 * @returns {Promise<Array>} - Array of audio track data
 */
export async function fetchLibrivoxAudioTracks(projectId) {
  const cleanId = projectId.toString().replace('librivox-', '')
  const params = new URLSearchParams()
  params.append('project_id', cleanId)
  params.append('format', 'json')

  const url = `${LIBRIVOX_BASE_URL}/feed/audiotracks/?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LibriVox audiotracks API request failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  // Handle both single section and array responses
  const sections = Array.isArray(data.sections)
    ? data.sections
    : data.sections
      ? [data.sections]
      : []

  return sections.map((section) => ({
    id: section.id,
    projectId: section.project_id,
    title: section.section_title || section.title || 'Untitled Track',
    reader: section.reader || '',
    duration: section.duration || '',
    listenUrl: section.listen_url || '',
    mp3Url: section.mp3url || section.mp3_url || '',
    oggUrl: section.oggurl || section.ogg_url || '',
    sectionNumber: section.section_number || 0,
  }))
}

/**
 * Search for authors in LibriVox catalog
 * Endpoint: https://librivox.org/api/feed/authors
 * @param {Object} options - Query options
 * @param {number} options.id - Author ID
 * @param {string} options.lastName - Author's last name (exact match)
 * @returns {Promise<Array>} - Array of author data
 */
export async function fetchLibrivoxAuthors({ id = null, lastName = '' } = {}) {
  const params = new URLSearchParams()
  params.append('format', 'json')

  if (id) {
    params.append('id', id.toString())
  }
  if (lastName) {
    params.append('last_name', lastName)
  }

  const url = `${LIBRIVOX_BASE_URL}/feed/authors/?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LibriVox authors API request failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  // Handle both single author and array responses
  const authors = Array.isArray(data.authors)
    ? data.authors
    : data.authors
      ? [data.authors]
      : []

  return authors.map((author) => ({
    id: author.id,
    firstName: author.first_name || '',
    lastName: author.last_name || '',
    fullName: `${author.first_name || ''} ${author.last_name || ''}`.trim(),
  }))
}
