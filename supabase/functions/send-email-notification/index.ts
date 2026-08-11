import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@seaviewproperties.com";
const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://bwdbxtnzmrzfbonbpikv.supabase.co";

const EMAIL_TEMPLATES: Record<string, (title: string, message: string) => { subject: string; body: string }> = {
  proposal_submitted: (_t, m) => ({ subject: "New Proposal Submitted — Action Required", body: m }),
  proposal_approved: (_t, m) => ({ subject: "Proposal Approved", body: m }),
  proposal_rejected: (_t, m) => ({ subject: "Proposal Rejected", body: m }),
  proposal_returned: (_t, m) => ({ subject: "Proposal Returned for Clarification", body: m }),
  proposal_forwarded: (_t, m) => ({ subject: "Proposal Requires Your Action", body: m }),
  contract_awarded: (_t, m) => ({ subject: "Contract Awarded", body: m }),
  completion_submitted: (_t, m) => ({ subject: "Completion Report Requires Review", body: m }),
  audit_approved: (_t, m) => ({ subject: "Audit Review Approved", body: m }),
  audit_rejected: (_t, m) => ({ subject: "Audit Review Rejected", body: m }),
  payment_completed: (_t, m) => ({ subject: "Payment Completed", body: m }),
  payment_approved: (_t, m) => ({ subject: "Payment Update", body: m }),
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

    // Support both single notification and batch
    const notifications = Array.isArray(payload) ? payload : [payload];

    const emails: { email: string; subject: string; content: string }[] = [];

    for (const n of notifications) {
      const { user_id, type, title, message } = n;

      // Look up user email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email,full_name")
        .eq("id", user_id)
        .single();

      if (!profile?.email) continue;

      const template = EMAIL_TEMPLATES[type];
      const { subject, body } = template
        ? template(title, message)
        : { subject: title, body: message };

      emails.push({
        email: profile.email,
        subject,
        content: `Dear ${profile.full_name},\n\n${body}\n\n— Sea View Properties Procurement Portal`,
      });
    }

    // Send emails via Resend API
    let sent = 0;
    for (const email of emails) {
      if (RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email.email,
            subject: email.subject,
            text: email.content,
          }),
        });
        if (res.ok) sent++;
      } else {
        // No API key configured — log to console for development
        console.log(`[EMAIL] To: ${email.email} | Subject: ${email.subject} | Body: ${email.content}`);
        sent++;
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
