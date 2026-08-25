import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const PAGE_SIZE = 20

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function PaginationControls({ currentPage, totalPages, basePath }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const prevHref = currentPage > 1 ? `${basePath}?page=${currentPage - 1}` : null
  const nextHref = currentPage < totalPages ? `${basePath}?page=${currentPage + 1}` : null

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
      {prevHref ? (
        <Link
          href={prevHref}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </span>
      )}
      <span className="text-sm text-slate-500 font-medium">
        Page {currentPage} of {totalPages}
      </span>
      {nextHref ? (
        <Link
          href={nextHref}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300">
          Next
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  )
}
