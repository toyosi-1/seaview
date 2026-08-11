# PROPOSAL FOR THE DIGITALIZATION OF PROCUREMENT & CONTRACTOR MANAGEMENT

## Submitted to: Nigerian Ports Authority (NPA) — Sea View Properties

**Project Title:** Digital Procurement & Contractor Management Portal  
**Prepared by:** [Your Name / Organization]  
**Date:** July 2026  

---

## 1. EXECUTIVE SUMMARY

The Federal Government of Nigeria, through the **National Digital Economy Policy and Strategy (NDEPS)** and the directives of the **National Information Technology Development Agency (NITDA)**, has made the digitalization of government operations a national priority. The Director General of NITDA, **Malam Kashifu Inuwa Abdullahi, CCIE**, has been unequivocal in his call for all government agencies and parastatals to embrace digital transformation, stating that digitalization is essential for _"operational excellence, cost saving and efficiency"_ and is _"in line with Nigeria's National Digital Economy Policy and Strategy (NDEPS)."_

In direct response to this national mandate, we propose the implementation of a comprehensive **Digital Procurement & Contractor Management Portal** for Sea View Properties, a subsidiary of the Nigerian Ports Authority. This portal replaces manual, paper-based procurement processes with a secure, transparent, and auditable digital system — exactly the kind of _paperless operation_ that NITDA has championed across federal agencies.

The portal covers the entire procurement lifecycle — from contractor registration to contract award, project completion, audit review, and payment processing — while enforcing multi-tier approval workflows, role-based access control, and immutable audit logging. It is built on modern, enterprise-grade technology and is designed to **eliminate corruption, reduce processing times, ensure accountability, and provide real-time visibility** into all procurement activities.

This proposal aligns directly with the Federal Government's digitalization agenda and positions Sea View Properties as a trailblazer within the NPA family — demonstrating how parastatals can leverage technology to deliver _"accurate auditing"_ and _"automation of activities"_ as envisioned by Nigeria's digital transformation leadership.

---

## 2. POLICY & REGULATORY CONTEXT

### 2.1 National Digital Economy Policy and Strategy (NDEPS)

The **National Digital Economy Policy and Strategy (NDEPS)**, launched by the Federal Government of Nigeria, provides the overarching framework for the nation's digital transformation. The policy mandates all Ministries, Departments, and Agencies (MDAs) — including parastatals like the Nigerian Ports Authority and its subsidiaries — to adopt digital technologies in their operations. NDEPS identifies key pillars including:

- **Digital Literacy and Skills** — ensuring public servants can operate digital platforms
- **Solid Infrastructure** — leveraging cloud and internet technologies
- **Digital Society and Emerging Technologies** — adopting modern solutions for governance
- **Soft Infrastructure** — digitizing government processes and services

This proposal directly serves the NDEPS mandate by digitalizing one of the most critical functions of any government agency: **public procurement**.

### 2.2 NITDA's Digital Transformation Directive

The **National Information Technology Development Agency (NITDA)**, under the leadership of its Director General, **Malam Kashifu Inuwa Abdullahi, CCIE**, has been at the forefront of driving digital adoption across federal agencies. In his public statements advocating for digital transformation, the NITDA DG has emphasized:

> _"I am aware that [agencies] are working on how to use emerging technologies to come up with new business processes that will improve service delivery."_  
> — **Malam Kashifu Inuwa Abdullahi, CCIE, Director General, NITDA**

He has further stressed that digital transformation enables agencies to _"create efficiencies by improving automation of [their] activities, providing accurate auditing and applying records schedules reliably"_ — a vision that this procurement portal directly fulfills.

NITDA has applauded agencies that have adopted paperless operations, describing such leaders as _"game changers"_ who _"think different, and create value."_ Sea View Properties has the opportunity to position itself as exactly such a trailblazer within the NPA family.

### 2.3 Bureau of Public Procurement (BPP) and E-Procurement

The **Bureau of Public Procurement (BPP)**, the regulatory body overseeing public procurement in Nigeria under the **Public Procurement Act 2007**, has consistently advocated for the transition from manual to electronic procurement (e-procurement). The BPP has recognized that digitalizing procurement processes is essential for:

- Ensuring **transparency and fair competition** in the award of government contracts
- **Reducing procurement costs** and eliminating waste
- Providing **real-time monitoring** of procurement activities
- Creating **verifiable audit trails** for every procurement decision
- **Standardizing** procurement processes across all MDAs

This portal implements these exact principles, providing a digital procurement framework that complies with the spirit and letter of the Public Procurement Act.

### 2.4 The Tinubu Administration's Digital Economy Agenda

The current administration of **President Bola Ahmed Tinubu, GCFR** has reaffirmed and accelerated the federal government's commitment to digital transformation as a cornerstone of economic reform. The administration's digital economy priorities include:

- Modernizing government service delivery through technology
- Promoting **transparency, accountability, and anti-corruption** through digital systems
- Leveraging technology to **reduce the cost of governance**
- Building public trust through **verifiable, auditable** government processes

This proposal is a direct contribution to that agenda.

---

## 3. PROBLEM STATEMENT & JUSTIFICATION

### 3.1 Current Challenges

The existing procurement process at Sea View Properties and similar parastatals suffers from:

- **Manual, paper-based workflows** that are slow, error-prone, and difficult to track — the very _"paper copies that pile up in boxes, storerooms or warehouses"_ that NITDA's leadership has warned against
- **Lack of transparency** in contract awards, creating opportunities for corruption and favouritism
- **No centralized audit trail**, making it difficult to investigate disputes or misconduct — contrary to the _"accurate auditing"_ that digital transformation enables
- **Fragmented communication** between contractors, procurement officers, and approval authorities
- **No real-time reporting**, preventing leadership from making data-driven decisions
- **Difficulty in tracking contractor performance** and project completion status
- **Inefficient payment processes** with no digital evidence or accountability

### 3.2 Justification

As NITDA's DG has stated, the adoption of digital processes enables organizations to _"create efficiencies by improving automation of [their] activities, providing accurate auditing and applying records schedules reliably."_ The digitalization of Sea View Properties' procurement process is not merely a technology upgrade — it is a **strategic imperative** mandated by national policy and essential for:

- **Compliance** with NDEPS, NITDA directives, and BPP e-procurement guidelines
- **Transparency and anti-corruption** as demanded by the Federal Government
- **Operational efficiency** and cost reduction
- **Accountability** through immutable, tamper-proof audit trails
- **Data-driven governance** through real-time executive dashboards

---

## 4. PROPOSED SOLUTION

### 4.1 Overview

The **Digital Procurement & Contractor Management Portal** is a web-based platform that digitizes the end-to-end procurement and contractor management lifecycle. It provides role-based access to all stakeholders and enforces a structured, multi-tier approval workflow that mirrors existing organizational hierarchies.

### 4.2 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend / Database** | Supabase (PostgreSQL, Authentication, Storage) |
| **Security** | Supabase Row Level Security (RLS), Role-based Access Control |
| **PDF Generation** | @react-pdf/renderer for award letters and official documents |
| **Real-time Notifications** | Supabase Realtime, Sonner in-app notifications |
| **Hosting** | Cloud-based (Vercel / Supabase Cloud) |

### 4.3 Key Modules

#### 4.3.1 Contractor Registration
- Online self-service registration for contractors
- Document upload (CAC certificate, tax clearance, specialized competence certificates)
- Verification and approval by the MD
- Digital contractor profile management

#### 4.3.2 Proposal Submission
- Contractors submit proposals online with supporting documents
- Automatic tracking and unique reference numbers
- Status visibility for contractors at every stage

#### 4.3.3 Multi-Tier Approval Workflow
The system enforces a strict, sequential approval chain:

```
Contractor submits proposal
  → MD Initial Review
    → Procurement Officer Appraisal
      → Head of Procurement Approval
        → MD Final Approval → Contract Awarded (CON-YYYY-XXXX)
```

No stage can be skipped. Each approver can approve, reject, or request modifications with comments.

#### 4.3.4 Digital Signature & Contract Award
- Authorized officers upload digital signatures (PNG)
- System automatically generates professional PDF award letters with embedded signatures
- Unique contract reference numbers (CON-YYYY-XXXX) auto-generated
- Award letters downloadable and archived

#### 4.3.5 Project Completion Management
- Contractors submit completion reports with evidence
- MD verification stage
- Head of Audit review and approval
- Forwarding to Accounts for payment processing

```
Contractor submits Completion Report
  → MD Verification
    → Head of Audit Review
      → Head of Accounts → Payment Processed (PAY-YYYY-XXXX)
```

#### 4.3.6 Audit & Compliance
- **Immutable audit log** — database triggers prevent UPDATE/DELETE of log entries
- Every action (login, approval, rejection, edit, payment) is logged with timestamp, user, and action details
- ICT Administrator has read-only access to audit logs
- Internal minutes and comments are hidden from contractors

#### 4.3.7 Accounts & Payment Processing
- Head of Accounts processes payments upon audit approval
- Payment evidence upload (receipts, transfer confirmations)
- Unique payment reference numbers (PAY-YYYY-XXXX)
- Contractors can track payment status in real-time

#### 4.3.8 Executive Dashboard
- Real-time analytics and KPIs for leadership
- Visual charts: total proposals, active contracts, completed projects, payments processed
- Mobile-responsive design for on-the-go access
- Role-specific dashboard views

#### 4.3.9 Universal Search
- Fuzzy search across all entities (contractors, proposals, contracts, payments)
- Quick access to any record from any page
- Search by name, reference number, status, or date

#### 4.3.10 Notifications
- Real-time in-app notifications via Supabase Realtime
- Users are alerted when actions are required of them
- Notification history and read/unread status

---

## 5. USER ROLES & ACCESS CONTROL

| Role | Access Level |
|------|-------------|
| **Contractor** | Register, submit proposals, upload completions, view payment status |
| **Managing Director (MD)** | Full access — initial & final approval, verification |
| **Procurement Officer** | Appraise proposals, forward to Head of Procurement |
| **Head of Procurement** | Review appraisals, approve/reject, forward to MD |
| **Head of Audit** | Review completions, approve, forward to Accounts |
| **Head of Accounts** | Process payments, upload payment evidence |
| **ICT Administrator** | User management, audit logs, system settings (cannot participate in approvals) |

Access control is enforced at the **database level** using Supabase Row Level Security (RLS), ensuring that no user can access data outside their authorized scope — even through direct database queries.

---

## 6. SECURITY & COMPLIANCE

### 6.1 Data Security
- **Row Level Security (RLS)** policies on every table
- Role-based access control enforced at database and application layers
- Secure file storage with bucket-level policies
- Environment-protected service keys

### 6.2 Audit & Accountability
- Immutable audit log — tamper-proof by design (database triggers prevent modification)
- Complete action history for every record
- User activity tracking (login times, actions performed)
- ICT Administrator oversight without procurement interference

### 6.3 Data Integrity
- PostgreSQL relational database with foreign key constraints
- Enumerated types for statuses (prevents invalid states)
- Automatic timestamping on all records
- Unique reference number generation for contracts and payments

---

## 7. BENEFITS & VALUE PROPOSITION

### 7.1 For the Federal Government
- **Transparency:** Every procurement action is logged, traceable, and auditable
- **Anti-Corruption:** Multi-tier approvals with no bypass capability; immutable audit trail
- **Efficiency:** Digital workflows reduce processing time from weeks to days
- **Data-Driven Governance:** Real-time dashboards for monitoring and reporting
- **Alignment with NDEPS and NITDA Directives:** Directly fulfills the national digitalization mandate as articulated by NITDA's leadership

### 7.2 For Sea View Properties / NPA
- **Cost Savings:** Eliminates paper, printing, and manual processing costs
- **Reduced Processing Time:** Parallel and tracked workflows
- **Improved Contractor Relationships:** Transparency and self-service portal
- **Risk Mitigation:** Complete audit trail for investigations and compliance
- **Scalability:** System can be extended to other NPA subsidiaries

### 7.3 For Contractors
- **Convenience:** Online registration, proposal submission, and status tracking
- **Transparency:** Real-time visibility into proposal and payment status
- **Fairness:** Standardized process with no human interference in workflow

---

## 8. PROJECT IMPLEMENTATION PLAN

### Phase 1: Deployment & Configuration (Weeks 1–2)
- Deploy portal to production environment
- Configure Supabase project, database, and storage
- Set up user accounts for all roles
- Migrate existing contractor and contract data (if any)

### Phase 2: User Training & Onboarding (Weeks 2–3)
- Train MD, Procurement Officers, Head of Procurement, Head of Audit, Head of Accounts
- Train ICT Administrator on user management and audit log monitoring
- Provide contractor onboarding guide and self-service registration support

### Phase 3: Go-Live & Support (Week 4)
- Official launch and migration from manual to digital process
- Dedicated support during initial weeks
- Monitor system performance and user feedback

### Phase 4: Enhancement & Scaling (Ongoing)
- Collect user feedback for continuous improvement
- Add features based on evolving requirements
- Scale to additional NPA subsidiaries as needed

---

## 9. TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│                  Web Browser                     │
│         (Contractors, Staff, Leadership)         │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────┐
│           Next.js 15 Application                 │
│   (SSR + Client-side, Role-based Routing)       │
│   Tailwind CSS + shadcn/ui Components           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              Supabase Backend                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ PostgreSQL│  │   Auth   │  │   Storage    │  │
│  │  + RLS    │  │ (JWT)    │  │ (Documents)  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │         Realtime (Notifications)          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 10. SYSTEM REQUIREMENTS

### 10.1 User Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- No software installation required (web-based)

### 10.2 Infrastructure Requirements
- Supabase account (Cloud or self-hosted)
- Vercel account for application hosting (or equivalent Node.js hosting)
- Domain name and SSL certificate
- Supabase environment variables (URL, Anon Key, Service Role Key)

---

## 11. COST CONSIDERATIONS

| Item | Description | Estimated Cost |
|------|------------|----------------|
| **Supabase** | Database, Auth, Storage, Realtime | Free tier (up to 500MB DB) / Pro plan (~$25/mo) |
| **Vercel Hosting** | Application hosting | Free tier / Pro plan (~$20/mo) |
| **Domain Name** | Custom domain (e.g., procurement.seaview.npa.gov.ng) | ~$15/year |
| **SSL Certificate** | Included with Vercel/Supabase | Free |
| **Development** | One-time development cost | [To be quoted] |
| **Training** | User training and onboarding | [To be quoted] |
| **Maintenance** | Monthly support and updates (optional) | [To be quoted] |

> *Note: The system uses open-source technologies, keeping licensing costs at zero. Ongoing costs are limited to cloud hosting and optional maintenance.*

---

## 12. WHY THIS SOLUTION

### 12.1 Built for Nigerian Government Context
- Designed specifically for the NPA / Sea View Properties organizational structure
- Approval workflow mirrors existing hierarchical processes
- Role definitions match actual staff designations

### 12.2 Enterprise-Grade Yet Affordable
- Uses open-source technologies (zero licensing fees)
- Cloud-hosted (no server hardware required)
- Scales from dozens to thousands of users

### 12.3 Secure by Design
- Database-level security (RLS) — not just application-level
- Immutable audit log — tamper-proof
- Role separation (ICT Admin cannot interfere with procurement)

### 12.4 Rapidly Deployable
- System is already developed and tested
- Can be deployed within 2–4 weeks
- Minimal infrastructure setup required

---

## 13. CONCLUSION

The Digital Procurement & Contractor Management Portal represents a transformative step for Sea View Properties and the Nigerian Ports Authority in fulfilling the Federal Government's digitalization mandate as articulated through NDEPS, NITDA directives, and BPP e-procurement guidelines. By replacing manual processes with a secure, transparent, and auditable digital system, the organization will achieve:

- **Full transparency** in all procurement activities
- **Accountability** through immutable audit trails
- **Efficiency** through automated workflows
- **Cost savings** through elimination of paper-based processes
- **Data-driven decision making** through real-time dashboards

We are confident that this solution will serve as a **model for digitalization across all NPA subsidiaries** and potentially other federal parastatals.

We welcome the opportunity to present this proposal in detail and demonstrate the working system.

---

**Contact Information:**

- **Name:** [Your Name]
- **Title:** [Your Title]
- **Organization:** [Your Organization]
- **Email:** [Your Email]
- **Phone:** [Your Phone Number]

---

*This proposal is submitted in response to the Federal Government of Nigeria's directive on the digitalization of parastatal operations, in alignment with the National Digital Economy Policy and Strategy (NDEPS), NITDA's digital transformation mandate, and the Bureau of Public Procurement's e-procurement framework.*
