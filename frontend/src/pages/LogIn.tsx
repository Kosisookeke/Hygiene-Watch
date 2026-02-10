import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoIcon from '../components/LogoIcon'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { IconEnvelope, IconLock, IconEye, IconEyeOff } from '../components/AuthIcons'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function LogIn() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate('/', { replace: true })
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
        <h1 className={styles.leftTitle}>Welcome back to HygieneWatch.</h1>
        <p className={styles.leftSub}>
          Continue exploring your hygiene habits and reminders.
        </p>
        <div className={styles.leftImage}>
          <img src="https://picsum.photos/seed/sign-in-hygiene-tracking/500/375" alt="Sign in" />
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Sign in to your account</h2>
          <p className={styles.cardSub}>Continue your hygiene journey.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-email">Email</label>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><IconEnvelope /></span>
                <input id="login-email" type="email" name="email" placeholder="Enter your email" className={styles.input} required />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-password">Password</label>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><IconLock /></span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  className={styles.input}
                  required
                />
                <button type="button" className={styles.togglePw} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            {error && <p className={styles.errorMsg} role="alert">{error}</p>}
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            <p className={styles.divider} aria-hidden>OR</p>
            <GoogleSignInButton label="continue" onClick={handleGoogleSignIn} disabled={loading} />
            <p className={styles.footerLink}>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
