import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RegisterBody {
  email: string
  password: string
  companyName: string
  cacNumber: string
  tinNumber: string
  bankName: string
  accountNumber: string
  accountName: string
}

export async function POST(request: Request) {
  let body: RegisterBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password, companyName, cacNumber, tinNumber, bankName, accountNumber, accountName } = body

  if (!email?.trim() || !password || !companyName?.trim() || !cacNumber?.trim() || !tinNumber?.trim() ||
      !bankName?.trim() || !accountNumber?.trim() || !accountName?.trim()) {
    return NextResponse.json({ error: 'All required fields must be filled in' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create the auth user, pre-confirmed so they can log in immediately
  const { data: userData, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createUserError || !userData.user) {
    const message = createUserError?.message ?? 'Failed to create account'
    const status = message.toLowerCase().includes('already') ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }

  const userId = userData.user.id

  // Create profile row — contractors are active immediately, no MD approval required
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    full_name: companyName.trim(),
    email,
    role: 'contractor',
    is_active: true,
  } as never)

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  // Create contractor row — active immediately so they can bid
  const { error: contractorError } = await admin.from('contractors').insert({
    user_id: userId,
    company_name: companyName.trim(),
    cac_number: cacNumber.trim(),
    tin_number: tinNumber.trim(),
    bank_name: bankName.trim(),
    account_number: accountNumber.trim(),
    account_name: accountName.trim(),
    contact_person: null,
    email,
    phone: null,
    status: 'active',
  } as never)

  if (contractorError) {
    await admin.from('profiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
    const message = contractorError.message.includes('duplicate')
      ? 'A contractor with this CAC or TIN number is already registered'
      : contractorError.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
