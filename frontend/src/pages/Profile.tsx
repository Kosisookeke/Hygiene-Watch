import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { subscribeReportsByUser, subscribeTipsByUser, logActivity } from '../lib/firestore'
import { uploadImage, hasCloudinaryConfig } from '../lib/cloudinary'
import {
  IconUser,
  IconMapPin,
  IconMail,
  IconPhone,
  IconCamera,
  IconPencil,
  IconShield,
  IconSettings,
  IconRefreshCw,
} from '../components/Icons'
import styles from './Profile.module.css'

const PROFILES_COLLECTION = 'profiles'

function formatMemberSince(createdAt: string): string {
  try {
    const d = new Date(createdAt)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [reportsCount, setReportsCount] = useState(0)
  const [tipsCount, setTipsCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [aboutMe, setAboutMe] = useState(profile?.about_me ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [refreshingMetrics, setRefreshingMetrics] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setLocation(profile?.location ?? '')
    setPhone(profile?.phone ?? '')
    setAboutMe(profile?.about_me ?? '')
  }, [profile?.full_name, profile?.location, profile?.phone, profile?.about_me])

  useEffect(() => {
    if (!user) return
    const unsubR = subscribeReportsByUser(user.uid, (reports) => setReportsCount(reports.length))
    const unsubT = subscribeTipsByUser(user.uid, (tips) => setTipsCount(tips.length))
    return () => {
      unsubR?.()
      unsubT?.()
    }
  }, [user?.uid])

  const hygieneScore = 50 // Placeholder - could be computed from reports/tips

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (!hasCloudinaryConfig()) {
      setError('Image upload not configured. Add Cloudinary credentials to .env')
      return
    }
    setError(null)
    setUploadingPhoto(true)
    try {
      const url = await uploadImage(file)
      await setDoc(doc(db, PROFILES_COLLECTION, user.uid), {
        avatar_url: url,
        updated_at: new Date().toISOString(),
      }, { merge: true })
      await refreshProfile()
      await logActivity({ userId: user.uid, action: 'photo_updated', description: 'Profile photo updated' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSaving(true)
    setSaved(false)
    try {
      const profileRef = doc(db, PROFILES_COLLECTION, user.uid)
      const payload = {
        full_name: fullName.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        about_me: aboutMe.trim() || null,
        email: user.email ?? null,
        updated_at: new Date().toISOString(),
      }
      await setDoc(profileRef, payload, { merge: true })
      await refreshProfile()
      await logActivity({ userId: user.uid, action: 'profile_updated', description: 'Profile updated' })
      setSaved(true)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>
          <Link to="/login">Log in</Link> to view and edit your profile.
        </p>
      </div>
    )
  }

  if (refreshingMetrics) {
    return <Loader />
  }

  const handleRefreshMetrics = async () => {
    setRefreshingMetrics(true)
    try {
      await refreshProfile()
      await new Promise((r) => setTimeout(r, 500))
    } finally {
      setRefreshingMetrics(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Profile Summary Card */}
      <section className={styles.profileCard}>
        <div className={styles.avatarWrap}>
          <div
            className={styles.avatar}
            style={{
              backgroundImage: profile?.avatar_url
                ? `url(${profile.avatar_url})`
                : undefined,
            }}
          >
            {!profile?.avatar_url && (
              <span className={styles.avatarPlaceholder}><IconUser /></span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handlePhotoChange}
            aria-label="Change photo"
          />
          <button
            type="button"
            className={styles.cameraBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            aria-label="Change photo"
          >
            <IconCamera />
          </button>
        </div>
        <div className={styles.profileHeader}>
          <h2 className={styles.profileName}>
            {profile?.full_name || user.displayName || user.email || 'User'}
          </h2>
          <p className={styles.memberSince}>
            Member since {formatMemberSince(profile?.created_at || '')}
          </p>
          <div className={styles.badgesRow}>
            <div className={styles.badges}>
              <span className={styles.badge}>Reports: {reportsCount}</span>
              <span className={styles.badge}>Hygiene Score: {hygieneScore}%</span>
              <span className={styles.badge}>Tips: {tipsCount}</span>
            </div>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setEditing(!editing)}
            >
              <IconPencil /> Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Personal Information & Quick Actions - side by side */}
      <div className={styles.sectionsRow}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Personal Information</h3>
        {editing ? (
          <form onSubmit={handleSave} className={styles.form}>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {saved && <p className={styles.success}>Profile updated.</p>}
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>FULL NAME</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className={styles.field}>
                <label>EMAIL</label>
                <input value={user.email ?? ''} disabled placeholder="Email" />
              </div>
              <div className={styles.field}>
                <label>LOCATION</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Rwanda"
                />
              </div>
              <div className={styles.field}>
                <label>PHONE</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 07982273728"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>ABOUT ME</label>
              <textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><IconUser /> FULL NAME</span>
              <span>{profile?.full_name || user.displayName || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><IconMail /> EMAIL</span>
              <span>{user.email || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><IconMapPin /> LOCATION</span>
              <span>{profile?.location || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><IconPhone /> PHONE</span>
              <span>{profile?.phone || '—'}</span>
            </div>
            <div className={styles.infoItemFull}>
              <span className={styles.infoLabel}>ABOUT ME</span>
              <span>{profile?.about_me || '—'}</span>
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActions}>
          <Link to="/profile/privacy-settings" className={styles.actionBtn}>
            <IconShield /> Privacy Settings
          </Link>
          <Link to="/profile/account-settings" className={styles.actionBtn}>
            <IconSettings /> Account Settings
          </Link>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleRefreshMetrics}
          >
            <IconRefreshCw /> Refresh Metrics
          </button>
        </div>
      </section>
      </div>
    </div>
  )
}
