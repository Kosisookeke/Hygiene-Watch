import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import { db } from '../lib/firebase'
import { logActivity } from '../lib/firestore'
import styles from './PrivacySettings.module.css'

const PROFILES_COLLECTION = 'profiles'

type PreferenceKey =
  | 'email_notifications'
  | 'research_participation'
  | 'report_updates'
  | 'marketing_communications'
  | 'usage_analytics'
  | 'academic_research'
  | 'third_party_services'

const DEFAULT_PREFS: Record<PreferenceKey, boolean> = {
  email_notifications: true,
  research_participation: false,
  report_updates: true,
  marketing_communications: false,
  usage_analytics: true,
  academic_research: false,
  third_party_services: false,
}

export default function PrivacySettings() {
  const { user, refreshProfile } = useAuth()
  const [prefs, setPrefs] = useState<Record<PreferenceKey, boolean>>(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, PROFILES_COLLECTION, user.uid))
        if (snap.exists()) {
          const data = snap.data()
          setPrefs({
            email_notifications: Boolean(data?.email_notifications ?? DEFAULT_PREFS.email_notifications),
            research_participation: Boolean(data?.research_participation ?? DEFAULT_PREFS.research_participation),
            report_updates: Boolean(data?.report_updates ?? DEFAULT_PREFS.report_updates),
            marketing_communications: Boolean(data?.marketing_communications ?? DEFAULT_PREFS.marketing_communications),
            usage_analytics: Boolean(data?.usage_analytics ?? DEFAULT_PREFS.usage_analytics),
            academic_research: Boolean(data?.academic_research ?? DEFAULT_PREFS.academic_research),
            third_party_services: Boolean(data?.third_party_services ?? DEFAULT_PREFS.third_party_services),
          })
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const toggle = (key: PreferenceKey) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      await setDoc(
        doc(db, PROFILES_COLLECTION, user.uid),
        {
          email_notifications: prefs.email_notifications,
          research_participation: prefs.research_participation,
          report_updates: prefs.report_updates,
          marketing_communications: prefs.marketing_communications,
          usage_analytics: prefs.usage_analytics,
          academic_research: prefs.academic_research,
          third_party_services: prefs.third_party_services,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      )
      await refreshProfile()
      await logActivity({ userId: user.uid, action: 'privacy_updated', description: 'Privacy settings updated' })
      setSaved(true)
    } catch {
      // error handling
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <p className={styles.subtitle}>Log in to manage your privacy settings.</p>
      </div>
    )
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Preferences</h2>
        <div className={styles.preferenceList}>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Email Notifications</span>
              <span className={styles.preferenceDesc}>Get updates about activity and contributions</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.email_notifications}
              className={`${styles.toggle} ${prefs.email_notifications ? styles.toggleOn : ''}`}
              onClick={() => toggle('email_notifications')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Research Participation</span>
              <span className={styles.preferenceDesc}>Allow researchers to contact you about hygiene insights</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.research_participation}
              className={`${styles.toggle} ${prefs.research_participation ? styles.toggleOn : ''}`}
              onClick={() => toggle('research_participation')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Report Updates</span>
              <span className={styles.preferenceDesc}>Notify me when my reports or tips get updates</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.report_updates}
              className={`${styles.toggle} ${prefs.report_updates ? styles.toggleOn : ''}`}
              onClick={() => toggle('report_updates')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Marketing Communications</span>
              <span className={styles.preferenceDesc}>Receive news about features and events</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.marketing_communications}
              className={`${styles.toggle} ${prefs.marketing_communications ? styles.toggleOn : ''}`}
              onClick={() => toggle('marketing_communications')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data Sharing & Analytics</h2>
        <div className={styles.preferenceList}>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Usage Analytics</span>
              <span className={styles.preferenceDesc}>Help improve HygieneWatch by sharing anonymous usage data</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.usage_analytics}
              className={`${styles.toggle} ${prefs.usage_analytics ? styles.toggleOn : ''}`}
              onClick={() => toggle('usage_analytics')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Academic Research</span>
              <span className={styles.preferenceDesc}>Allow anonymized data for academic research</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.academic_research}
              className={`${styles.toggle} ${prefs.academic_research ? styles.toggleOn : ''}`}
              onClick={() => toggle('academic_research')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceContent}>
              <span className={styles.preferenceTitle}>Third-Party Services</span>
              <span className={styles.preferenceDesc}>Share anonymized insights with partner institutions</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.third_party_services}
              className={`${styles.toggle} ${prefs.third_party_services ? styles.toggleOn : ''}`}
              onClick={() => toggle('third_party_services')}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </section>

      <div className={styles.footer}>
        {saved && <span className={styles.saved}>Changes saved.</span>}
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
