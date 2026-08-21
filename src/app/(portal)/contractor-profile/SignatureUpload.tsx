'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Upload, CheckCircle, Loader2, PenLine, Save, Sparkles, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'
import { compressSignature } from '@/lib/utils/compress'
import { cleanSignatureImage } from '@/lib/utils/signatureProcessing'
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad'

export function SignatureUpload({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [padEmpty, setPadEmpty] = useState(true)
  const padRef = useRef<SignaturePadHandle>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null)

  async function saveSignature(blob: Blob, fileName: string) {
    setLoading(true)
    try {
      const supabase = createClient()
      const signatureFile = new File([blob], fileName, { type: 'image/png' })
      const compressed = await compressSignature(signatureFile)
      const path = `signatures/${profile.id}/signature.png`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, compressed, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ signature_url: `${publicUrl}?t=${Date.now()}` })
        .eq('id', profile.id)
      if (updateError) throw updateError

      toast.success('Signature saved successfully')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDrawn() {
    const blob = await padRef.current?.exportPng()
    if (!blob) {
      toast.error('Please draw your signature first')
      return
    }
    await saveSignature(blob, 'signature.png')
  }

  async function handleFileSelect(selected: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCleanedBlob(null)
    setFile(selected)
    if (!selected) return

    setProcessing(true)
    try {
      const cleaned = await cleanSignatureImage(selected)
      setCleanedBlob(cleaned)
      setPreviewUrl(URL.createObjectURL(cleaned))
    } catch {
      toast.error('Could not process image, will use original')
    } finally {
      setProcessing(false)
    }
  }

  async function handleUploadFile() {
    if (!file) return
    const blobToSave = cleanedBlob ?? file
    await saveSignature(blobToSave, 'signature.png')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setCleanedBlob(null)
  }

  function handleRetry() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setCleanedBlob(null)
  }

  return (
    <div className="space-y-4">
      {profile.signature_url ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-spl-success">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Signature on file</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block">
            <Image
              src={profile.signature_url}
              alt="Your signature"
              width={160}
              height={80}
              className="max-h-20 object-contain"
              unoptimized
            />
          </div>
          <p className="text-xs text-slate-500">Draw or upload a new signature below to replace your current one.</p>
        </div>
      ) : (
        <div className="p-4 bg-spl-warning-bg rounded-xl border border-amber-100">
          <p className="text-sm text-spl-warning font-medium">No signature on file yet.</p>
          <p className="text-xs text-spl-warning mt-1">
            For executive staff: your signature will be applied to award letters and approval documents.
          </p>
        </div>
      )}

      <Tabs defaultValue="draw" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="draw">
            <PenLine className="w-4 h-4 mr-1.5" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="file">
            <Upload className="w-4 h-4 mr-1.5" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-3 pt-4">
          <SignaturePad ref={padRef} onChange={(empty) => setPadEmpty(empty)} height={200} />
          <Button
            type="button"
            onClick={handleSaveDrawn}
            disabled={padEmpty || loading}
            className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 px-6"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Signature</>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="file" className="space-y-3 pt-4">
          {!previewUrl && !processing && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-1">Upload a photo or scan of your signature</p>
              <p className="text-xs text-slate-400 mb-3">Any background will be automatically cleaned up</p>
              <Input
                type="file"
                accept="image/*"
                onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
                className="h-10 cursor-pointer max-w-xs mx-auto"
              />
            </div>
          )}

          {processing && (
            <div className="flex flex-col items-center justify-center gap-2 p-10 border-2 border-dashed border-blue-200 rounded-xl bg-spl-blue-light/50">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-sm text-spl-blue font-medium">Removing background & cleaning up signature...</p>
            </div>
          )}

          {previewUrl && !processing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-spl-blue">
                <Sparkles className="w-4 h-4" />
                <p className="text-sm font-medium">Background removed — preview below</p>
              </div>
              <div
                className="p-6 rounded-xl border border-slate-200 inline-block"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Cleaned signature preview" className="max-h-24 object-contain" />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={loading}
                  className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 px-6"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Save Signature</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={loading}
                  className="h-11 px-4"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
