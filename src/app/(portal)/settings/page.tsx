import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import { Lock, User, Building2, PenTool } from 'lucide-react'
import { ProfileEditForm } from './ProfileEditForm'
import { ContractorEditForm } from './ContractorEditForm'
import { PasswordChangeForm } from './PasswordChangeForm'
import { SignatureUpload } from '@/app/(portal)/contractor-profile/SignatureUpload'
import type { Profile, Contractor } from '@/types/database'

export default async function SettingsPage() {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  let contractor: Contractor | null = null
  if (p.role === 'contractor') {
    const { data: c } = await supabase.from('contractors').select('*').eq('user_id', user.id).single()
    contractor = c as unknown as Contractor | null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile and security</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-spl-blue-light flex items-center justify-center">
            <User className="w-5 h-5 text-spl-blue" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Personal Information</h2>
            <p className="text-sm text-slate-500">Update your name and contact details</p>
          </div>
        </div>
        <ProfileEditForm profile={p} />
      </div>

      {/* Contractor Company Info */}
      {p.role === 'contractor' && contractor && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-spl-success-bg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-spl-success" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Company & Banking Details</h2>
              <p className="text-sm text-slate-500">Update your company information and bank account</p>
            </div>
          </div>
          <ContractorEditForm contractor={contractor} />
        </div>
      )}

      {/* Digital Signature — staff only (used on award letters & approval docs) */}
      {p.role !== 'contractor' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Digital Signature</h2>
              <p className="text-sm text-slate-500">This signature will be automatically applied to contract award letters</p>
            </div>
          </div>
          <SignatureUpload profile={p} />
        </div>
      )}

      {/* Password Change */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-spl-warning-bg flex items-center justify-center">
            <Lock className="w-5 h-5 text-spl-warning" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Change Password</h2>
            <p className="text-sm text-slate-500">Update your login password</p>
          </div>
        </div>
        <PasswordChangeForm />
      </div>
    </div>
  )
}
