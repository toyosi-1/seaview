'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Download, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadAwardLetterProps {
  contractNumber: string
  proposalNumber: string
  contractorName: string
  contractorAddress?: string
  contractorPhone?: string
  contractTitle: string
  contractDescription: string
  contractValue: number
  awardDate: string
  bidDate?: string
  completionPeriod?: string
  signatoryName: string
  signatorySignatureUrl?: string
  responsibleDepartment?: string
}

export function DownloadAwardLetter(props: DownloadAwardLetterProps) {
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [open, setOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function closePreview(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setBlob(null)
    }
  }

  async function handlePreview() {
    setLoading(true)
    try {
      const { generateAwardLetterBlob } = await import('@/components/pdf/AwardLetterPDF')
      const generated = await generateAwardLetterBlob(props)
      setBlob(generated)
      setPreviewUrl(URL.createObjectURL(generated))
      setOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate the award letter')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    if (!blob) return
    setDownloading(true)
    try {
      const { saveAs } = await import('file-saver')
      saveAs(blob, `Award-Letter-${props.contractNumber}.pdf`)
      toast.success('Award letter downloaded successfully')
    } catch {
      toast.error('Failed to download the award letter')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={handlePreview}
        disabled={loading}
        className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 px-5"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating preview…</>
        ) : (
          <><Eye className="w-4 h-4 mr-2" />Preview Award Letter</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl">Award Letter Preview</DialogTitle>
            <DialogDescription>
              Review the letter for {props.contractNumber}. Verify the contractor details, contract description, amount, department, and signature before downloading.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            {previewUrl && (
              <iframe
                src={previewUrl}
                title={`Award letter preview for ${props.contractNumber}`}
                className="w-full h-full"
              />
            )}
          </div>
          <div className="flex gap-3 pt-2 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => closePreview(false)} className="flex-1 h-11" disabled={downloading}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !blob}
              className="flex-1 h-11 bg-spl-blue hover:bg-spl-blue-dark text-white"
            >
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {downloading ? 'Downloading…' : 'Download PDF'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
