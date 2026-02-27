import { useState, useRef } from 'react'
import { IconCamera, IconX } from './Icons'
import { uploadImage, hasCloudinaryConfig } from '../lib/cloudinary'
import { resolveReport } from '../lib/firestore'
import styles from './ResolveReportModal.module.css'

interface ResolveReportModalProps {
  reportId: string
  reportTitle: string
  onClose: () => void
  onResolved: () => void
}

export default function ResolveReportModal({
  reportId,
  reportTitle,
  onClose,
  onResolved,
}: ResolveReportModalProps) {
  const [feedback, setFeedback] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = feedback.trim()
    if (trimmed.length < 10) {
      setError('Feedback must be at least 10 characters.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      let photoUrl: string | undefined
      if (photo && hasCloudinaryConfig()) {
        photoUrl = await uploadImage(photo)
      } else if (photo && !hasCloudinaryConfig()) {
        setError('Image upload not configured.')
        setSubmitting(false)
        return
      }
      await resolveReport(reportId, { feedback: trimmed, photoUrl })
      onResolved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="resolve-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="resolve-modal-title" className={styles.title}>Resolve Report</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>
        <p className={styles.subtitle}>{reportTitle}</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.field}>
            <label htmlFor="resolve-feedback">
              Feedback for the user <span className={styles.required}>*</span>
            </label>
            <textarea
              id="resolve-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what was done to address the issue. This will be shown to the user."
              rows={4}
              className={styles.textarea}
              required
              minLength={10}
            />
            <p className={styles.helper}>Min. 10 characters. Explain how the issue was resolved.</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="resolve-photo">
              <IconCamera /> Upload proof image (optional)
            </label>
            <div
              className={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add(styles.dragOver) }}
              onDragLeave={(e) => e.currentTarget.classList.remove(styles.dragOver)}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove(styles.dragOver)
                const file = e.dataTransfer.files[0]
                if (file) {
                  const input = fileInputRef.current
                  if (input) {
                    const dt = new DataTransfer()
                    dt.items.add(file)
                    input.files = dt.files
                    handlePhotoChange({ target: input } as React.ChangeEvent<HTMLInputElement>)
                  }
                }
              }}
            >
              <input
                id="resolve-photo"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handlePhotoChange}
                className={styles.fileInput}
                aria-label="Upload proof image"
              />
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className={styles.previewImg} />
              ) : (
                <>
                  <span className={styles.uploadIcon}><IconCamera /></span>
                  <span>Click to upload or drag and drop</span>
                  <span className={styles.uploadHint}>PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Resolving…' : 'Resolve Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
