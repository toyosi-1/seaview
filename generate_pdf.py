"""
Generate a professional PDF proposal for the Digital Procurement & Contractor Management Portal.
Uses reportlab Platypus for flowing document layout.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, HRFlowable, KeepTogether, Image
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas
import os

# ── Brand colours ──────────────────────────────────────────────
NAVY        = HexColor("#1E3A8A")
LIGHT_BLUE  = HexColor("#DBEAFE")
WHITE       = HexColor("#FFFFFF")
SLATE       = HexColor("#475569")
DARK        = HexColor("#0F172A")
GREEN       = HexColor("#16A34A")
AMBER       = HexColor("#D97706")
RED         = HexColor("#DC2626")
LIGHT_BG    = HexColor("#F8FAFF")
BORDER      = HexColor("#E2E8F0")
ACCENT_BLUE = HexColor("#1D4ED8")

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "SeaView_Procurement_Portal_Proposal.pdf")

# ── Page dimensions ─────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN_L = 22 * mm
MARGIN_R = 22 * mm
MARGIN_T = 28 * mm
MARGIN_B = 25 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# ── Styles ──────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle(
    'CoverTitle', parent=styles['Title'],
    fontName='Helvetica-Bold', fontSize=26, leading=32,
    textColor=WHITE, alignment=TA_LEFT, spaceAfter=6)

style_cover_subtitle = ParagraphStyle(
    'CoverSubtitle', parent=styles['Normal'],
    fontName='Helvetica', fontSize=13, leading=18,
    textColor=HexColor("#BAD5FD"), alignment=TA_LEFT, spaceAfter=4)

style_cover_small = ParagraphStyle(
    'CoverSmall', parent=styles['Normal'],
    fontName='Helvetica', fontSize=10.5, leading=14,
    textColor=HexColor("#7DA8E8"), alignment=TA_LEFT)

style_cover_tag = ParagraphStyle(
    'CoverTag', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=9, leading=12,
    textColor=HexColor("#93C5FD"), alignment=TA_LEFT, spaceAfter=10)

style_h1 = ParagraphStyle(
    'H1', parent=styles['Heading1'],
    fontName='Helvetica-Bold', fontSize=16, leading=20,
    textColor=NAVY, spaceBefore=18, spaceAfter=8,
    borderPadding=0)

style_h2 = ParagraphStyle(
    'H2', parent=styles['Heading2'],
    fontName='Helvetica-Bold', fontSize=12.5, leading=16,
    textColor=NAVY, spaceBefore=12, spaceAfter=4)

style_h3 = ParagraphStyle(
    'H3', parent=styles['Heading3'],
    fontName='Helvetica-Bold', fontSize=11, leading=14,
    textColor=HexColor("#1D4ED8"), spaceBefore=8, spaceAfter=3)

style_body = ParagraphStyle(
    'Body', parent=styles['Normal'],
    fontName='Helvetica', fontSize=10, leading=14.5,
    textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6)

style_body_left = ParagraphStyle(
    'BodyLeft', parent=style_body,
    alignment=TA_LEFT)

style_bullet = ParagraphStyle(
    'Bullet', parent=style_body,
    leftIndent=14, bulletIndent=2, spaceAfter=3, alignment=TA_LEFT)

style_small = ParagraphStyle(
    'Small', parent=styles['Normal'],
    fontName='Helvetica', fontSize=9, leading=12,
    textColor=SLATE, alignment=TA_LEFT)

style_table_header = ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=9.5, leading=12,
    textColor=WHITE, alignment=TA_LEFT)

style_table_cell = ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontName='Helvetica', fontSize=9.5, leading=12,
    textColor=DARK, alignment=TA_LEFT)

style_table_cell_bold = ParagraphStyle(
    'TableCellBold', parent=style_table_cell,
    fontName='Helvetica-Bold')

style_note = ParagraphStyle(
    'Note', parent=styles['Normal'],
    fontName='Helvetica-Oblique', fontSize=9, leading=12,
    textColor=SLATE, alignment=TA_LEFT, spaceBefore=4)

style_code = ParagraphStyle(
    'Code', parent=styles['Normal'],
    fontName='Courier', fontSize=8.5, leading=12,
    textColor=DARK, alignment=TA_LEFT, spaceBefore=4, spaceAfter=4,
    backColor=HexColor("#F1F5F9"), borderPadding=6)


# ── Custom flowables ────────────────────────────────────────────
class ColoredBar(Flowable):
    """A full-width colored bar with optional text — used as section divider."""
    def __init__(self, width, height, color, text="", text_color=WHITE, font_size=10):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.color = color
        self.text = text
        self.text_color = text_color
        self.font_size = font_size

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        if self.text:
            self.canv.setFillColor(self.text_color)
            self.canv.setFont('Helvetica-Bold', self.font_size)
            self.canv.drawString(6, (self.height - self.font_size) / 2 + 1, self.text)


class CoverPage(Flowable):
    """Full-page cover with navy background and accent stripe."""
    def __init__(self):
        Flowable.__init__(self)
        self.width = PAGE_W
        self.height = PAGE_H

    def wrap(self, *args):
        return (PAGE_W, PAGE_H)

    def draw(self):
        c = self.canv
        # Navy background
        c.setFillColor(NAVY)
        c.rect(-MARGIN_L, -MARGIN_B, PAGE_W, PAGE_H, fill=1, stroke=0)
        # Dark lower section
        c.setFillColor(DARK)
        c.rect(-MARGIN_L, -MARGIN_B, PAGE_W, PAGE_H * 0.35, fill=1, stroke=0)
        # Accent stripe (right side)
        c.setFillColor(ACCENT_BLUE)
        c.rect(PAGE_W - MARGIN_L - 50*mm, -MARGIN_B, 50*mm, PAGE_H, fill=1, stroke=0)
        # Logo circle
        c.setFillColor(HexColor("#2A5FCC"))
        c.setStrokeColor(WHITE)
        c.setLineWidth(1.5)
        cx = PAGE_W - MARGIN_L - 25*mm
        cy = PAGE_H - MARGIN_B - 55*mm
        c.circle(cx, cy, 14*mm, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 18)
        c.drawCentredString(cx, cy - 5, "SVP")


# ── Page templates ──────────────────────────────────────────────
def cover_page_template(canvas_obj, doc):
    """Draw the cover page background."""
    c = canvas_obj
    c.saveState()
    # Full navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Dark lower section
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H * 0.35, fill=1, stroke=0)
    # Accent stripe (right side)
    c.setFillColor(ACCENT_BLUE)
    c.rect(PAGE_W - 50*mm, 0, 50*mm, PAGE_H, fill=1, stroke=0)
    # Logo circle
    c.setFillColor(HexColor("#2A5FCC"))
    c.setStrokeColor(WHITE)
    c.setLineWidth(1.5)
    cx = PAGE_W - 25*mm
    cy = PAGE_H - 55*mm
    c.circle(cx, cy, 14*mm, fill=1, stroke=1)
    c.setFillColor(WHITE)
    c.setFont('Helvetica-Bold', 18)
    c.drawCentredString(cx, cy - 5, "SVP")
    c.restoreState()


def content_page_template(canvas_obj, doc):
    """Draw header bar and footer on content pages."""
    c = canvas_obj
    c.saveState()
    # Top navy bar
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 18*mm, PAGE_W, 18*mm, fill=1, stroke=0)
    # Title in header
    c.setFillColor(WHITE)
    c.setFont('Helvetica-Bold', 9)
    c.drawString(MARGIN_L, PAGE_H - 11*mm, "Sea View Properties  \u00b7  Digital Procurement Portal Proposal")
    c.setFont('Helvetica', 8)
    c.setFillColor(HexColor("#BAD5FD"))
    c.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 11*mm, "July 2026")
    # Footer line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, 15*mm, PAGE_W - MARGIN_R, 15*mm)
    c.setFillColor(SLATE)
    c.setFont('Helvetica', 8)
    c.drawString(MARGIN_L, 10*mm, "Confidential  \u00b7  Sea View Properties Ltd  \u00b7  Nigerian Ports Authority")
    c.drawRightString(PAGE_W - MARGIN_R, 10*mm, f"Page {doc.page}")
    c.restoreState()


# ── Helper functions ────────────────────────────────────────────
def make_table(data, col_widths, header_bg=NAVY, zebra=True):
    """Create a styled table with header row."""
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), header_bg),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9.5),
        ('TEXTCOLOR', (0, 1), (-1, -1), DARK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 1, NAVY),
    ]
    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_cmds.append(('BACKGROUND', (0, i), (-1, i), HexColor("#F1F5F9")))
    t.setStyle(TableStyle(style_cmds))
    return t


def bullet_list(items, style=None):
    """Create a bullet list flowable."""
    if style is None:
        style = style_bullet
    flowables = []
    for item in items:
        flowables.append(ListItem(
            Paragraph(item, style),
            leftIndent=10, value='\u2022',
            bulletColor=NAVY))
    return ListFlowable(flowables, bulletType='bullet', start='\u2022',
                        leftIndent=14, bulletFontSize=9)


def section_divider(text):
    """A colored section divider bar."""
    return ColoredBar(CONTENT_W, 8*mm, NAVY, text, WHITE, 11)


# ── Build document ──────────────────────────────────────────────
def build_pdf():
    from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame

    doc = BaseDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="Digital Procurement & Contractor Management Portal — Proposal",
        author="Sea View Properties Ltd",
        subject="Proposal for Digitalization of Procurement Operations",
    )

    # Cover page frame (full page, no margins)
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id='cover',
                        leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0)
    cover_template = PageTemplate(id='cover', frames=[cover_frame],
                                  onPage=cover_page_template)

    # Content page frame
    content_frame = Frame(MARGIN_L, MARGIN_B, CONTENT_W,
                          PAGE_H - MARGIN_T - MARGIN_B - 5*mm,
                          id='content',
                          leftPadding=0, rightPadding=0,
                          topPadding=0, bottomPadding=0)
    content_template = PageTemplate(id='content', frames=[content_frame],
                                    onPage=content_page_template)

    doc.addPageTemplates([cover_template, content_template])

    story = []

    # ════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════════════════
    # Use spacers to position content on the cover
    story.append(Spacer(1, 35*mm))
    story.append(Paragraph("PROPOSAL FOR FEDERAL GOVERNMENT DIGITALIZATION MANDATE", style_cover_tag))
    story.append(Paragraph("Digital Procurement &amp;<br/>Contractor Management<br/>Portal", style_cover_title))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(
        "In alignment with the Federal Government's directive to<br/>digitalize all parastatal operations",
        style_cover_subtitle))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(
        "Sea View Properties Ltd  \u00b7  A Subsidiary of the Nigerian Ports Authority",
        style_cover_small))
    story.append(Spacer(1, 40*mm))
    story.append(Paragraph("July 2026", style_cover_small))

    # Switch to content template
    from reportlab.platypus import NextPageTemplate
    story.append(NextPageTemplate('content'))
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph("Table of Contents", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=8))

    toc_items = [
        "1.  Executive Summary",
        "2.  Policy &amp; Regulatory Context",
        "3.  Problem Statement &amp; Justification",
        "4.  Proposed Solution",
        "5.  User Roles &amp; Access Control",
        "6.  Security &amp; Compliance",
        "7.  Benefits &amp; Value Proposition",
        "8.  Project Implementation Plan",
        "9.  Technical Architecture",
        "10. System Requirements",
        "11. Cost Considerations",
        "12. Why This Solution",
        "13. Conclusion",
    ]
    for item in toc_items:
        story.append(Paragraph(item, ParagraphStyle(
            'TOC', parent=style_body_left, fontSize=11, leading=18,
            leftIndent=10, textColor=DARK)))
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # 1. EXECUTIVE SUMMARY
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("1.  Executive Summary"))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "The Federal Government of Nigeria, through the <b>National Digital Economy Policy and Strategy "
        "(NDEPS)</b> and the directives of the <b>National Information Technology Development Agency "
        "(NITDA)</b>, has made the digitalization of government operations a national priority. The "
        "Director General of NITDA, <b>Malam Kashifu Inuwa Abdullahi, CCIE</b>, has been unequivocal "
        "in his call for all government agencies and parastatals to embrace digital transformation, "
        "stating that digitalization is essential for <i>\"operational excellence, cost saving and "
        "efficiency\"</i> and is <i>\"in line with Nigeria's National Digital Economy Policy and "
        "Strategy (NDEPS).\"</i>", style_body))
    story.append(Paragraph(
        "In direct response to this national mandate, we propose the implementation of a comprehensive "
        "<b>Digital Procurement &amp; Contractor Management Portal</b> for Sea View Properties, a "
        "subsidiary of the Nigerian Ports Authority. This portal replaces manual, paper-based "
        "procurement processes with a secure, transparent, and auditable digital system \u2014 exactly "
        "the kind of <i>paperless operation</i> that NITDA has championed across federal agencies.",
        style_body))
    story.append(Paragraph(
        "The portal covers the entire procurement lifecycle \u2014 from contractor registration to "
        "contract award, project completion, audit review, and payment processing \u2014 while "
        "enforcing multi-tier approval workflows, role-based access control, and immutable audit "
        "logging. It is built on modern, enterprise-grade technology and is designed to "
        "<b>eliminate corruption, reduce processing times, ensure accountability, and provide "
        "real-time visibility</b> into all procurement activities.", style_body))
    story.append(Paragraph(
        "This proposal aligns directly with the Federal Government's digitalization agenda and "
        "positions Sea View Properties as a trailblazer within the NPA family \u2014 demonstrating "
        "how parastatals can leverage technology to deliver <i>\"accurate auditing\"</i> and "
        "<i>\"automation of activities\"</i> as envisioned by Nigeria's digital transformation "
        "leadership.", style_body))

    # ════════════════════════════════════════════════════════════════
    # 2. POLICY & REGULATORY CONTEXT
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("2.  Policy &amp; Regulatory Context"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("2.1  National Digital Economy Policy and Strategy (NDEPS)", style_h2))
    story.append(Paragraph(
        "The <b>National Digital Economy Policy and Strategy (NDEPS)</b>, launched by the Federal "
        "Government of Nigeria, provides the overarching framework for the nation's digital "
        "transformation. The policy mandates all Ministries, Departments, and Agencies (MDAs) \u2014 "
        "including parastatals like the Nigerian Ports Authority and its subsidiaries \u2014 to adopt "
        "digital technologies in their operations. NDEPS identifies key pillars including:", style_body))
    story.append(bullet_list([
        "<b>Digital Literacy and Skills</b> \u2014 ensuring public servants can operate digital platforms",
        "<b>Solid Infrastructure</b> \u2014 leveraging cloud and internet technologies",
        "<b>Digital Society and Emerging Technologies</b> \u2014 adopting modern solutions for governance",
        "<b>Soft Infrastructure</b> \u2014 digitizing government processes and services",
    ]))
    story.append(Paragraph(
        "This proposal directly serves the NDEPS mandate by digitalizing one of the most critical "
        "functions of any government agency: <b>public procurement</b>.", style_body))

    story.append(Paragraph("2.2  NITDA's Digital Transformation Directive", style_h2))
    story.append(Paragraph(
        "The <b>National Information Technology Development Agency (NITDA)</b>, under the leadership "
        "of its Director General, <b>Malam Kashifu Inuwa Abdullahi, CCIE</b>, has been at the "
        "forefront of driving digital adoption across federal agencies. In his public statements "
        "advocating for digital transformation, the NITDA DG has emphasized:", style_body))
    quote_style = ParagraphStyle('Quote', parent=style_body, leftIndent=20, rightIndent=20,
                                 fontName='Helvetica-Oblique', fontSize=10.5, leading=15,
                                 textColor=NAVY, spaceBefore=4, spaceAfter=4,
                                 borderColor=NAVY, borderWidth=0, borderPadding=8,
                                 backColor=HexColor("#F1F5F9"))
    story.append(Paragraph(
        '"I am aware that [agencies] are working on how to use emerging technologies to come up '
        'with new business processes that will improve service delivery."<br/><br/>'
        '\u2014 <b>Malam Kashifu Inuwa Abdullahi, CCIE, Director General, NITDA</b>',
        quote_style))
    story.append(Paragraph(
        "He has further stressed that digital transformation enables agencies to <i>\"create "
        "efficiencies by improving automation of [their] activities, providing accurate auditing "
        "and applying records schedules reliably\"</i> \u2014 a vision that this procurement portal "
        "directly fulfills.", style_body))
    story.append(Paragraph(
        "NITDA has applauded agencies that have adopted paperless operations, describing such "
        "leaders as <i>\"game changers\"</i> who <i>\"think different, and create value.\"</i> "
        "Sea View Properties has the opportunity to position itself as exactly such a trailblazer "
        "within the NPA family.", style_body))

    story.append(Paragraph("2.3  Bureau of Public Procurement (BPP) and E-Procurement", style_h2))
    story.append(Paragraph(
        "The <b>Bureau of Public Procurement (BPP)</b>, the regulatory body overseeing public "
        "procurement in Nigeria under the <b>Public Procurement Act 2007</b>, has consistently "
        "advocated for the transition from manual to electronic procurement (e-procurement). The "
        "BPP has recognized that digitalizing procurement processes is essential for:", style_body))
    story.append(bullet_list([
        "Ensuring <b>transparency and fair competition</b> in the award of government contracts",
        "<b>Reducing procurement costs</b> and eliminating waste",
        "Providing <b>real-time monitoring</b> of procurement activities",
        "Creating <b>verifiable audit trails</b> for every procurement decision",
        "<b>Standardizing</b> procurement processes across all MDAs",
    ]))
    story.append(Paragraph(
        "This portal implements these exact principles, providing a digital procurement framework "
        "that complies with the spirit and letter of the Public Procurement Act.", style_body))

    story.append(Paragraph("2.4  The Tinubu Administration's Digital Economy Agenda", style_h2))
    story.append(Paragraph(
        "The current administration of <b>President Bola Ahmed Tinubu, GCFR</b> has reaffirmed and "
        "accelerated the federal government's commitment to digital transformation as a cornerstone "
        "of economic reform. The administration's digital economy priorities include:", style_body))
    story.append(bullet_list([
        "Modernizing government service delivery through technology",
        "Promoting <b>transparency, accountability, and anti-corruption</b> through digital systems",
        "Leveraging technology to <b>reduce the cost of governance</b>",
        "Building public trust through <b>verifiable, auditable</b> government processes",
    ]))
    story.append(Paragraph(
        "This proposal is a direct contribution to that agenda.", style_body))

    # ════════════════════════════════════════════════════════════════
    # 3. PROBLEM STATEMENT & JUSTIFICATION
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("3.  Problem Statement &amp; Justification"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("3.1  Current Challenges", style_h2))
    story.append(Paragraph(
        "The existing procurement process at Sea View Properties and similar parastatals suffers from:",
        style_body))
    story.append(bullet_list([
        "<b>Manual, paper-based workflows</b> that are slow, error-prone, and difficult to track \u2014 the very <i>\"paper copies that pile up in boxes, storerooms or warehouses\"</i> that NITDA's leadership has warned against",
        "<b>Lack of transparency</b> in contract awards, creating opportunities for corruption and favouritism",
        "<b>No centralized audit trail</b>, making it difficult to investigate disputes or misconduct \u2014 contrary to the <i>\"accurate auditing\"</i> that digital transformation enables",
        "<b>Fragmented communication</b> between contractors, procurement officers, and approval authorities",
        "<b>No real-time reporting</b>, preventing leadership from making data-driven decisions",
        "<b>Difficulty in tracking contractor performance</b> and project completion status",
        "<b>Inefficient payment processes</b> with no digital evidence or accountability",
    ]))
    story.append(Paragraph("3.2  Justification", style_h2))
    story.append(Paragraph(
        "As NITDA's DG has stated, the adoption of digital processes enables organizations to "
        "<i>\"create efficiencies by improving automation of [their] activities, providing accurate "
        "auditing and applying records schedules reliably.\"</i> The digitalization of Sea View "
        "Properties' procurement process is not merely a technology upgrade \u2014 it is a "
        "<b>strategic imperative</b> mandated by national policy and essential for:", style_body))
    story.append(bullet_list([
        "<b>Compliance</b> with NDEPS, NITDA directives, and BPP e-procurement guidelines",
        "<b>Transparency and anti-corruption</b> as demanded by the Federal Government",
        "<b>Operational efficiency</b> and cost reduction",
        "<b>Accountability</b> through immutable, tamper-proof audit trails",
        "<b>Data-driven governance</b> through real-time executive dashboards",
    ]))

    # ════════════════════════════════════════════════════════════════
    # 4. PROPOSED SOLUTION
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("4.  Proposed Solution"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("4.1  Overview", style_h2))
    story.append(Paragraph(
        "The <b>Digital Procurement &amp; Contractor Management Portal</b> is a web-based platform "
        "that digitizes the end-to-end procurement and contractor management lifecycle. It provides "
        "role-based access to all stakeholders and enforces a structured, multi-tier approval workflow "
        "that mirrors existing organizational hierarchies.", style_body))

    story.append(Paragraph("4.2  Technology Stack", style_h2))
    tech_data = [
        [Paragraph("Layer", style_table_header), Paragraph("Technology", style_table_header)],
        [Paragraph("Frontend", style_table_cell_bold), Paragraph("Next.js 15, TypeScript, Tailwind CSS, shadcn/ui", style_table_cell)],
        [Paragraph("Backend / Database", style_table_cell_bold), Paragraph("Supabase (PostgreSQL, Authentication, Storage)", style_table_cell)],
        [Paragraph("Security", style_table_cell_bold), Paragraph("Supabase Row Level Security (RLS), Role-based Access Control", style_table_cell)],
        [Paragraph("PDF Generation", style_table_cell_bold), Paragraph("@react-pdf/renderer for award letters and official documents", style_table_cell)],
        [Paragraph("Real-time Notifications", style_table_cell_bold), Paragraph("Supabase Realtime, Sonner in-app notifications", style_table_cell)],
        [Paragraph("Hosting", style_table_cell_bold), Paragraph("Cloud-based (Vercel / Supabase Cloud)", style_table_cell)],
    ]
    story.append(make_table(tech_data, [45*mm, CONTENT_W - 45*mm]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("4.3  Key Modules", style_h2))

    modules = [
        ("Contractor Registration",
         "Online self-service registration for contractors. Document upload (CAC certificate, tax clearance, "
         "specialized competence certificates). Verification and approval by the MD. Digital contractor profile management."),
        ("Proposal Submission",
         "Contractors submit proposals online with supporting documents. Automatic tracking and unique reference "
         "numbers. Status visibility for contractors at every stage."),
        ("Multi-Tier Approval Workflow",
         "The system enforces a strict, sequential approval chain: Contractor submits \u2192 MD Initial Review \u2192 "
         "Procurement Officer Appraisal \u2192 Head of Procurement Approval \u2192 MD Final Approval \u2192 Contract Awarded. "
         "No stage can be skipped. Each approver can approve, reject, or request modifications."),
        ("Digital Signature &amp; Contract Award",
         "Authorized officers upload digital signatures (PNG). System auto-generates professional PDF award letters "
         "with embedded signatures. Unique contract reference numbers (CON-YYYY-XXXX). Award letters downloadable and archived."),
        ("Project Completion Management",
         "Contractors submit completion reports with evidence. MD verification \u2192 Head of Audit review \u2192 "
         "Forwarding to Accounts for payment processing."),
        ("Audit &amp; Compliance",
         "Immutable audit log \u2014 database triggers prevent UPDATE/DELETE of log entries. Every action is logged "
         "with timestamp, user, and action details. ICT Administrator has read-only access. Internal minutes hidden from contractors."),
        ("Accounts &amp; Payment Processing",
         "Head of Accounts processes payments upon audit approval. Payment evidence upload (receipts, transfer "
         "confirmations). Unique payment reference numbers (PAY-YYYY-XXXX). Contractors track payment status in real-time."),
        ("Executive Dashboard",
         "Real-time analytics and KPIs for leadership. Visual charts: total proposals, active contracts, completed "
         "projects, payments processed. Mobile-responsive design. Role-specific dashboard views."),
        ("Universal Search",
         "Fuzzy search across all entities (contractors, proposals, contracts, payments). Quick access to any record "
         "from any page. Search by name, reference number, status, or date."),
        ("Notifications",
         "Real-time in-app notifications via Supabase Realtime. Users alerted when actions are required. "
         "Notification history and read/unread status."),
    ]

    for title, desc in modules:
        story.append(Paragraph(title, style_h3))
        story.append(Paragraph(desc, style_body))

    # ════════════════════════════════════════════════════════════════
    # 4. USER ROLES & ACCESS CONTROL
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("5.  User Roles &amp; Access Control"))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Access control is enforced at the <b>database level</b> using Supabase Row Level Security (RLS), "
        "ensuring that no user can access data outside their authorized scope \u2014 even through direct "
        "database queries.", style_body))
    story.append(Spacer(1, 4))

    roles_data = [
        [Paragraph("Role", style_table_header), Paragraph("Access Level", style_table_header)],
        [Paragraph("Contractor", style_table_cell_bold),
         Paragraph("Register, submit proposals, upload completions, view payment status", style_table_cell)],
        [Paragraph("Managing Director (MD)", style_table_cell_bold),
         Paragraph("Full access \u2014 initial &amp; final approval, verification", style_table_cell)],
        [Paragraph("Procurement Officer", style_table_cell_bold),
         Paragraph("Appraise proposals, forward to Head of Procurement", style_table_cell)],
        [Paragraph("Head of Procurement", style_table_cell_bold),
         Paragraph("Review appraisals, approve/reject, forward to MD", style_table_cell)],
        [Paragraph("Head of Audit", style_table_cell_bold),
         Paragraph("Review completions, approve, forward to Accounts", style_table_cell)],
        [Paragraph("Head of Accounts", style_table_cell_bold),
         Paragraph("Process payments, upload payment evidence", style_table_cell)],
        [Paragraph("ICT Administrator", style_table_cell_bold),
         Paragraph("User management, audit logs, system settings (cannot participate in approvals)", style_table_cell)],
    ]
    story.append(make_table(roles_data, [50*mm, CONTENT_W - 50*mm]))

    # ════════════════════════════════════════════════════════════════
    # 5. SECURITY & COMPLIANCE
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("6.  Security &amp; Compliance"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("6.1  Data Security", style_h2))
    story.append(bullet_list([
        "<b>Row Level Security (RLS)</b> policies on every table",
        "Role-based access control enforced at database and application layers",
        "Secure file storage with bucket-level policies",
        "Environment-protected service keys",
    ]))

    story.append(Paragraph("6.2  Audit &amp; Accountability", style_h2))
    story.append(bullet_list([
        "<b>Immutable audit log</b> \u2014 tamper-proof by design (database triggers prevent modification)",
        "Complete action history for every record",
        "User activity tracking (login times, actions performed)",
        "ICT Administrator oversight without procurement interference",
    ]))

    story.append(Paragraph("6.3  Data Integrity", style_h2))
    story.append(bullet_list([
        "PostgreSQL relational database with foreign key constraints",
        "Enumerated types for statuses (prevents invalid states)",
        "Automatic timestamping on all records",
        "Unique reference number generation for contracts and payments",
    ]))

    # ════════════════════════════════════════════════════════════════
    # 6. BENEFITS & VALUE PROPOSITION
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("7.  Benefits &amp; Value Proposition"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("7.1  For the Federal Government", style_h2))
    story.append(bullet_list([
        "<b>Transparency:</b> Every procurement action is logged, traceable, and auditable",
        "<b>Anti-Corruption:</b> Multi-tier approvals with no bypass capability; immutable audit trail",
        "<b>Efficiency:</b> Digital workflows reduce processing time from weeks to days",
        "<b>Data-Driven Governance:</b> Real-time dashboards for monitoring and reporting",
        "<b>Alignment with NDEPS and NITDA Directives:</b> Directly fulfills the national digitalization mandate as articulated by NITDA's leadership",
    ]))

    story.append(Paragraph("7.2  For Sea View Properties / NPA", style_h2))
    story.append(bullet_list([
        "<b>Cost Savings:</b> Eliminates paper, printing, and manual processing costs",
        "<b>Reduced Processing Time:</b> Parallel and tracked workflows",
        "<b>Improved Contractor Relationships:</b> Transparency and self-service portal",
        "<b>Risk Mitigation:</b> Complete audit trail for investigations and compliance",
        "<b>Scalability:</b> System can be extended to other NPA subsidiaries",
    ]))

    story.append(Paragraph("7.3  For Contractors", style_h2))
    story.append(bullet_list([
        "<b>Convenience:</b> Online registration, proposal submission, and status tracking",
        "<b>Transparency:</b> Real-time visibility into proposal and payment status",
        "<b>Fairness:</b> Standardized process with no human interference in workflow",
    ]))

    # ════════════════════════════════════════════════════════════════
    # 7. PROJECT IMPLEMENTATION PLAN
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("8.  Project Implementation Plan"))
    story.append(Spacer(1, 6))

    impl_data = [
        [Paragraph("Phase", style_table_header), Paragraph("Timeline", style_table_header), Paragraph("Activities", style_table_header)],
        [Paragraph("Phase 1: Deployment &amp; Configuration", style_table_cell_bold),
         Paragraph("Weeks 1\u20132", style_table_cell),
         Paragraph("Deploy portal to production, configure Supabase, set up user accounts, migrate existing data", style_table_cell)],
        [Paragraph("Phase 2: User Training &amp; Onboarding", style_table_cell_bold),
         Paragraph("Weeks 2\u20133", style_table_cell),
         Paragraph("Train all staff roles, train ICT Administrator, provide contractor onboarding guide", style_table_cell)],
        [Paragraph("Phase 3: Go-Live &amp; Support", style_table_cell_bold),
         Paragraph("Week 4", style_table_cell),
         Paragraph("Official launch, migration from manual to digital, dedicated support", style_table_cell)],
        [Paragraph("Phase 4: Enhancement &amp; Scaling", style_table_cell_bold),
         Paragraph("Ongoing", style_table_cell),
         Paragraph("Collect feedback, add features, scale to additional NPA subsidiaries", style_table_cell)],
    ]
    story.append(make_table(impl_data, [50*mm, 25*mm, CONTENT_W - 75*mm]))

    # ════════════════════════════════════════════════════════════════
    # 8. TECHNICAL ARCHITECTURE
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("9.  Technical Architecture"))
    story.append(Spacer(1, 6))

    arch_text = (
        "+---------------------------------------------------+\n"
        "|                  Web Browser                       |\n"
        "|         (Contractors, Staff, Leadership)           |\n"
        "+--------------------------+------------------------+\n"
        "                           | HTTPS\n"
        "+--------------------------v------------------------+\n"
        "|           Next.js 15 Application                   |\n"
        "|   (SSR + Client-side, Role-based Routing)         |\n"
        "|   Tailwind CSS + shadcn/ui Components             |\n"
        "+--------------------------+------------------------+\n"
        "                           |\n"
        "+--------------------------v------------------------+\n"
        "|              Supabase Backend                      |\n"
        "|  +----------+  +----------+  +--------------+     |\n"
        "|  |PostgreSQL|  |   Auth   |  |   Storage    |     |\n"
        "|  |  + RLS   |  |  (JWT)   |  | (Documents)  |     |\n"
        "|  +----------+  +----------+  +--------------+     |\n"
        "|  +--------------------------------------------+   |\n"
        "|  |         Realtime (Notifications)           |   |\n"
        "|  +--------------------------------------------+   |\n"
        "+---------------------------------------------------+"
    )
    story.append(Paragraph(arch_text.replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>'), style_code))

    # ════════════════════════════════════════════════════════════════
    # 9. SYSTEM REQUIREMENTS
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("10.  System Requirements"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("10.1  User Requirements", style_h2))
    story.append(bullet_list([
        "Modern web browser (Chrome, Firefox, Safari, Edge)",
        "Internet connection",
        "No software installation required (web-based)",
    ]))

    story.append(Paragraph("10.2  Infrastructure Requirements", style_h2))
    story.append(bullet_list([
        "Supabase account (Cloud or self-hosted)",
        "Vercel account for application hosting (or equivalent Node.js hosting)",
        "Domain name and SSL certificate",
        "Supabase environment variables (URL, Anon Key, Service Role Key)",
    ]))

    # ════════════════════════════════════════════════════════════════
    # 10. COST CONSIDERATIONS
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("11.  Cost Considerations"))
    story.append(Spacer(1, 6))

    cost_data = [
        [Paragraph("Item", style_table_header), Paragraph("Description", style_table_header), Paragraph("Estimated Cost", style_table_header)],
        [Paragraph("Supabase", style_table_cell_bold),
         Paragraph("Database, Auth, Storage, Realtime", style_table_cell),
         Paragraph("Free tier / Pro ~$25/mo", style_table_cell)],
        [Paragraph("Vercel Hosting", style_table_cell_bold),
         Paragraph("Application hosting", style_table_cell),
         Paragraph("Free tier / Pro ~$20/mo", style_table_cell)],
        [Paragraph("Domain Name", style_table_cell_bold),
         Paragraph("Custom domain (e.g., procurement.seaview.npa.gov.ng)", style_table_cell),
         Paragraph("~$15/year", style_table_cell)],
        [Paragraph("SSL Certificate", style_table_cell_bold),
         Paragraph("Included with Vercel/Supabase", style_table_cell),
         Paragraph("Free", style_table_cell)],
        [Paragraph("Development", style_table_cell_bold),
         Paragraph("One-time development cost", style_table_cell),
         Paragraph("[To be quoted]", style_table_cell)],
        [Paragraph("Training", style_table_cell_bold),
         Paragraph("User training and onboarding", style_table_cell),
         Paragraph("[To be quoted]", style_table_cell)],
        [Paragraph("Maintenance", style_table_cell_bold),
         Paragraph("Monthly support and updates (optional)", style_table_cell),
         Paragraph("[To be quoted]", style_table_cell)],
    ]
    story.append(make_table(cost_data, [35*mm, 75*mm, CONTENT_W - 110*mm]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Note: The system uses open-source technologies, keeping licensing costs at zero. "
        "Ongoing costs are limited to cloud hosting and optional maintenance.",
        style_note))

    # ════════════════════════════════════════════════════════════════
    # 11. WHY THIS SOLUTION
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("12.  Why This Solution"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("12.1  Built for Nigerian Government Context", style_h2))
    story.append(bullet_list([
        "Designed specifically for the NPA / Sea View Properties organizational structure",
        "Approval workflow mirrors existing hierarchical processes",
        "Role definitions match actual staff designations",
    ]))

    story.append(Paragraph("12.2  Enterprise-Grade Yet Affordable", style_h2))
    story.append(bullet_list([
        "Uses open-source technologies (zero licensing fees)",
        "Cloud-hosted (no server hardware required)",
        "Scales from dozens to thousands of users",
    ]))

    story.append(Paragraph("12.3  Secure by Design", style_h2))
    story.append(bullet_list([
        "Database-level security (RLS) \u2014 not just application-level",
        "Immutable audit log \u2014 tamper-proof",
        "Role separation (ICT Admin cannot interfere with procurement)",
    ]))

    story.append(Paragraph("12.4  Rapidly Deployable", style_h2))
    story.append(bullet_list([
        "System is already developed and tested",
        "Can be deployed within 2\u20134 weeks",
        "Minimal infrastructure setup required",
    ]))

    # ════════════════════════════════════════════════════════════════
    # 12. CONCLUSION
    # ════════════════════════════════════════════════════════════════
    story.append(section_divider("13.  Conclusion"))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "The Digital Procurement &amp; Contractor Management Portal represents a transformative step "
        "for Sea View Properties and the Nigerian Ports Authority in fulfilling the Federal Government's "
        "digitalization mandate as articulated through NDEPS, NITDA directives, and BPP e-procurement "
        "guidelines. By replacing manual processes with a secure, transparent, and auditable "
        "digital system, the organization will achieve:", style_body))
    story.append(bullet_list([
        "<b>Full transparency</b> in all procurement activities",
        "<b>Accountability</b> through immutable audit trails",
        "<b>Efficiency</b> through automated workflows",
        "<b>Cost savings</b> through elimination of paper-based processes",
        "<b>Data-driven decision making</b> through real-time dashboards",
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "We are confident that this solution will serve as a <b>model for digitalization across all NPA "
        "subsidiaries</b> and potentially other federal parastatals. We welcome the opportunity to present "
        "this proposal in detail and demonstrate the working system.", style_body))

    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))
    story.append(Paragraph("Contact Information", style_h3))
    contact_data = [
        [Paragraph("Name:", style_table_cell_bold), Paragraph("[Your Name]", style_table_cell)],
        [Paragraph("Title:", style_table_cell_bold), Paragraph("[Your Title]", style_table_cell)],
        [Paragraph("Organization:", style_table_cell_bold), Paragraph("[Your Organization]", style_table_cell)],
        [Paragraph("Email:", style_table_cell_bold), Paragraph("[Your Email]", style_table_cell)],
        [Paragraph("Phone:", style_table_cell_bold), Paragraph("[Your Phone Number]", style_table_cell)],
    ]
    contact_table = Table(contact_data, colWidths=[35*mm, CONTENT_W - 35*mm])
    contact_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(contact_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<i>This proposal is submitted in response to the Federal Government of Nigeria's "
        "directive on the digitalization of parastatal operations, in alignment with the National "
        "Digital Economy Policy and Strategy (NDEPS), NITDA's digital transformation mandate, and "
        "the Bureau of Public Procurement's e-procurement framework.</i>",
        ParagraphStyle('Footer', parent=style_small, alignment=TA_CENTER,
                       textColor=SLATE, fontSize=8.5)))

    # Build
    doc.build(story)
    print(f"\u2705  PDF saved \u2192 {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
