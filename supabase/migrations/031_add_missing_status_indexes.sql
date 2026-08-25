-- completion_reports.status is filtered on the dashboard (.in('status', [...])
-- multiple times), the audit page (.eq('status', 'audit_review')), and the
-- supervisor-pending query — but had no index, unlike proposals/tenders.
CREATE INDEX IF NOT EXISTS idx_completion_reports_status ON public.completion_reports(status);

-- payments.status is filtered on the payments page (.eq('status', 'completed')
-- for contractors) with no supporting index.
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
