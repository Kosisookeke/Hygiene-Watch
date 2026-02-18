import { useEffect, useState } from 'react'
import Loader from '../components/Loader'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getTip,
  subscribeComments,
  addComment,
  likeTip,
  unlikeTip,
  getTipLikeCount,
  getUserLikedTip,
} from '../lib/firestore'
import type { Tip, Comment } from '../lib/types'
import styles from './TipView.module.css'

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return s
  }
}

function relativeTime(s: string): string {
  try {
    const d = new Date(s)
    const now = new Date()
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (sec < 60) return 'just now'
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`
    return formatDate(s)
  } catch {
    return s
  }
}

export default function TipView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [tip, setTip] = useState<Tip | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    setError(null)
    getTip(id)
      .then((t) => {
        if (mounted) setTip(t ?? null)
      })
      .catch(() => {
        if (mounted) setError('Failed to load tip')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    if (!id) return
    const unsub = subscribeComments('tip', id, setComments)
    return () => unsub?.()
  }, [id])

  useEffect(() => {
    if (!id) return
    let mounted = true
    Promise.all([getTipLikeCount(id), user ? getUserLikedTip(id, user.uid) : Promise.resolve(false)])
      .then(([count, isLiked]) => {
        if (mounted) {
          setLikeCount(count)
          setLiked(isLiked)
        }
      })
    return () => { mounted = false }
  }, [id, user?.uid])

  const handleLike = async () => {
    if (!user || !id) return
    setLiked((prev) => !prev)
    setLikeCount((c) => (liked ? c - 1 : c + 1))
    try {
      if (liked) await unlikeTip(id, user.uid)
      else await likeTip(id, user.uid)
    } catch {
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c + 1 : c - 1))
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !commentText.trim()) return
    setPosting(true)
    const text = commentText.trim()
    setCommentText('')
    try {
      await addComment({
        targetType: 'tip',
        targetId: id,
        author: profile?.full_name || user.displayName || user.email || 'Anonymous',
        authorId: user.uid,
        body: text,
      })
    } catch {
      setCommentText(text)
    } finally {
      setPosting(false)
    }
  }

  if (!id) {
    navigate('/tips')
    return null
  }

  if (loading && !tip) {
    return <Loader />
  }

  if (error || !tip) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error || 'Tip not found'}</p>
        <Link to="/tips">← Back to Tips</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/tips" className={styles.back}>← Back to Tips</Link>

      <article className={styles.article}>
        <span className={styles.category}>{tip.category}</span>
        <h1 className={styles.title}>{tip.title}</h1>
        <div className={styles.meta}>
          <span>{tip.author}</span>
          <span>{formatDate(tip.createdAt)}</span>
        </div>
        <div className={styles.body}>{tip.description}</div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleLike}
            className={styles.likeBtn}
            aria-label={liked ? 'Unlike' : 'Like'}
            disabled={!user}
          >
            <span className={liked ? styles.heartFilled : styles.heartOutline}>
              {liked ? '❤' : '♡'}
            </span>
            <span>{likeCount}</span>
          </button>
        </div>
      </article>

      <section className={styles.comments}>
        <h2 className={styles.commentsTitle}>Comments</h2>
        {user ? (
          <form onSubmit={handleComment} className={styles.commentForm}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className={styles.commentInput}
              rows={3}
              disabled={posting}
            />
            <button type="submit" className={styles.commentBtn} disabled={posting || !commentText.trim()}>
              {posting ? 'Posting…' : 'Post'}
            </button>
          </form>
        ) : (
          <p className={styles.signInPrompt}>
            <Link to="/login">Log in</Link> to leave a comment.
          </p>
        )}
        <ul className={styles.commentList}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <strong>{c.author}</strong>
                <span className={styles.commentTime}>{relativeTime(c.createdAt)}</span>
              </div>
              <p className={styles.commentBody}>{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
