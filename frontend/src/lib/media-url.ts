const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1'

const getApiOrigin = () => {
  try {
    return new URL(API_URL).origin
  } catch {
    return 'http://127.0.0.1:8080'
  }
}

const API_ORIGIN = getApiOrigin()

export const resolveMediaUrl = (value?: string | null) => {
  const raw = value?.trim()
  if (!raw) {
    return ''
  }

  if (raw.startsWith('/uploads/')) {
    return `${API_ORIGIN}${raw}`
  }

  if (raw.startsWith('uploads/')) {
    return `${API_ORIGIN}/${raw}`
  }

  try {
    const parsed = new URL(raw)

    // Keep external image hosts intact, but normalize local upload URLs to the active API origin.
    if ((parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') && parsed.pathname.startsWith('/uploads/')) {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`
    }

    return raw
  } catch {
    return raw
  }
}

export const normalizeImageUrlForStorage = (value: string) => resolveMediaUrl(value)
