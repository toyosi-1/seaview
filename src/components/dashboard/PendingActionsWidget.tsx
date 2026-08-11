import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, AlertCircle } from 'lucide-react'

interface PendingAction {
  label: string
  count: number
  href: string
  urgent?: boolean
}

export function PendingActionsWidget({ actions }: { actions: PendingAction[] }) {
  const visible = actions.filter(a => a.count > 0)

  if (visible.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-green-500" />
            Pending Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">All caught up! No pending actions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Pending Actions ({visible.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visible.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{action.label}</p>
              </div>
              <Badge className={action.urgent ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                {action.count} pending
              </Badge>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
