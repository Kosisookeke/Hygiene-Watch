import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { subscribeTips } from '../lib/firestore'
import Loader from '../components/Loader'
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
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  catch {
    return s
  }
}

export default function HygieneTips() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<TipCategory | ''>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    const unsub = subscribeTips((data) => {
      setTips(data)
      setLoading(false)
    })
    return () => unsub?.()
  }, [])

  const filtered = useMemo(() => {
    let list = tips
    if (category) list = list.filter((t) => t.category === category)
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

  if (loading) {
    return <Loader />
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Hygiene Tips</h1>
      <p className={styles.subtitle}>
        Practical tips to improve hygiene in your community.
      </p>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search tips…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
          aria-label="Search tips"
        />
        <select
          value={category}
          onChange={(e) => setCategory((e.target.value as TipCategory) || '')}
          className={styles.select}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder((e.target.value as 'newest' | 'oldest'))}
          className={styles.select}
          aria-label="Sort order"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No tips match your search or filter.</p>
        ) : (
          filtered.map((tip) => (
            <article key={tip.id} className={styles.card}>
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
                View →
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
