import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import LogoIcon from '../components/LogoIcon'
import { IconEnvelope } from '../components/AuthIcons'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` })
      setSent(true)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to send reset email.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand}>
          <LogoIcon className={styles.logoIcon} />
          <span>HygieneWatch</span>
        </Link>
        <h1 className={styles.leftTitle}>Reset your password.</h1>
        <p className={styles.leftSub}>
          Enter your email and we'll send you a link to reset your password.
        </p>
        <div className={styles.leftImage}>
          <img src="https://picsum.photos/seed/sign-in-hygiene-tracking/500/375" alt="" />
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Forgot password?</h2>
          <p className={styles.cardSub}>Enter your email to receive a reset link.</p>
          {sent ? (
            <p className={styles.successMsg}>Check your email for the reset link.</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="forgot-email">Email</label>
                <div className={styles.field}>
                  <span className={styles.fieldIcon}><IconEnvelope /></span>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={styles.input}
                    required
                  />
                </div>
              </div>
              {error && <p className={styles.errorMsg} role="alert">{error}</p>}
              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
          <p className={styles.footerLink} style={{ marginTop: '1.5rem' }}>
            <Link to="/login">Back to Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
