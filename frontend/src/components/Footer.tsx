import { Link } from 'react-router-dom'
import LogoIcon from './LogoIcon'
import styles from './Footer.module.css'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.watermark} aria-hidden>
        HYGIENEWATCH
      </div>
      <div className={styles.footerContent}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <Link to="/" className={styles.footerLogo}>
            <LogoIcon variant="white" className={styles.logoIcon} />
            <span>HygieneWatch</span>
          </Link>
          <p className={styles.tagline}>
            Better hygiene and health tracking for communities through simple tools and thoughtful design.
          </p>
          <div className={styles.social}>
            <a href="#" aria-label="Facebook" className={styles.socialLink}>f</a>
            <a href="#" aria-label="Twitter" className={styles.socialLink}>𝕏</a>
            <a href="#" aria-label="LinkedIn" className={styles.socialLink}>in</a>
          </div>
        </div>
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Company</h4>
          <a href="/#about" className={styles.footerLink}>About Us</a>
          <a href="/#contact" className={styles.footerLink}>Contact Us</a>
          <Link to="/signup" className={styles.footerLink}>Sign Up</Link>
          <Link to="/login" className={styles.footerLink}>Log In</Link>
        </div>
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Features</h4>
          <a href="/#features" className={styles.footerLink}>Hygiene Tracking</a>
          <a href="/#features" className={styles.footerLink}>Reminders</a>
          <a href="/#features" className={styles.footerLink}>Reports</a>
          <a href="/#features" className={styles.footerLink}>Resources</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <p className={styles.copyright}>© Copyright {new Date().getFullYear()} HygieneWatch. All rights reserved.</p>
        <button type="button" onClick={scrollToTop} className={styles.scrollTop}>
          <span className={styles.scrollTopIcon} aria-hidden>↑</span>
          Scroll to Top
        </button>
      </div>
      </div>
    </footer>
  )
}
