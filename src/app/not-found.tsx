import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-sm flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Page not found</h1>
        <p className="text-slate-500 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
