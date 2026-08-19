import type { UserRole, ProposalStatus, ContractorStatus, CompletionStatus, PaymentStatus, Department, InternalProcurementStatus, TenderStatus } from '@/types/database'

export const ROLE_LABELS: Record<UserRole, string> = {
  contractor: 'Contractor',
  md: 'Managing Director',
  head_of_procurement: 'Head of Procurement',
  head_of_environment: 'Head of Environment',
  head_of_ict: 'Head of ICT',
  head_of_audit: 'Head of Audit',
  head_of_accounts: 'Head of Accounts',
  ict_admin: 'ICT Administrator',
  contract_officer: 'Procurement Officer',
  procurement_officer: 'Procurement Officer', // legacy
}

// The 8 accounts created by ICT. No officer/staff hierarchy.
export const STAFF_ROLES: UserRole[] = [
  'md',
  'head_of_procurement',
  'head_of_environment',
  'head_of_ict',
  'head_of_audit',
  'head_of_accounts',
  'ict_admin',
  'contract_officer',
]

export const DEPARTMENTS: Department[] = ['procurement', 'environment', 'ict', 'audit', 'accounts']

export const DEPARTMENT_LABELS: Record<Department, string> = {
  procurement: 'Procurement',
  environment: 'Environment',
  ict: 'ICT',
  audit: 'Audit',
  accounts: 'Accounts',
}

// Maps a department to the UserRole that is automatically the Project Supervisor / Head
export const DEPARTMENT_HEAD_ROLE: Record<Department, UserRole> = {
  procurement: 'head_of_procurement',
  environment: 'head_of_environment',
  ict: 'head_of_ict',
  audit: 'head_of_audit',
  accounts: 'head_of_accounts',
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  submitted: 'Submitted',
  md_review: 'MD Review',
  procurement_appraisal: 'Procurement Appraisal',
  md_final_review: 'MD Final Approval',
  ict_assignment: 'ICT Department Assignment',
  approved: 'Approved & Awarded',
  rejected: 'Rejected',
  returned: 'Returned',
  // legacy
  procurement_review: 'Procurement Review',
  head_procurement_review: 'Head of Procurement Review',
}

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  submitted: 'bg-spl-info-bg text-spl-info',
  md_review: 'bg-spl-warning-bg text-spl-warning',
  procurement_appraisal: 'bg-spl-warning-bg text-spl-warning',
  md_final_review: 'bg-spl-info-bg text-spl-info',
  ict_assignment: 'bg-spl-info-bg text-spl-info',
  approved: 'bg-spl-success-bg text-spl-success',
  rejected: 'bg-spl-danger-bg text-spl-danger',
  returned: 'bg-slate-100 text-slate-600',
  // legacy
  procurement_review: 'bg-spl-warning-bg text-spl-warning',
  head_procurement_review: 'bg-spl-warning-bg text-spl-warning',
}

// Simplified statuses shown to contractors (internal stages hidden per business rules)
export const CONTRACTOR_PROPOSAL_STATUS_LABELS: Partial<Record<ProposalStatus, string>> = {
  submitted: 'Submitted',
  md_review: 'Under Review',
  procurement_appraisal: 'Under Review',
  md_final_review: 'Under Review',
  ict_assignment: 'Approved - Finalizing',
  approved: 'Awarded',
  rejected: 'Rejected',
  returned: 'Returned for Clarification',
}

export const CONTRACTOR_STATUS_LABELS: Record<ContractorStatus, string> = {
  pending: 'Pending Verification',
  active: 'Active',
  suspended: 'Suspended',
}

export const CONTRACTOR_STATUS_COLORS: Record<ContractorStatus, string> = {
  pending: 'bg-spl-warning-bg text-spl-warning',
  active: 'bg-spl-success-bg text-spl-success',
  suspended: 'bg-spl-danger-bg text-spl-danger',
}

export const COMPLETION_STATUS_LABELS: Record<CompletionStatus, string> = {
  submitted: 'Submitted',
  supervisor_review: 'Project Supervisor Review',
  md_verification: 'MD Final Acceptance',
  audit_review: 'Audit Review',
  accounts_review: 'Accounts Review',
  payment_pending: 'Payment Pending',
  payment_completed: 'Payment Completed',
  rejected: 'Rejected',
}

// Simplified statuses shown to contractors
export const CONTRACTOR_COMPLETION_STATUS_LABELS: Partial<Record<CompletionStatus, string>> = {
  submitted: 'Completion Under Review',
  supervisor_review: 'Completion Under Review',
  md_verification: 'Completion Under Review',
  audit_review: 'Payment Processing',
  accounts_review: 'Payment Processing',
  payment_pending: 'Payment Processing',
  payment_completed: 'Payment Completed',
  rejected: 'Rejected',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  completed: 'Completed',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-spl-warning-bg text-spl-warning',
  approved: 'bg-spl-info-bg text-spl-info',
  rejected: 'bg-spl-danger-bg text-spl-danger',
  on_hold: 'bg-spl-warning-bg text-spl-warning',
  completed: 'bg-spl-success-bg text-spl-success',
}

export const INTERNAL_PROCUREMENT_STATUS_LABELS: Record<InternalProcurementStatus, string> = {
  submitted: 'Submitted',
  md_review: 'MD Review',
  procurement_review: 'Procurement Review',
  approved: 'Purchase Approved',
  rejected: 'Rejected',
}

export const INTERNAL_PROCUREMENT_STATUS_COLORS: Record<InternalProcurementStatus, string> = {
  submitted: 'bg-spl-info-bg text-spl-info',
  md_review: 'bg-spl-warning-bg text-spl-warning',
  procurement_review: 'bg-spl-warning-bg text-spl-warning',
  approved: 'bg-spl-success-bg text-spl-success',
  rejected: 'bg-spl-danger-bg text-spl-danger',
}

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
}

export const TENDER_STATUS_COLORS: Record<TenderStatus, string> = {
  open: 'bg-spl-success-bg text-spl-success',
  closed: 'bg-spl-warning-bg text-spl-warning',
  awarded: 'bg-spl-info-bg text-spl-info',
  cancelled: 'bg-spl-danger-bg text-spl-danger',
}

export const WORKFLOW_STAGES = [
  { key: 'submitted', label: 'Submitted by Contractor', role: 'contractor' },
  { key: 'md_review', label: 'MD Initial Review', role: 'md' },
  { key: 'procurement_appraisal', label: 'Procurement Appraisal', role: 'head_of_procurement' },
  { key: 'md_final_review', label: 'MD Final Approval', role: 'md' },
  { key: 'ict_assignment', label: 'ICT Department Assignment', role: 'ict_admin' },
  { key: 'approved', label: 'Award Letter Issued', role: 'md' },
]

export const INTERNAL_ROLES: UserRole[] = [
  'md',
  'head_of_procurement',
  'head_of_environment',
  'head_of_ict',
  'head_of_audit',
  'head_of_accounts',
  'ict_admin',
  'contract_officer',
  'procurement_officer', // legacy
]
