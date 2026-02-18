import { useState, useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../lib/firebase'
import { IconUser, IconLock } from '../components/Icons'
import styles from './AccountSettings.module.css'

const PROFILES_COLLECTION = 'profiles'

export default function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile?.full_name, profile?.phone])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      const updates = {
        full_name: displayName.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      }
      await setDoc(doc(db, PROFILES_COLLECTION, user.uid), updates, { merge: true })
      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() })
      }
      await refreshProfile()
      setProfileSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setError(null)
    setPasswordSaved(false)
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setSavingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <p className={styles.subtitle}>Log in to manage your account.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><IconUser /></span>
          Profile Information
        </h2>
        <form onSubmit={handleSaveProfile} className={styles.form}>
          {profileSaved && <p className={styles.success}>Profile updated.</p>}
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={user.email ?? ''}
                disabled
              />
              <span className={styles.helper}>Email cannot be changed</span>
            </div>
            <div className={styles.fieldPhone}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          <button type="submit" className={styles.btnAction} disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><IconLock /></span>
          Password Settings
        </h2>
        <form onSubmit={handleChangePassword} className={styles.form}>
          {passwordSaved && <p className={styles.success}>Password changed successfully.</p>}
          <div className={styles.passwordGrid}>
            <div className={styles.field}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className={styles.fieldConfirm}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <button type="submit" className={styles.btnAction} disabled={savingPassword}>
            {savingPassword ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  )
}
