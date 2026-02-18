import { useMemo } from 'react'
import 'chart.js/auto'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import type { Report, Tip } from '../lib/types'
import styles from './DashboardChart.module.css'

const CHART_CATEGORIES = [
  'Waste Management',
  'Water Safety',
  'Sanitation',
  'Drainage',
  'Personal Hygiene',
  'Food Safety',
  'Safety',
  'Other',
] as const

interface DashboardChartProps {
  reports: Report[]
  tips: Tip[]
}

export default function DashboardChart({ reports, tips }: DashboardChartProps) {
  const chartData = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    CHART_CATEGORIES.forEach((c) => { categoryCounts[c] = 0 })
    reports.forEach((r) => {
      const cat = r.category || 'Other'
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
    })
    tips.forEach((t) => {
      const cat = t.category as string
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
    })
    return {
      labels: CHART_CATEGORIES.map((c) => c.replace(/ (.+)/, '\n$1')),
      datasets: [
        {
          label: 'Reports & Tips',
          data: CHART_CATEGORIES.map((c) => categoryCounts[c] ?? 0),
          backgroundColor: 'rgba(22, 101, 52, 0.6)',
          borderColor: 'rgba(22, 101, 52, 0.9)',
          borderWidth: 1,
        },
      ],
    }
  }, [reports, tips])

  const opts: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#4a4a4a', font: { size: 11 }, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { color: '#6b6b6b', font: { size: 11 } },
      },
    },
  }

  return (
    <div className={styles.wrap}>
      <Bar data={chartData} options={opts} />
    </div>
  )
}
