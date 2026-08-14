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
        'cursor-pointer hover:shadow-md transition-all duration-200 border border-spl-border shadow-sm',
        urgent && 'ring-1 ring-spl-danger/40'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-spl-text-muted mb-1">{title}</p>
              <p className={cn('text-4xl font-bold tracking-tight', color)}>{value}</p>
              {urgent && (
                <p className="text-xs text-spl-danger font-medium mt-1">Requires attention</p>
              )}
            </div>
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', bgColor)}>
              <Icon className={cn('w-7 h-7', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
