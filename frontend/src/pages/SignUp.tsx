import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoIcon from '../components/LogoIcon'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { IconUser, IconEnvelope, IconLock, IconEye, IconEyeOff } from '../components/AuthIcons'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function SignUp() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (data?.user && !data.user.identities?.length) {
      setError('An account with this email already exists.')
      return
    }
    setSuccess('Account created! Check your email to confirm, or sign in below.')
    form.reset()
    setTimeout(() => navigate('/login'), 2000)
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    setLoading(false)
    if (oauthError) setError(oauthError.message)
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand}>
          <LogoIcon className={styles.logoIcon} />
          <span>HygieneWatch</span>
        </Link>
        <h1 className={styles.leftTitle}>Build better hygiene habits.</h1>
        <p className={styles.leftSub}>
          Connect with a simple platform for daily hygiene tracking and reminders.
        </p>
        <div className={styles.leftImage}>
          <img src="https://picsum.photos/seed/join-community-signup/500/375" alt="Join our community" />
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Join our community today!</h2>
          <p className={styles.cardSub}>Track habits, set reminders, and improve your hygiene routine.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="signup-name">Full Name</label>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><IconUser /></span>
                <input id="signup-name" type="text" name="name" placeholder="Full Name" className={styles.input} required />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="signup-email">Email</label>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><IconEnvelope /></span>
                <input id="signup-email" type="email" name="email" placeholder="Email" className={styles.input} required />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="signup-password">Password</label>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><IconLock /></span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  className={styles.input}
                  required
                />
                <button type="button" className={styles.togglePw} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="signup-confirm">Confirm Password</label>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><IconLock /></span>
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className={styles.input}
                  required
                />
                <button type="button" className={styles.togglePw} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle visibility">{showPassword ? <IconEyeOff /> : <IconEye />}</button>
              </div>
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required />
              <span>I agree to the Terms and Conditions</span>
            </label>
            {error && <p className={styles.errorMsg} role="alert">{error}</p>}
            {success && <p className={styles.successMsg} role="status">{success}</p>}
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <p className={styles.divider}>or sign up with</p>
            <GoogleSignInButton label="signup" onClick={handleGoogleSignIn} disabled={loading} />
            <p className={styles.footerLink}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
