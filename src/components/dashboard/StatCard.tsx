import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  href: string
  urgent?: boolean
}

export function StatCard({ title, value, icon: Icon, color, bgColor, href, urgent }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-0 shadow-sm',
        urgent && 'ring-2 ring-red-400 ring-offset-1'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
              <p className={cn('text-4xl font-bold tracking-tight', color)}>{value}</p>
              {urgent && (
                <p className="text-xs text-red-500 font-medium mt-1">Requires attention</p>
              )}
            </div>
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', bgColor)}>
              <Icon className={cn('w-7 h-7', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
