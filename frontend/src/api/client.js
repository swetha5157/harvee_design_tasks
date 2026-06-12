const BASE = import.meta.env.VITE_API_URL || '/api'

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`)
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: async (path, file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data
  }
}
