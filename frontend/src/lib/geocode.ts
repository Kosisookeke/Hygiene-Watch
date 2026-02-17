/**
 * Geocoding via OpenStreetMap Nominatim (free, no API key).
 * Use User-Agent per Nominatim usage policy.
 * Respect rate limit: max 1 request per second.
 */

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export async function searchAddressSuggestions(
  query: string,
  limit = 5
): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (!q || q.length < 3) return []
  try {
    const params = new URLSearchParams({
      q,
      format: 'json',
      limit: String(limit),
      addressdetails: '1',
    })
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'User-Agent': 'HygieneWatch/1.0' } }
    )
    if (!res.ok) return []
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
    if (!data?.length) return []
    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }))
  } catch {
    return []
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const q = address.trim()
  if (!q) return null
  try {
    const params = new URLSearchParams({
      q,
      format: 'json',
      limit: '1',
    })
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'User-Agent': 'HygieneWatch/1.0' } }
    )
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
    if (!data?.length) return null
    const first = data[0]
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name,
    }
  } catch {
    return null
  }
}
