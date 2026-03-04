import { jsPDF } from 'jspdf'
import type { Report, Tip, Comment, Profile } from './types'
import { INSPECTION_REGIONS } from './types'

const MARGIN = 20
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

function formatReportId(id: string): string {
  return `RPT-${id.slice(-6).toUpperCase()}`
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '—'
  return str.length > maxLen ? str.slice(0, maxLen - 2) + '…' : str
}

export function downloadAdminStatementPdf(
  reports: Report[],
  tips: Tip[],
  comments: Comment[],
  profiles: Profile[]
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN
  const lineHeight = 6
  const smallLineHeight = 5

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('HygieneWatch', MARGIN, y)
  y += lineHeight + 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Admin Dashboard Statement', MARGIN, y)
  y += lineHeight

  doc.setFontSize(10)
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, MARGIN, y)
  y += lineHeight + 4

  // Summary section
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', MARGIN, y)
  y += lineHeight

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const pendingReports = reports.filter((r) => r.status === 'pending')
  const pendingTips = tips.filter((t) => !t.approved)
  const today = new Date().toISOString().slice(0, 10)
  const approvedToday =
    reports.filter((r) => r.status === 'resolved' && r.updatedAt?.slice(0, 10) === today).length +
    tips.filter((t) => t.approved && t.updatedAt?.slice(0, 10) === today).length

  doc.text(`Total Reports: ${reports.length}  |  Pending: ${pendingReports.length}  |  Resolved: ${reports.filter((r) => r.status === 'resolved').length}`, MARGIN, y)
  y += smallLineHeight
  doc.text(`Total Tips: ${tips.length}  |  Pending: ${pendingTips.length}  |  Approved Today: ${approvedToday}`, MARGIN, y)
  y += smallLineHeight
  doc.text(`Total Comments: ${comments.length}  |  Registered Users: ${profiles.length}`, MARGIN, y)
  y += lineHeight + 6

  function checkNewPage(needed: number): void {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  // Reports table
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Sanitation Reports', MARGIN, y)
  y += lineHeight + 2

  const reportCols = [
    { w: 28, key: 'id', label: 'Report ID' },
    { w: 40, key: 'location', label: 'Location' },
    { w: 28, key: 'category', label: 'Category' },
    { w: 22, key: 'status', label: 'Status' },
    { w: 30, key: 'submittedBy', label: 'Submitted By' },
    { w: 28, key: 'date', label: 'Date' },
  ]
  const reportColWidths = reportCols.map((c) => c.w)
  const totalReportWidth = reportColWidths.reduce((a, b) => a + b, 0)
  const scale = Math.min(1, CONTENT_WIDTH / totalReportWidth)
  const scaledWidths = reportColWidths.map((w) => w * scale)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  let x = MARGIN
  reportCols.forEach((col, i) => {
    doc.text(col.label, x, y)
    x += scaledWidths[i]
  })
  y += smallLineHeight
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  for (const r of reports) {
    checkNewPage(lineHeight + 4)
    x = MARGIN
    const row = [
      formatReportId(r.id),
      truncate(r.location ?? r.title ?? '—', 25),
      truncate(r.category ?? 'Other', 18),
      r.status,
      truncate(r.submittedBy ?? '—', 18),
      formatDate(r.createdAt),
    ]
    row.forEach((val, i) => {
      doc.text(val, x, y)
      x += scaledWidths[i]
    })
    y += smallLineHeight
  }
  y += 6

  // Tips table
  checkNewPage(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Hygiene Tips', MARGIN, y)
  y += lineHeight + 2

  const tipCols = [
    { w: 50, key: 'title', label: 'Title' },
    { w: 35, key: 'category', label: 'Category' },
    { w: 40, key: 'author', label: 'Author' },
    { w: 25, key: 'status', label: 'Status' },
    { w: 28, key: 'date', label: 'Date' },
  ]
  const tipColWidths = tipCols.map((c) => c.w)
  const totalTipWidth = tipColWidths.reduce((a, b) => a + b, 0)
  const tipScale = Math.min(1, CONTENT_WIDTH / totalTipWidth)
  const scaledTipWidths = tipColWidths.map((w) => w * tipScale)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  x = MARGIN
  tipCols.forEach((col, i) => {
    doc.text(col.label, x, y)
    x += scaledTipWidths[i]
  })
  y += smallLineHeight
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  for (const t of tips) {
    checkNewPage(lineHeight + 4)
    x = MARGIN
    const row = [
      truncate(t.title, 35),
      truncate(t.category, 22),
      truncate(t.author, 25),
      t.approved ? 'Approved' : 'Pending',
      formatDate(t.createdAt),
    ]
    row.forEach((val, i) => {
      doc.text(val, x, y)
      x += scaledTipWidths[i]
    })
    y += smallLineHeight
  }
  y += 6

  // Comments table (abbreviated)
  checkNewPage(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Comments', MARGIN, y)
  y += lineHeight + 2

  const commentCols = [
    { w: 90, key: 'body', label: 'Comment' },
    { w: 40, key: 'author', label: 'Author' },
    { w: 30, key: 'target', label: 'On' },
    { w: 28, key: 'date', label: 'Date' },
  ]
  const commentColWidths = commentCols.map((c) => c.w)
  const totalCommentWidth = commentColWidths.reduce((a, b) => a + b, 0)
  const commentScale = Math.min(1, CONTENT_WIDTH / totalCommentWidth)
  const scaledCommentWidths = commentColWidths.map((w) => w * commentScale)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  x = MARGIN
  commentCols.forEach((col, i) => {
    doc.text(col.label, x, y)
    x += scaledCommentWidths[i]
  })
  y += smallLineHeight
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  for (const c of comments) {
    checkNewPage(lineHeight + 4)
    x = MARGIN
    const row = [
      truncate(c.body, 60),
      truncate(c.author, 25),
      c.targetType === 'tip' ? 'Tip' : 'Report',
      formatDate(c.createdAt),
    ]
    row.forEach((val, i) => {
      doc.text(val, x, y)
      x += scaledCommentWidths[i]
    })
    y += smallLineHeight
  }
  y += 6

  // Users table
  checkNewPage(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('User Management', MARGIN, y)
  y += lineHeight + 2

  const userCols = [
    { w: 45, key: 'name', label: 'Name' },
    { w: 55, key: 'email', label: 'Email' },
    { w: 25, key: 'role', label: 'Role' },
    { w: 45, key: 'region', label: 'Region' },
  ]
  const userColWidths = userCols.map((c) => c.w)
  const totalUserWidth = userColWidths.reduce((a, b) => a + b, 0)
  const userScale = Math.min(1, CONTENT_WIDTH / totalUserWidth)
  const scaledUserWidths = userColWidths.map((w) => w * userScale)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  x = MARGIN
  userCols.forEach((col, i) => {
    doc.text(col.label, x, y)
    x += scaledUserWidths[i]
  })
  y += smallLineHeight
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  for (const p of profiles) {
    checkNewPage(lineHeight + 4)
    x = MARGIN
    const regionLabel = p.assignedRegion
      ? INSPECTION_REGIONS.find((r) => r.value === p.assignedRegion)?.label ?? p.assignedRegion
      : '—'
    const row = [
      truncate(p.full_name ?? '—', 30),
      truncate(p.email ?? '—', 38),
      p.role,
      truncate(regionLabel, 30),
    ]
    row.forEach((val, i) => {
      doc.text(val, x, y)
      x += scaledUserWidths[i]
    })
    y += smallLineHeight
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${totalPages}  •  HygieneWatch Admin Statement`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 10,
      { align: 'center' }
    )
  }

  const filename = `HygieneWatch-Admin-Statement-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

export function downloadInspectorStatementPdf(
  reports: Report[],
  regionLabel: string
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN
  const lineHeight = 6
  const smallLineHeight = 5

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('HygieneWatch', MARGIN, y)
  y += lineHeight + 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Inspector Activity Statement', MARGIN, y)
  y += lineHeight

  doc.setFontSize(10)
  doc.text(`Region: ${regionLabel}`, MARGIN, y)
  y += smallLineHeight
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, MARGIN, y)
  y += lineHeight + 4

  // Summary section
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', MARGIN, y)
  y += lineHeight

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const pendingReports = reports.filter((r) => r.status === 'pending')
  const today = new Date().toISOString().slice(0, 10)
  const resolvedToday = reports.filter(
    (r) => r.status === 'resolved' && r.updatedAt?.slice(0, 10) === today
  ).length

  doc.text(`Total Reports in Region: ${reports.length}  |  Pending: ${pendingReports.length}  |  Resolved: ${reports.filter((r) => r.status === 'resolved').length}`, MARGIN, y)
  y += smallLineHeight
  doc.text(`Resolved Today: ${resolvedToday}`, MARGIN, y)
  y += lineHeight + 6

  function checkNewPage(needed: number): void {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  // Reports table
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Sanitation Reports', MARGIN, y)
  y += lineHeight + 2

  const reportCols = [
    { w: 28, key: 'id', label: 'Report ID' },
    { w: 40, key: 'location', label: 'Location' },
    { w: 28, key: 'category', label: 'Category' },
    { w: 22, key: 'status', label: 'Status' },
    { w: 30, key: 'submittedBy', label: 'Submitted By' },
    { w: 28, key: 'date', label: 'Date' },
  ]
  const reportColWidths = reportCols.map((c) => c.w)
  const totalReportWidth = reportColWidths.reduce((a, b) => a + b, 0)
  const scale = Math.min(1, CONTENT_WIDTH / totalReportWidth)
  const scaledWidths = reportColWidths.map((w) => w * scale)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  let x = MARGIN
  reportCols.forEach((col, i) => {
    doc.text(col.label, x, y)
    x += scaledWidths[i]
  })
  y += smallLineHeight
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  for (const r of reports) {
    checkNewPage(lineHeight + 4)
    x = MARGIN
    const row = [
      formatReportId(r.id),
      truncate(r.location ?? r.title ?? '—', 25),
      truncate(r.category ?? 'Other', 18),
      r.status,
      truncate(r.submittedBy ?? '—', 18),
      formatDate(r.createdAt),
    ]
    row.forEach((val, i) => {
      doc.text(val, x, y)
      x += scaledWidths[i]
    })
    y += smallLineHeight
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${totalPages}  •  HygieneWatch Inspector Statement`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 10,
      { align: 'center' }
    )
  }

  const filename = `HygieneWatch-Inspector-Statement-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
