const buildCandidateUrls = (bookId) => [
  `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt.utf-8`,
  `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`,
  `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
  `https://www.gutenberg.org/files/${bookId}/${bookId}.txt`,
]

async function fetchFirstNonEmptyText(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/plain,text/*;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; BookReader/1.0; +https://vercel.com)',
        },
      })

      if (!response.ok) continue

      const text = await response.text()
      if (text && text.trim().length > 0) {
        return { text, sourceUrl: url }
      }
    } catch {
      // Try next source URL.
    }
  }

  return null
}

export default async function handler(req, res) {
  const rawBookId = req.query?.bookId
  const bookId = Number.parseInt(String(rawBookId ?? ''), 10)

  if (!Number.isInteger(bookId) || bookId <= 0) {
    res.status(400).json({ error: 'Invalid or missing bookId query parameter.' })
    return
  }

  const result = await fetchFirstNonEmptyText(buildCandidateUrls(bookId))

  if (!result) {
    res.status(502).json({ error: 'Unable to fetch Gutenberg text from upstream sources.' })
    return
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.status(200).send(result.text)
}
