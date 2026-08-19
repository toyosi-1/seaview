export type UserRole =
  | 'contractor'
  | 'md'
  | 'head_of_procurement'
  | 'head_of_environment'
  | 'head_of_ict'
  | 'head_of_audit'
  | 'head_of_accounts'
  | 'ict_admin'
  | 'contract_officer'
  // Legacy roles kept for backward compatibility with existing DB rows
  | 'procurement_officer'

export type Department = 'procurement' | 'environment' | 'ict' | 'audit' | 'accounts'

export type ContractorStatus = 'pending' | 'active' | 'suspended'

export type ProposalStatus =
  | 'submitted'
  | 'md_review'
  | 'procurement_appraisal'
  | 'md_final_review'
  | 'ict_assignment'
  | 'approved'
  | 'rejected'
  | 'returned'
  // Legacy stages kept for backward compatibility with existing DB rows
  | 'procurement_review'
  | 'head_procurement_review'

export type ContractStatus = 'active' | 'completed' | 'terminated'

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'cancelled'

export type CompletionStatus =
  | 'submitted'
  | 'supervisor_review'
  | 'md_verification'
  | 'audit_review'
  | 'accounts_review'
  | 'payment_pending'
  | 'payment_completed'
  | 'rejected'

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'on_hold' | 'completed'

export type InternalProcurementStatus =
  | 'submitted'
  | 'md_review'
  | 'procurement_review'
  | 'approved'
  | 'rejected'

export type NotificationType =
  | 'proposal_submitted'
  | 'proposal_approved'
  | 'proposal_rejected'
  | 'proposal_returned'
  | 'proposal_forwarded'
  | 'contract_awarded'
  | 'completion_submitted'
  | 'audit_approved'
  | 'audit_rejected'
  | 'payment_completed'
  | 'payment_approved'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  role: UserRole
  phone: string | null
  department: string | null
  is_active: boolean
  signature_url: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Contractor {
  id: string
  user_id: string
  company_name: string
  cac_number: string
  tin_number: string
  bank_name: string
  account_number: string
  account_name: string
  contact_person: string | null
  email: string
  phone: string | null
  address: string | null
  status: ContractorStatus
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export interface ContractorDocument {
  id: string
  contractor_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface Proposal {
  id: string
  proposal_number: string
  contractor_id: string
  title: string
  description: string
  estimated_cost: number
  status: ProposalStatus
  current_stage: string
  submitted_at: string
  md_reviewed_at: string | null
  md_reviewed_by: string | null
  procurement_reviewed_at: string | null
  procurement_reviewed_by: string | null
  appraisal_notes: string | null
  head_proc_reviewed_at: string | null
  head_proc_reviewed_by: string | null
  md_final_approved_at: string | null
  md_final_approved_by: string | null
  rejection_reason: string | null
  return_reason: string | null
  tender_id: string | null
  created_at: string
  updated_at: string
  contractors?: Contractor
  tenders?: Tender
}

export interface Tender {
  id: string
  contract_number: string
  title: string
  description: string
  estimated_value: number | null
  requirements: string | null
  closing_date: string | null
  status: TenderStatus
  posted_by: string
  posted_at: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface ProposalDocument {
  id: string
  proposal_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface ProposalComment {
  id: string
  proposal_id: string
  author_id: string
  stage: string
  comment: string
  action: string | null
  created_at: string
  profiles?: Profile
}

export interface ProposalTimeline {
  id: string
  proposal_id: string
  actor_id: string
  stage: string
  action: string
  note: string | null
  created_at: string
  profiles?: Profile
}

export interface Contract {
  id: string
  contract_number: string
  proposal_id: string
  contractor_id: string
  title: string
  contract_value: number
  status: ContractStatus
  award_letter_url: string | null
  awarded_at: string
  awarded_by: string
  approval_reference: string | null
  responsible_department: Department | null
  completion_period: string | null
  project_supervisor_id: string | null
  department_assigned_at: string | null
  department_assigned_by: string | null
  created_at: string
  updated_at: string
  contractors?: Contractor
  proposals?: Proposal
  project_supervisor?: Profile
}

export interface CompletionReport {
  id: string
  contract_id: string
  contractor_id: string
  title: string
  description: string
  status: CompletionStatus
  submitted_at: string
  supervisor_id: string | null
  supervisor_reviewed_at: string | null
  supervisor_reviewed_by: string | null
  supervisor_notes: string | null
  correction_requested: boolean
  md_verified_at: string | null
  md_verified_by: string | null
  audit_reviewed_at: string | null
  audit_reviewed_by: string | null
  audit_comment: string | null
  accounts_reviewed_at: string | null
  accounts_reviewed_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  contracts?: Contract
  contractors?: Contractor
}

export interface CompletionDocument {
  id: string
  completion_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface Payment {
  id: string
  payment_number: string
  completion_id: string
  contract_id: string
  contractor_id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  tax_deduction: number
  net_amount: number | null
  status: PaymentStatus
  approved_by: string | null
  approved_at: string | null
  payment_reference: string | null
  payment_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  contractors?: Contractor
  contracts?: Contract
}

export interface PaymentDocument {
  id: string
  payment_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  reference_id: string | null
  reference_type: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_role: UserRole | null
  action: string
  entity_type: string
  entity_id: string | null
  previous_status: string | null
  new_status: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  profiles?: Profile
}

export interface InternalProcurementRequest {
  id: string
  request_number: string
  department: Department
  requested_by: string
  item_description: string
  quantity: number
  estimated_cost: number
  reason: string
  status: InternalProcurementStatus
  md_reviewed_at: string | null
  md_reviewed_by: string | null
  procurement_reviewed_at: string | null
  procurement_reviewed_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface InternalProcurementDocument {
  id: string
  request_id: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
}

// Supabase Database generic type (simplified)
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      contractors: { Row: Contractor; Insert: Omit<Contractor, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Contractor> }
      contractor_documents: { Row: ContractorDocument; Insert: Omit<ContractorDocument, 'id' | 'created_at'>; Update: Partial<ContractorDocument> }
      proposals: { Row: Proposal; Insert: Omit<Proposal, 'id' | 'proposal_number' | 'created_at' | 'updated_at'>; Update: Partial<Proposal> }
      proposal_documents: { Row: ProposalDocument; Insert: Omit<ProposalDocument, 'id' | 'created_at'>; Update: Partial<ProposalDocument> }
      proposal_comments: { Row: ProposalComment; Insert: Omit<ProposalComment, 'id' | 'created_at'>; Update: Partial<ProposalComment> }
      proposal_timeline: { Row: ProposalTimeline; Insert: Omit<ProposalTimeline, 'id' | 'created_at'>; Update: Partial<ProposalTimeline> }
      contracts: { Row: Contract; Insert: Omit<Contract, 'id' | 'contract_number' | 'created_at' | 'updated_at'>; Update: Partial<Contract> }
      completion_reports: { Row: CompletionReport; Insert: Omit<CompletionReport, 'id' | 'created_at' | 'updated_at'>; Update: Partial<CompletionReport> }
      completion_documents: { Row: CompletionDocument; Insert: Omit<CompletionDocument, 'id' | 'created_at'>; Update: Partial<CompletionDocument> }
      payments: { Row: Payment; Insert: Omit<Payment, 'id' | 'payment_number' | 'created_at' | 'updated_at'>; Update: Partial<Payment> }
      payment_documents: { Row: PaymentDocument; Insert: Omit<PaymentDocument, 'id' | 'created_at'>; Update: Partial<PaymentDocument> }
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> }
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never }
      internal_procurement_requests: { Row: InternalProcurementRequest; Insert: Omit<InternalProcurementRequest, 'id' | 'request_number' | 'created_at' | 'updated_at'>; Update: Partial<InternalProcurementRequest> }
      internal_procurement_documents: { Row: InternalProcurementDocument; Insert: Omit<InternalProcurementDocument, 'id' | 'created_at'>; Update: Partial<InternalProcurementDocument> }
      tenders: { Row: Tender; Insert: Omit<Tender, 'id' | 'contract_number' | 'created_at' | 'updated_at'>; Update: Partial<Tender> }
    }
  }
}
