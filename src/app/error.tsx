'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-sm flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Something went wrong</h1>
        <p className="text-slate-500 text-sm">
          An unexpected error occurred. Please try again, or contact support if the problem persists.
        </p>
        <Button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
