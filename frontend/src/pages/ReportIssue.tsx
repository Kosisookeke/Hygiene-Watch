import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../contexts/AuthContext'
import { addReport } from '../lib/firestore'
import { searchAddressSuggestions } from '../lib/geocode'
import type { GeocodeResult } from '../lib/geocode'
import { uploadImage, hasCloudinaryConfig } from '../lib/cloudinary'
import { IconMapPin, IconCamera, IconUpload } from '../components/Icons'
import type { ReportIssueCategory } from '../lib/types'
import styles from './ReportIssue.module.css'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const ISSUE_CATEGORIES: ReportIssueCategory[] = [
  'Waste Management',
  'Water Safety',
  'Sanitation',
  'Drainage',
  'Personal Hygiene',
  'Food Safety',
  'Other',
]

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792] // Lagos, Nigeria

function MapClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 16)
  }, [map, center])
  return null
}

export default function ReportIssue() {
  const { user, profile } = useAuth()
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState<ReportIssueCategory>('Waste Management')
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingSuggestions, setSearchingSuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const locationWrapRef = useRef<HTMLDivElement>(null)

  // Debounced address autocomplete
  useEffect(() => {
    const q = location.trim()
    if (q.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
    suggestTimerRef.current = setTimeout(async () => {
      setSearchingSuggestions(true)
      setShowSuggestions(true)
      try {
        const results = await searchAddressSuggestions(q, 5)
        setSuggestions(results)
      } catch {
        setSuggestions([])
      } finally {
        setSearchingSuggestions(false)
      }
    }, 400)
    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
    }
  }, [location])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationWrapRef.current && !locationWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = useCallback((s: GeocodeResult) => {
    setLocation(s.displayName)
    setMapPosition([s.lat, s.lng])
    setSuggestions([])
    setShowSuggestions(false)
  }, [])

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setGeocoding(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setMapPosition([latitude, longitude])
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        setGeocoding(false)
      },
      () => {
        setError('Could not get your location. Try entering an address.')
        setGeocoding(false)
      }
    )
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      let photoUrl: string | undefined
      if (photo) {
        if (hasCloudinaryConfig()) {
          photoUrl = await uploadImage(photo)
        } else {
          setError('Image upload not configured. Add Cloudinary credentials to .env')
          setSubmitting(false)
          return
        }
      }
      const title = `${category} - ${(location || 'Unspecified location').slice(0, 50)}`
      await addReport({
        title,
        description: description.trim(),
        category,
        location: location.trim() || undefined,
        photoUrl,
        lat: mapPosition?.[0],
        lng: mapPosition?.[1],
        submittedBy: profile?.full_name || user.displayName || user.email || 'Anonymous',
        submittedById: user.uid,
      })
      setDescription('')
      setLocation('')
      setCategory('Waste Management')
      setMapPosition(null)
      setPhoto(null)
      setPhotoPreview(null)
      setSuggestions([])
      setShowSuggestions(false)
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Report an Issue</h1>
        <p className={styles.subtitle}>
          <Link to="/login">Log in</Link> to report a hygiene or sanitation issue.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {sent && <p className={styles.success} role="status">Report submitted successfully.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.twoCol}>
          <div className={styles.leftCol}>
            <section className={styles.section}>
              <div className={styles.field} ref={locationWrapRef}>
                <label htmlFor="report-location">
                  <IconMapPin /> Location
                </label>
                <div className={styles.locationRow}>
                  <div className={styles.locationInputWrap}>
                    <input
                      id="report-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onFocus={() => location.trim().length >= 3 && (suggestions.length > 0 || searchingSuggestions) && setShowSuggestions(true)}
                      placeholder="Start typing address (e.g. 1 eziowelle street abule oshun)"
                      className={styles.input}
                      autoComplete="off"
                      aria-autocomplete="list"
                      aria-expanded={showSuggestions}
                    />
                    {showSuggestions && location.trim().length >= 3 ? (
                      <ul className={styles.suggestionsList} role="listbox">
                        {searchingSuggestions ? (
                          <li className={styles.suggestionItemDisabled}>Searching…</li>
                        ) : suggestions.length > 0 ? (
                          suggestions.map((s, i) => (
                            <li
                              key={`${s.lat}-${s.lng}-${i}`}
                              className={styles.suggestionItem}
                              onClick={() => handleSelectSuggestion(s)}
                              role="option"
                            >
                              {s.displayName}
                            </li>
                          ))
                        ) : (
                          <li className={styles.suggestionItemDisabled}>No locations found</li>
                        )}
                      </ul>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={styles.locateBtn}
                    onClick={handleUseCurrentLocation}
                    disabled={geocoding}
                    title="Use current location"
                    aria-label="Use current GPS location"
                  >
                    <IconMapPin />
                  </button>
                </div>
                <p className={styles.helper}>Select from suggestions or click map to set location.</p>
              </div>

              <div className={styles.field}>
                <label htmlFor="report-category">Issue Category</label>
                <select
                  id="report-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportIssueCategory)}
                  className={styles.select}
                >
                  {ISSUE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="report-description">Description</label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the sanitation issue in detail..."
                  required
                  minLength={20}
                  rows={4}
                  className={styles.textarea}
                />
                <p className={styles.helper}>Min. 20 characters.</p>
              </div>

              <div className={styles.field}>
                <label>
                  <IconCamera /> Upload Image
                </label>
                <div
                  className={styles.uploadZone}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add(styles.dragOver) }}
                  onDragLeave={(e) => e.currentTarget.classList.remove(styles.dragOver)}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove(styles.dragOver)
                    const file = e.dataTransfer.files[0]
                    if (file) {
                      const input = fileInputRef.current
                      if (input) {
                        const dt = new DataTransfer()
                        dt.items.add(file)
                        input.files = dt.files
                        handlePhotoChange({ target: input } as React.ChangeEvent<HTMLInputElement>)
                      }
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handlePhotoChange}
                    className={styles.fileInput}
                  />
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className={styles.previewImg} />
                  ) : (
                    <>
                      <span className={styles.uploadIcon}><IconUpload /></span>
                      <span>Click to upload or drag and drop</span>
                      <span className={styles.uploadHint}>PNG, JPG up to 10MB</span>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
                <Link to="/dashboard" className={styles.cancel}>Cancel</Link>
              </div>
            </section>
          </div>

          <div className={styles.rightCol}>
            <section className={styles.mapSection}>
              <div className={styles.mapWrap}>
                <MapContainer
                  center={mapPosition || DEFAULT_CENTER}
                  zoom={mapPosition ? 16 : 12}
                  className={styles.map}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler setPosition={setMapPosition} />
                  {mapPosition && (
                    <>
                      <Marker position={mapPosition} />
                      <MapCenterUpdater center={mapPosition} />
                    </>
                  )}
                </MapContainer>
                <p className={styles.mapHint}>Click the map to set location</p>
              </div>
            </section>

            <section className={styles.guidelinesSection}>
              <h2 className={styles.guidelinesTitle}>Report Guidelines</h2>
              <ul className={styles.guidelinesList}>
                <li>Ensure the location is accurate</li>
                <li>Upload clear photos of the issue</li>
                <li>Select the correct issue category</li>
                <li>Provide a detailed description (min. 20 characters)</li>
              </ul>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}
