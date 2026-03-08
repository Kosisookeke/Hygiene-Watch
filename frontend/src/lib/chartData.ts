export interface ChartDataPoint {
  date: string
  label: string
  reports: number
  tips: number
  resolved?: number
}

function formatLabel(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function aggregateByDateUser(
  reports: { createdAt?: string }[],
  tips: { createdAt?: string }[]
): ChartDataPoint[] {
  const byDate = new Map<string, { reports: number; tips: number }>()
  for (const r of reports) {
    const d = r.createdAt?.slice(0, 10) ?? ''
    if (!d) continue
    const cur = byDate.get(d) ?? { reports: 0, tips: 0 }
    cur.reports += 1
    byDate.set(d, cur)
  }
  for (const t of tips) {
    const d = t.createdAt?.slice(0, 10) ?? ''
    if (!d) continue
    const cur = byDate.get(d) ?? { reports: 0, tips: 0 }
    cur.tips += 1
    byDate.set(d, cur)
  }
  return Array.from(byDate.keys())
    .sort()
    .map((d) => ({
      date: d,
      label: formatLabel(d),
      reports: byDate.get(d)!.reports,
      tips: byDate.get(d)!.tips,
    }))
}

export function aggregateByDateAdmin(
  reports: { createdAt?: string; updatedAt?: string; status?: string }[],
  tips: { createdAt?: string }[]
): ChartDataPoint[] {
  const byDate = new Map<string, { reports: number; tips: number; resolved: number }>()
  for (const r of reports) {
    const d = r.createdAt?.slice(0, 10) ?? ''
    if (!d) continue
    const cur = byDate.get(d) ?? { reports: 0, tips: 0, resolved: 0 }
    cur.reports += 1
    byDate.set(d, cur)
    if (r.status === 'resolved' && r.updatedAt) {
      const resD = r.updatedAt.slice(0, 10)
      const resCur = byDate.get(resD) ?? { reports: 0, tips: 0, resolved: 0 }
      resCur.resolved += 1
      byDate.set(resD, resCur)
    }
  }
  for (const t of tips) {
    const d = t.createdAt?.slice(0, 10) ?? ''
    if (!d) continue
    const cur = byDate.get(d) ?? { reports: 0, tips: 0, resolved: 0 }
    cur.tips += 1
    byDate.set(d, cur)
  }
  return Array.from(byDate.keys())
    .sort()
    .map((d) => {
      const c = byDate.get(d)!
      return {
        date: d,
        label: formatLabel(d),
        reports: c.reports,
        tips: c.tips,
        resolved: c.resolved ?? 0,
      }
    })
}

export function aggregateByDateInspector(
  reports: { createdAt?: string; updatedAt?: string; status?: string }[]
): ChartDataPoint[] {
  const byDate = new Map<string, { reports: number; resolved: number }>()
  for (const r of reports) {
    const d = r.createdAt?.slice(0, 10) ?? ''
    if (!d) continue
    const cur = byDate.get(d) ?? { reports: 0, resolved: 0 }
    cur.reports += 1
    if (r.status === 'resolved' && r.updatedAt) {
      const resD = r.updatedAt.slice(0, 10)
      const resCur = byDate.get(resD) ?? { reports: 0, resolved: 0 }
      resCur.resolved += 1
      byDate.set(resD, resCur)
    }
    byDate.set(d, cur)
  }
  return Array.from(byDate.keys())
    .sort()
    .map((d) => {
      const c = byDate.get(d)!
      return {
        date: d,
        label: formatLabel(d),
        reports: c.reports,
        tips: 0,
        resolved: c.resolved ?? 0,
      }
    })
}
