'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '@/lib/constants'
import type { ProposalStatus } from '@/types/database'

interface StatusBreakdownProps {
  data: { status: ProposalStatus; count: number }[]
  title: string
}

export function StatusBreakdown({ data, title }: StatusBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Bar visualization */}
        <div className="flex h-3 rounded-sm overflow-hidden bg-slate-100">
          {data.map((d, i) => {
            if (d.count === 0) return null
            const pct = (d.count / total) * 100
            const colorClass = PROPOSAL_STATUS_COLORS[d.status]
            const bgColor = colorClass.split(' ')[0]
            return (
              <div
                key={i}
                className={bgColor}
                style={{ width: `${pct}%` }}
                title={`${PROPOSAL_STATUS_LABELS[d.status]}: ${d.count}`}
              />
            )
          })}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {data.map((d, i) => {
            if (d.count === 0) return null
            const colorClass = PROPOSAL_STATUS_COLORS[d.status]
            const bgColor = colorClass.split(' ')[0]
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-3 h-3 rounded-sm ${bgColor} flex-shrink-0`} />
                <span className="text-slate-600 truncate">{PROPOSAL_STATUS_LABELS[d.status]}</span>
                <span className="text-slate-800 font-semibold ml-auto">{d.count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
