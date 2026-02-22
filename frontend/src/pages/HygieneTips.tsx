import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeTips, addTip } from '../lib/firestore'
import Loader from '../components/Loader'
import { IconLightbulb, IconSearch, IconPlus, IconX } from '../components/Icons'
import type { Tip, TipCategory } from '../lib/types'
import styles from './HygieneTips.module.css'

const CATEGORIES: TipCategory[] = [
  'Personal Hygiene',
  'Water Safety',
  'Waste Management',
  'Sanitation',
  'Food Safety',
  'Drainage',
  'Safety',
  'Other',
]

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

export default function HygieneTips() {
  const { user, profile } = useAuth()
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<TipCategory | ''>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState<TipCategory>('Other')
  const [formDescription, setFormDescription] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    const unsub = subscribeTips((data) => {
      setTips(data)
      setLoading(false)
    })
    return () => unsub?.()
  }, [])

  const filtered = useMemo(() => {
    let list = tips
    if (category) {
      const cat = category.toLowerCase().trim()
      list = list.filter(
        (t) => (t.category ?? '').toLowerCase().trim() === cat
      )
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })
    return sorted
  }, [tips, category, search, sortOrder])

  const categoryOptions = useMemo(() => {
    const fromTips = [...new Set(tips.map((t) => (t.category ?? '').trim()).filter(Boolean))]
    return [...new Set([...CATEGORIES, ...fromTips])]
  }, [tips])

  const handleSubmitTip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const authorName = profile?.anonymous_tips
        ? 'Anonymous'
        : (profile?.full_name || user.displayName || user.email || 'Anonymous')
      const tipId = await addTip({
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        author: authorName,
        authorId: user.uid,
      })
      const now = new Date().toISOString()
      const newTip: Tip = {
        id: tipId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        author: authorName,
        authorId: user.uid,
        approved: true,
        createdAt: now,
        updatedAt: now,
      }
      setTips((prev) => [newTip, ...prev])
      setFormTitle('')
      setFormCategory('Other')
      setFormDescription('')
      setModalOpen(false)
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit tip')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className={styles.page}>

      {submitSuccess && (
        <p className={styles.successBanner} role="status">
          Your hygiene tip has been submitted successfully.
        </p>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            <IconSearch />
          </span>
          <input
            type="search"
            placeholder="Search tips by title, description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
            aria-label="Search tips"
          />
        </div>
        <div className={styles.toolbarRight}>
          <select
            value={category}
            onChange={(e) => setCategory((e.target.value || '') as TipCategory | '')}
            className={styles.select}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className={styles.select}
            aria-label="Sort order"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          {user ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={styles.submitBtn}
            >
              <IconPlus />
              Submit New Tip
            </button>
          ) : (
            <Link to="/login" className={styles.submitBtn}>
              <IconPlus />
              Submit New Tip
            </Link>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No tips match your search or filter.</p>
        ) : (
          filtered.map((tip) => (
            <article key={tip.id} className={styles.card}>
              <span className={styles.cardIcon}>
                <IconLightbulb />
              </span>
              <span className={styles.category}>{tip.category}</span>
              <h2 className={styles.cardTitle}>{tip.title}</h2>
              <p className={styles.cardDesc}>
                {tip.description.length > 120
                  ? tip.description.slice(0, 120) + '…'
                  : tip.description}
              </p>
              <div className={styles.cardMeta}>
                <span>{tip.author}</span>
                <span>{formatDate(tip.createdAt)}</span>
              </div>
              <Link to={`/tips/${tip.id}`} className={styles.cardLink}>
                Comment →
              </Link>
            </article>
          ))
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 id="modal-title" className={styles.modalTitle}>Submit a Hygiene Tip</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={styles.modalClose}
                aria-label="Close"
              >
                <IconX />
              </button>
            </div>
            <p className={styles.modalSubtitle}>
              Share your knowledge to help the community maintain better hygiene.
            </p>
            <form onSubmit={handleSubmitTip} className={styles.modalForm}>
              {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
              <div className={styles.field}>
                <label htmlFor="tip-title">Title</label>
                <input
                  id="tip-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter a descriptive title."
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="tip-category">Category</label>
                <select
                  id="tip-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TipCategory)}
                  className={styles.input}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="tip-description">Description</label>
                <textarea
                  id="tip-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide detailed information about your hygiene tip…"
                  required
                  rows={5}
                  className={styles.textarea}
                />
              </div>
              <button
                type="submit"
                className={styles.submitModalBtn}
                disabled={submitting || !formTitle.trim() || !formDescription.trim()}
              >
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
