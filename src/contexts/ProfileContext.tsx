'use client'

import { createContext, useContext, useState } from 'react'

interface ProfileUpdate {
  fullName?: string | null
  contractorCompanyName?: string | null
}

interface ProfileContextValue {
  fullName: string | null
  contractorCompanyName: string | null
  updateProfile: (update: ProfileUpdate) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

/**
 * Shared client-side source of truth for the display name shown in the
 * Sidebar (and anywhere else that needs it).
 *
 * The Sidebar/TopBar are rendered by the server-side portal layout, which
 * only re-executes on a full navigation or an explicit `router.refresh()`.
 * Settings forms already call `router.refresh()` on save, but relying on
 * that alone means the visible name only updates once the whole layout's
 * RSC payload round-trips back — this context lets the settings forms push
 * the new value directly into the Sidebar the instant the save succeeds,
 * with `router.refresh()` still keeping the server-rendered data in sync
 * for subsequent navigations.
 */
export function ProfileProvider({
  initialFullName,
  initialContractorCompanyName,
  children,
}: {
  initialFullName: string | null
  initialContractorCompanyName: string | null
  children: React.ReactNode
}) {
  const [fullName, setFullName] = useState(initialFullName)
  const [contractorCompanyName, setContractorCompanyName] = useState(initialContractorCompanyName)

  function updateProfile(update: ProfileUpdate) {
    if (update.fullName !== undefined) setFullName(update.fullName)
    if (update.contractorCompanyName !== undefined) setContractorCompanyName(update.contractorCompanyName)
  }

  return (
    <ProfileContext.Provider value={{ fullName, contractorCompanyName, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileContext must be used within a ProfileProvider')
  return ctx
}
