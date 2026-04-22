const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY
const rapidApiBaseUrl = import.meta.env.VITE_RAPIDAPI_BASE_URL || ''
const rapidApiDefaultHost = import.meta.env.VITE_RAPIDAPI_BOOKS_HOST || ''

if (!rapidApiKey) {
  throw new Error('Missing RapidAPI key. Set VITE_RAPIDAPI_KEY in your .env.local file.')
}

export async function rapidApiFetch(path, { method = 'GET', headers = {}, body, host } = {}) {
  const endpoint = path.startsWith('/') ? path : `/${path}`
  const apiHost = host || rapidApiDefaultHost

  const requestUrl = endpoint.startsWith('http')
    ? endpoint
    : rapidApiBaseUrl
      ? `${rapidApiBaseUrl}${endpoint}`
      : apiHost
        ? `https://${apiHost}${endpoint}`
        : ''

  if (!requestUrl) {
    throw new Error('Missing RapidAPI URL configuration. Set VITE_RAPIDAPI_BASE_URL or provide VITE_RAPIDAPI_BOOKS_HOST.')
  }

  const response = await fetch(requestUrl, {
    method,
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      ...(apiHost ? { 'X-RapidAPI-Host': apiHost } : {}),
      ...headers,
    },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`RapidAPI request failed (${response.status}): ${text}`)
    error.status = response.status
    error.responseText = text
    error.retryAfter = response.headers.get('Retry-After')
    throw error
  }

  return response.json()
}
