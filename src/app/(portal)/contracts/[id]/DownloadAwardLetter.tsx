'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadAwardLetterProps {
  contractNumber: string
  proposalNumber: string
  contractorName: string
  contractorAddress?: string
  contractorPhone?: string
  contractTitle: string
  contractValue: number
  awardDate: string
  bidDate?: string
  completionPeriod?: string
  mdName: string
  mdSignatureUrl?: string
  awardedByRole?: string
}

export function DownloadAwardLetter(props: DownloadAwardLetterProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { downloadAwardLetter } = await import('@/components/pdf/AwardLetterPDF')
      await downloadAwardLetter(props)
      toast.success('Award letter downloaded successfully')
    } catch (err) {
      toast.error('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 px-5"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
      ) : (
        <><Download className="w-4 h-4 mr-2" />Download Award Letter</>
      )}
    </Button>
  )
}
