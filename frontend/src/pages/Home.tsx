import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import styles from './Home.module.css'
import contactStyles from './Contact.module.css'

export default function Home() {
  const [sent, setSent] = useState(false)
  const [learnMoreEmail, setLearnMoreEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = contactName.trim()
    const email = contactEmail.trim()
    const subject = contactSubject.trim()
    const message = contactMessage.trim()
    if (!name || !email || !message) return

    try {
      await addDoc(collection(db, 'contact_submissions'), {
        name,
        email,
        subject: subject || null,
        message,
        created_at: new Date().toISOString(),
      })
      setContactName('')
      setContactEmail('')
      setContactSubject('')
      setContactMessage('')
      setSent(true)
      setTimeout(() => setSent(false), 2000)
    } catch (err) {
      console.error('Failed to save contact message', err)
      window.alert(`Sorry, something went wrong: ${err instanceof Error ? err.message : 'Failed to send message'}`)
    }
  }

  const handleLearnMoreSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!learnMoreEmail.trim()) return

    setIsSubscribing(true)
    try {
      await addDoc(collection(db, 'email_subscriptions'), {
        email: learnMoreEmail.trim(),
        created_at: new Date().toISOString(),
      })
      window.alert('Thanks for subscribing!')
      setLearnMoreEmail('')
    } catch (err) {
      console.error('Failed to save email subscription', err)
      window.alert(`Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>Promoting Better Hygiene for Healthier Communities</h1>
            <Link to="/signup" className={styles.heroCta}>Get Started →</Link>
          </div>
          <div className={styles.heroCards}>
            <article className={styles.featureCard}>
              <div className={styles.cardImage}>
                <img src="https://picsum.photos/seed/daily-hygiene-tracking/400/300" alt="Daily Hygiene Tracking" />
              </div>
              <h3 className={styles.cardTitle}>Daily Hygiene Tracking</h3>
              <p className={styles.cardDesc}>Track handwashing, sanitation, and personal care in one place.</p>
              <a href="/#about" className={styles.cardLink}>VIEW DETAILS →</a>
            </article>
            <article className={styles.featureCard}>
              <div className={styles.cardImage}>
                <img src="https://picsum.photos/seed/community-resources/400/300" alt="Community Resources" />
                <div className={styles.reviewBadge}>
                  <span className={styles.star}>★</span> 4.9
                  <span className={styles.reviewText}>820+ User Reviews</span>
                  <span className={styles.googleBadge}>G Google Reviews</span>
                </div>
              </div>
              <h3 className={styles.cardTitle}>Community Resources</h3>
              <p className={styles.cardDesc}>Guides and reminders to build lasting hygiene habits.</p>
              <a href="/#about" className={styles.cardLink}>EXPLORE MORE →</a>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="about">
        <div className={styles.sectionInner}>
          <div className={styles.elevatingRow}>
            <div className={styles.elevatingLeft}>
              <h2 className={styles.elevatingTitle}>
                Spreading Hygiene Awareness to All
              </h2>
              <p className={styles.elevatingSub}>
                HygieneWatch combines simple technology with clear design to help communities track hygiene habits, set reminders, and access resources for better health.
              </p>
              <div className={styles.numberedListCard}>
                <div className={styles.numberedItem}>
                  <span className={styles.number}>01</span>
                  <div>
                    <h3 className={styles.numberedTitle}>All Scenario Adaptability</h3>
                    <p className={styles.numberedDesc}>Works for individuals, families, schools, and community groups—anywhere hygiene matters.</p>
                  </div>
                </div>
                <div className={styles.numberedItem}>
                  <span className={styles.number}>02</span>
                  <div>
                    <h3 className={styles.numberedTitle}>Clear Documentation</h3>
                    <p className={styles.numberedDesc}>Log habits, reminders, and progress in one place with optional notes and goals.</p>
                  </div>
                </div>
                <div className={styles.numberedItem}>
                  <span className={styles.number}>03</span>
                  <div>
                    <h3 className={styles.numberedTitle}>Secure & Private</h3>
                    <p className={styles.numberedDesc}>Your data stays private and is only used to help you build better habits.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.elevatingRight}>
              <div className={styles.elevatingImage}>
                <img src="https://picsum.photos/seed/spreading-hygiene-awareness/600/450" alt="Spreading Hygiene Awareness" />
              </div>
              <div className={styles.reliabilityCard}>
                <h4 className={styles.reliabilityTitle}>Built for Reliability</h4>
                <ul className={styles.reliabilityList}>
                  <li><span className={styles.check}>✓</span> Easy tracking: Log habits with minimal effort</li>
                  <li><span className={styles.check}>✓</span> Flexible reminders: Customize to your routine</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionLight} id="features">
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>Explore Our Features</h2>
          <div className={styles.featureGrid}>
            {[
              { title: 'Hygiene Tracking', free: true },
              { title: 'Reminders', free: true },
              { title: 'Reports', free: true },
              { title: 'Resources', free: true },
            ].map((f) => (
              <article key={f.title} className={styles.gridCard}>
                <div className={styles.gridCardImage}>
                  <img src={`https://picsum.photos/seed/${f.title.replace(/\s+/g, '-').toLowerCase()}/300/225`} alt={f.title} />
                </div>
                <h3 className={styles.gridCardTitle}>{f.title}</h3>
                <p className={styles.gridCardMeta}>Free</p>
                <div className={styles.gridCardActions}>
                  <span className={styles.gridCardWatch}>Watch</span>
                  <Link to="/signup" className={styles.gridCardLink} aria-label={`Watch ${f.title}`}>→</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionLight}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>News & Articles</h2>
          <div className={styles.articlesGrid}>
            {[
              { label: 'GUIDES', title: 'How to Build a Daily Hygiene Routine' },
              { label: 'TIPS', title: 'Handwashing Best Practices for Families' },
              { label: 'TUTORIAL', title: 'Setting Up Your First Hygiene Reminders' },
            ].map((a) => (
              <article key={a.title} className={styles.articleCard}>
                <div className={styles.articleImage}>
                  <img src={`https://picsum.photos/seed/${a.title.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')}/400/250`} alt="" />
                  <span className={styles.articleLabel}>{a.label}</span>
                </div>
                <h3 className={styles.articleTitle}>{a.title}</h3>
                <a href="/#about" className={styles.articleLink}>READ NOW →</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionLight} id="contact">
        <div className={styles.sectionInner}>
          <section className={contactStyles.header}>
            <h2 className={contactStyles.title}>Contact Us</h2>
            <p className={contactStyles.subtitle}>
              Have a question, concern, or feedback? We're here to help. Reach out to us and we'll get back to you as soon as possible.
            </p>
          </section>
          <section className={contactStyles.formSection}>
            <div className={contactStyles.formWrapper}>
              <form className={contactStyles.form} onSubmit={handleContactSubmit}>
                <div className={contactStyles.row}>
                  <div>
                    <label className={contactStyles.label} htmlFor="home-contact-name">Your Name</label>
                    <input
                      id="home-contact-name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className={contactStyles.input}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={contactStyles.label} htmlFor="home-contact-email">Email Address</label>
                    <input
                      id="home-contact-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className={contactStyles.input}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className={contactStyles.rowFull}>
                  <label className={contactStyles.label} htmlFor="home-contact-subject">Subject</label>
                  <input
                    id="home-contact-subject"
                    name="subject"
                    type="text"
                    placeholder="What is this regarding?"
                    className={contactStyles.input}
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                  />
                </div>
                <div className={contactStyles.rowFull}>
                  <label className={contactStyles.label} htmlFor="home-contact-message">Your Message</label>
                  <textarea
                    id="home-contact-message"
                    name="message"
                    rows={5}
                    placeholder="Tell us about your question, concern, or feedback..."
                    className={contactStyles.textarea}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={contactStyles.submitBtn}>
                  Send Message
                </button>
              </form>
            </div>
          </section>
          <section className={contactStyles.direct}>
            <p className={contactStyles.directTitle}>You can also reach us directly at:</p>
            <p className={contactStyles.directItem}>
              k.okeke@alustudent.com&nbsp; · &nbsp;+250798220426
            </p>
          </section>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaOverlay} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Improve Your Hygiene Habits?</h2>
          <p className={styles.ctaSub}>Join others building better habits. Get started today.</p>
          <form className={styles.ctaForm} onSubmit={handleLearnMoreSubmit}>
            <input
              type="email"
              placeholder="Enter Email Address"
              className={styles.ctaInput}
              aria-label="Email"
              value={learnMoreEmail}
              onChange={(e) => setLearnMoreEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.ctaButton} disabled={isSubscribing}>
              {isSubscribing ? 'Subscribing…' : 'Learn More'}
            </button>
          </form>
        </div>
      </section>

      {sent && (
        <div className={contactStyles.toast} role="status">
          Thank you! Your message has been sent. We'll get back to you soon.
        </div>
      )}
    </>
  )
}
