import { CheckCircle2, Circle, Clock, XCircle, RotateCcw } from 'lucide-react'
import { WORKFLOW_STAGES } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
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
        const isLast = idx === WORKFLOW_STAGES.length - 1
        const timelineEntry = timeline.find(t =>
          t.stage === stage.key || t.stage.includes(stage.key.split('_')[0])
        )

        return (
          <div key={stage.key} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                stageStatus === 'done' && 'bg-spl-success text-white shadow-sm',
                stageStatus === 'current' && 'bg-white ring-[3px] ring-spl-blue shadow-md',
                stageStatus === 'pending' && 'bg-white ring-2 ring-slate-200',
                stageStatus === 'inactive' && 'bg-slate-50 ring-2 ring-slate-100'
              )}>
                {stageStatus === 'done' && <CheckCircle2 className="w-[18px] h-[18px]" />}
                {stageStatus === 'current' && (
                  <span className="relative flex items-center justify-center w-[18px] h-[18px]">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-spl-blue/25 animate-ping" />
                    <Clock className="w-[18px] h-[18px] text-spl-blue relative" />
                  </span>
                )}
                {stageStatus === 'pending' && <Circle className="w-3.5 h-3.5 text-slate-300" />}
                {stageStatus === 'inactive' && <Circle className="w-3.5 h-3.5 text-slate-200" />}
              </div>
              {!isLast && (
                <div className={cn(
                  'w-0.5 flex-1 my-1 min-h-[2.25rem] rounded-full transition-colors duration-300',
                  stageStatus === 'done' ? 'bg-spl-success' : 'bg-slate-200'
                )} />
              )}
            </div>

            {/* Content */}
            <div className={cn('min-w-0 flex-1', !isLast && 'pb-6')}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn(
                  'font-semibold text-sm leading-tight',
                  stageStatus === 'done' && 'text-spl-navy',
                  stageStatus === 'current' && 'text-spl-blue-dark',
                  stageStatus === 'pending' && 'text-slate-400',
                  stageStatus === 'inactive' && 'text-slate-300'
                )}>
                  {stage.label}
                </p>
                {stageStatus === 'current' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-spl-blue bg-spl-blue-light px-2 py-0.5 rounded-full">
                    In progress
                  </span>
                )}
              </div>
              {timelineEntry && (
                <div className="mt-1.5 space-y-1.5">
                  <p className="text-xs text-slate-500">{formatDateTime(timelineEntry.created_at)}</p>
                  {timelineEntry.note && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-600 italic">&ldquo;{timelineEntry.note}&rdquo;</p>
                    </div>
                  )}
                  {timelineEntry.profiles && (
                    <p className="text-xs text-slate-400">— {(timelineEntry.profiles as { full_name: string | null }).full_name ?? 'Staff'}</p>
                  )}
                </div>
              )}
              {stageStatus === 'current' && !timelineEntry && (
                <p className="text-xs text-spl-blue mt-1.5 font-medium">Awaiting action at this stage</p>
              )}
            </div>
          </div>
        )
      })}

      {/* Rejection/Return notice */}
      {(isRejected || isReturned) && (
        <div className={cn(
          'flex items-start gap-3 p-3.5 rounded-xl mt-1 border',
          isRejected ? 'bg-spl-danger-bg border-red-100' : 'bg-spl-warning-bg border-amber-100'
        )}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isRejected ? 'bg-red-100' : 'bg-amber-100'
          )}>
            {isRejected ? <XCircle className="w-[18px] h-[18px] text-spl-danger" /> : <RotateCcw className="w-[18px] h-[18px] text-spl-warning" />}
          </div>
          <div>
            <p className={cn('text-sm font-semibold', isRejected ? 'text-spl-danger' : 'text-spl-warning')}>
              {isRejected ? 'Quotation Rejected' : 'Returned for Clarification'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRejected
                ? 'This quotation was rejected and will not proceed further.'
                : 'This quotation was sent back and requires clarification before it can proceed.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
