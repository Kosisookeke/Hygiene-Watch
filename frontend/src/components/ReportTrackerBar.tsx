import { IconFileText, IconEye, IconThumbsUp, IconRefreshCw, IconCheck, IconX } from './Icons'
import type { Report } from '../lib/types'
import styles from './ReportTrackerBar.module.css'

const MAIN_STAGES: { status: Report['status']; label: string; Icon: React.ComponentType }[] = [
  { status: 'pending', label: 'Submitted', Icon: IconFileText },
  { status: 'in_review', label: 'Under Review', Icon: IconEye },
  { status: 'accepted', label: 'Accepted', Icon: IconThumbsUp },
  { status: 'in_progress', label: 'In Progress', Icon: IconRefreshCw },
  { status: 'resolved', label: 'Resolved', Icon: IconCheck },
]

const STATUS_ORDER: Report['status'][] = ['pending', 'in_review', 'accepted', 'in_progress', 'resolved', 'rejected']

function isStageReached(currentStatus: Report['status'], stageStatus: Report['status']): boolean {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const stageIdx = STATUS_ORDER.indexOf(stageStatus)
  return stageIdx <= currentIdx
}

interface ReportTrackerBarProps {
  report: Report
  compact?: boolean
}

export default function ReportTrackerBar({ report, compact }: ReportTrackerBarProps) {
  const currentStatus = report.status
  const isRejected = currentStatus === 'rejected'

  const visibleStages = isRejected
    ? [{ status: 'pending' as const, label: 'Submitted', Icon: IconFileText }, { status: 'in_review' as const, label: 'Under Review', Icon: IconEye }, { status: 'rejected' as const, label: 'Rejected', Icon: IconX }]
    : MAIN_STAGES

  return (
    <div className={`${styles.tracker} ${compact ? styles.compact : ''}`} role="status" aria-label={`Report status: ${currentStatus}`}>
      <div className={styles.stages}>
        {visibleStages.map((stage, i) => {
          const isLast = i === visibleStages.length - 1
          const isActive = isStageReached(currentStatus, stage.status)
          const lineActive = isActive && !isLast

          return (
            <div key={stage.status} className={`${styles.stageWrap} ${isLast ? styles.stageLast : ''}`}>
              <div className={styles.stageRow}>
                <div className={`${styles.circle} ${isActive ? styles.active : ''}`}>
                  <stage.Icon />
                </div>
                {!isLast && <div className={`${styles.line} ${lineActive ? styles.lineActive : ''}`} />}
              </div>
              <span className={`${styles.label} ${isActive ? styles.labelActive : ''}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
