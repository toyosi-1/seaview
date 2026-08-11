import { CheckCircle, Circle, Clock, XCircle, RotateCcw } from 'lucide-react'
import { WORKFLOW_STAGES } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils/format'
import type { ProposalTimeline } from '@/types/database'

interface WorkflowTimelineProps {
  status: string
  timeline: ProposalTimeline[]
}

export function WorkflowTimeline({ status, timeline }: WorkflowTimelineProps) {
  const isRejected = status === 'rejected'
  const isReturned = status === 'returned'

  const getStageStatus = (stageKey: string, idx: number) => {
    const stageOrder = WORKFLOW_STAGES.map(s => s.key)
    const currentIdx = stageOrder.indexOf(status)
    const stageIdx = stageOrder.indexOf(stageKey)

    if (isRejected || isReturned) {
      if (stageIdx < currentIdx) return 'done'
      return 'inactive'
    }
    if (stageIdx < currentIdx || status === 'approved') return 'done'
    if (stageKey === status || (status === 'approved' && stageKey === 'approved')) return 'current'
    return 'pending'
  }

  return (
    <div className="space-y-0">
      {WORKFLOW_STAGES.map((stage, idx) => {
        const stageStatus = getStageStatus(stage.key, idx)
        const timelineEntry = timeline.find(t =>
          t.stage === stage.key || t.stage.includes(stage.key.split('_')[0])
        )

        return (
          <div key={stage.key} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${stageStatus === 'done' ? 'bg-green-100' : ''}
                ${stageStatus === 'current' ? 'bg-blue-100 ring-2 ring-blue-400 ring-offset-2' : ''}
                ${stageStatus === 'pending' ? 'bg-slate-100' : ''}
                ${stageStatus === 'inactive' ? 'bg-slate-50' : ''}
              `}>
                {stageStatus === 'done' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {stageStatus === 'current' && <Clock className="w-5 h-5 text-blue-600" />}
                {stageStatus === 'pending' && <Circle className="w-5 h-5 text-slate-300" />}
                {stageStatus === 'inactive' && <Circle className="w-5 h-5 text-slate-200" />}
              </div>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div className={`w-0.5 h-10 my-1 ${stageStatus === 'done' ? 'bg-green-300' : 'bg-slate-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 min-w-0 flex-1">
              <p className={`font-semibold text-sm leading-tight
                ${stageStatus === 'done' ? 'text-green-700' : ''}
                ${stageStatus === 'current' ? 'text-blue-700' : ''}
                ${stageStatus === 'pending' ? 'text-slate-400' : ''}
                ${stageStatus === 'inactive' ? 'text-slate-300' : ''}
              `}>
                {stage.label}
              </p>
              {timelineEntry && (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-xs text-slate-500">{formatDateTime(timelineEntry.created_at)}</p>
                  {timelineEntry.note && (
                    <p className="text-xs text-slate-600 italic">&ldquo;{timelineEntry.note}&rdquo;</p>
                  )}
                  {timelineEntry.profiles && (
                    <p className="text-xs text-slate-400">— {(timelineEntry.profiles as { full_name: string | null }).full_name ?? 'Staff'}</p>
                  )}
                </div>
              )}
              {stageStatus === 'current' && !timelineEntry && (
                <p className="text-xs text-blue-500 mt-1">Currently at this stage</p>
              )}
            </div>
          </div>
        )
      })}

      {/* Rejection/Return notice */}
      {(isRejected || isReturned) && (
        <div className={`flex gap-3 p-3 rounded-xl mt-2 ${isRejected ? 'bg-red-50' : 'bg-amber-50'}`}>
          {isRejected ? <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /> : <RotateCcw className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />}
          <p className={`text-sm font-medium ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>
            {isRejected ? 'This quotation was rejected.' : 'This quotation was returned for clarification.'}
          </p>
        </div>
      )}
    </div>
  )
}
