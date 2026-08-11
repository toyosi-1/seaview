from PIL import Image, ImageDraw, ImageFont
import os

# Canvas size (16:9 at 1280x720)
W, H = 1280, 800
OUT = "/Users/kingtoy/Documents/Procurement & Contractor Management Portal/CascadeProjects/windsurf-project/screenshots"
os.makedirs(OUT, exist_ok=True)

# ── Colour palette ──────────────────────────────────────────────
NAVY      = (30, 58, 138)
BLUE      = (37, 99, 235)
LIGHT_BG  = (248, 250, 255)
WHITE     = (255, 255, 255)
SLATE     = (71, 85, 105)
SLATE_L   = (148, 163, 184)
DARK      = (15, 23, 42)
GREEN     = (22, 163, 74)
GREEN_L   = (220, 252, 231)
AMBER     = (217, 119, 6)
AMBER_L   = (254, 243, 199)
RED       = (220, 38, 38)
RED_L     = (254, 226, 226)
PURPLE    = (124, 58, 237)
PURPLE_L  = (237, 233, 254)
BORDER    = (226, 232, 240)
SIDEBAR   = (15, 23, 42)
CARD_BG   = (255, 255, 255)
TEAL      = (13, 148, 136)

def font(size, bold=False):
    try:
        path = "/System/Library/Fonts/Helvetica.ttc"
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill,
                            outline=outline, width=width)

def draw_sidebar(draw, active="Dashboard"):
    draw.rectangle([0, 0, 220, H], fill=SIDEBAR)
    # Logo area
    draw.rectangle([0, 0, 220, 64], fill=(20, 35, 80))
    draw.text((16, 14), "SVP", fill=WHITE, font=font(22, bold=True))
    draw.text((52, 18), "Sea View", fill=(147, 197, 253), font=font(13, bold=True))
    draw.text((52, 34), "Properties", fill=(147, 197, 253), font=font(11))

    items = [
        ("Dashboard", "◉"),
        ("Contractors", "🏢"),
        ("Proposals", "📋"),
        ("Contracts", "📄"),
        ("Completions", "✅"),
        ("Payments", "💳"),
        ("Notifications", "🔔"),
        ("Audit Log", "🛡"),
        ("Users", "👥"),
    ]
    for i, (name, icon) in enumerate(items):
        y = 80 + i * 52
        if name == active:
            draw.rounded_rectangle([8, y, 212, y+40], radius=8, fill=BLUE)
            draw.text((18, y+10), icon, fill=WHITE, font=font(14))
            draw.text((42, y+11), name, fill=WHITE, font=font(13, bold=True))
        else:
            draw.text((18, y+10), icon, fill=(148, 163, 184), font=font(14))
            draw.text((42, y+11), name, fill=(148, 163, 184), font=font(13))

    # User chip at bottom
    draw.rounded_rectangle([10, H-60, 210, H-14], radius=8, fill=(30, 41, 59))
    draw.ellipse([18, H-52, 44, H-22], fill=BLUE)
    draw.text((24, H-44), "MD", fill=WHITE, font=font(11, bold=True))
    draw.text((52, H-51), "Alhaji Musa Bello", fill=WHITE, font=font(11, bold=True))
    draw.text((52, H-36), "Managing Director", fill=(148, 163, 184), font=font(10))

def draw_topbar(draw, title=""):
    draw.rectangle([220, 0, W, 56], fill=WHITE)
    draw.line([220, 56, W, 56], fill=BORDER, width=1)
    if title:
        draw.text((240, 16), title, fill=DARK, font=font(18, bold=True))
    # Search bar
    draw.rounded_rectangle([W-440, 12, W-180, 44], radius=6,
                            fill=(248, 250, 252), outline=BORDER, width=1)
    draw.text((W-430, 20), "🔍  Search contractors, proposals...", fill=SLATE_L, font=font(12))
    # Bell
    draw.ellipse([W-150, 14, W-118, 42], fill=(239, 246, 255))
    draw.text((W-144, 19), "🔔", fill=NAVY, font=font(16))
    # Avatar
    draw.ellipse([W-100, 12, W-68, 44], fill=BLUE)
    draw.text((W-92, 20), "MB", fill=WHITE, font=font(12, bold=True))

def stat_card(draw, x, y, w, h, label_text, value, sub, color, icon):
    draw_rounded_rect(draw, [x, y, x+w, y+h], 10, CARD_BG, BORDER, 1)
    # left accent
    draw.rounded_rectangle([x, y, x+5, y+h], radius=3, fill=color)
    # Icon circle
    draw.ellipse([x+16, y+16, x+52, y+52], fill=color + (30,) if len(color)==3 else color)
    cx, cy = x+34, y+34
    # just draw a coloured circle for icon bg
    img_tmp = Image.new("RGBA", (w, h), (0,0,0,0))
    dt = ImageDraw.Draw(img_tmp)
    dt.ellipse([16, 16, 52, 52], fill=(*color, 40))
    dt.text((26, 24), icon, fill=color, font=font(18))
    # blend
    draw.text((x+26, y+24), icon, fill=color, font=font(18))
    draw.text((x+62, y+14), label_text, fill=SLATE, font=font(11))
    draw.text((x+62, y+34), value, fill=DARK, font=font(22, bold=True))
    draw.text((x+62, y+62), sub, fill=SLATE_L, font=font(10))


# ════════════════════════════════════════════════════════════════
# IMAGE 1 — EXECUTIVE DASHBOARD
# ════════════════════════════════════════════════════════════════
img = Image.new("RGB", (W, H), LIGHT_BG)
d = ImageDraw.Draw(img)
draw_sidebar(d, "Dashboard")
draw_topbar(d, "Executive Dashboard")

# Welcome banner
d.rounded_rectangle([230, 68, W-10, 130], radius=10, fill=NAVY)
d.text((248, 78), "Good morning, Alhaji Musa Bello 👋", fill=WHITE, font=font(15, bold=True))
d.text((248, 100), "Here's what's happening across the procurement pipeline today.", fill=(186, 213, 253), font=font(11))

# Stat cards row 1
stats = [
    ("Total Contractors", "48", "+3 this week", BLUE, "🏢"),
    ("Active Proposals", "12", "7 pending review", PURPLE, "📋"),
    ("Contracts Awarded", "31", "₦2.4B total value", GREEN, "📄"),
    ("Payments Pending", "5", "Requires approval", AMBER, "💳"),
]
card_w = 238
for i, (lbl, val, sub, col, icon) in enumerate(stats):
    sx = 232 + i * (card_w + 10)
    stat_card(d, sx, 140, card_w, 90, lbl, val, sub, col, icon)

# Recent activity table
d.rounded_rectangle([232, 244, W-10, 560], radius=10, fill=WHITE, outline=BORDER, width=1)
d.text((252, 258), "Recent Proposals", fill=DARK, font=font(14, bold=True))
d.rounded_rectangle([W-180, 252, W-22, 278], radius=6, fill=(239, 246, 255))
d.text((W-166, 258), "View All →", fill=BLUE, font=font(11))

# Table header
d.rectangle([232, 286, W-10, 312], fill=(248, 250, 252))
for col_x, col_txt in [(248,"Proposal #"), (420,"Title"), (660,"Contractor"), (860,"Status"), (1020,"Date")]:
    d.text((col_x, 294), col_txt, fill=SLATE, font=font(10, bold=True))

rows = [
    ("PRO-2024-0041", "Jetty Rehabilitation Phase 3",    "Brightline Eng. Ltd",   "md_review",    "Jun 08"),
    ("PRO-2024-0040", "Admin Block Renovation",          "Crestview Contractors", "approved",     "Jun 07"),
    ("PRO-2024-0039", "Road Resurfacing - Gate 4",       "Afriglobal Works",      "procurement",  "Jun 05"),
    ("PRO-2024-0038", "Security Camera Installation",    "TechShield Nigeria",    "approved",     "Jun 03"),
    ("PRO-2024-0037", "Warehouse Expansion - Block C",   "Delta Build Co.",       "rejected",     "Jun 01"),
]
status_cfg = {
    "md_review":    ("MD Review",    AMBER,   AMBER_L),
    "approved":     ("Approved",     GREEN,   GREEN_L),
    "procurement":  ("Procurement",  PURPLE,  PURPLE_L),
    "rejected":     ("Rejected",     RED,     RED_L),
}
for i, (num, title, contractor, status, date) in enumerate(rows):
    ry = 318 + i * 44
    if i % 2 == 0:
        d.rectangle([233, ry, W-11, ry+42], fill=(252, 253, 255))
    d.text((248, ry+13), num,        fill=BLUE,  font=font(10))
    d.text((420, ry+13), title[:28], fill=DARK,  font=font(10))
    d.text((660, ry+13), contractor, fill=SLATE, font=font(10))
    sc, sf, sbg = status_cfg[status]
    d.rounded_rectangle([858, ry+8, 858+90, ry+34], radius=10, fill=sbg)
    d.text((868, ry+14), sc, fill=sf, font=font(9, bold=True))
    d.text((1020, ry+13), date, fill=SLATE_L, font=font(10))

# Mini stats bottom
for i, (lbl, val, col) in enumerate([
    ("Completion Reports", "8", TEAL),
    ("Audit Pending", "3", PURPLE),
    ("Contractors Suspended", "2", RED),
]):
    bx = 232 + i * 340
    d.rounded_rectangle([bx, 572, bx+320, 634], radius=10, fill=WHITE, outline=BORDER, width=1)
    d.rounded_rectangle([bx, 572, bx+5, 634], radius=3, fill=col)
    d.text((bx+20, 585), lbl, fill=SLATE, font=font(11))
    d.text((bx+20, 606), val, fill=DARK, font=font(20, bold=True))

img.save(f"{OUT}/01_dashboard.png")
print("✅ Dashboard saved")


# ════════════════════════════════════════════════════════════════
# IMAGE 2 — CONTRACTORS LIST
# ════════════════════════════════════════════════════════════════
img2 = Image.new("RGB", (W, H), LIGHT_BG)
d2 = ImageDraw.Draw(img2)
draw_sidebar(d2, "Contractors")
draw_topbar(d2, "Contractors")

# Page header
d2.text((240, 68), "Registered Contractors", fill=DARK, font=font(20, bold=True))
d2.text((240, 94), "All companies registered in the procurement system", fill=SLATE, font=font(11))

# Stats
for i, (lbl, val, col) in enumerate([
    ("Total", "48", BLUE), ("Active", "39", GREEN), ("Pending", "7", AMBER), ("Suspended", "2", RED)
]):
    px = 240 + i*230
    d2.rounded_rectangle([px, 116, px+210, 158], radius=8, fill=WHITE, outline=BORDER, width=1)
    d2.rounded_rectangle([px, 116, px+5, 158], radius=3, fill=col)
    d2.text((px+18, 125), lbl, fill=SLATE, font=font(10))
    d2.text((px+18, 138), val, fill=DARK, font=font(18, bold=True))

# Contractor cards
contractors = [
    ("Brightline Engineering Ltd",  "CAC: RC-204871", "brightline@mail.com",  "+234 803 111 2233", "Active",   GREEN,  GREEN_L),
    ("Crestview Contractors",       "CAC: RC-119034", "crestview@mail.com",   "+234 706 444 5566", "Active",   GREEN,  GREEN_L),
    ("Afriglobal Works Ltd",        "CAC: RC-330782", "afriglobal@mail.com",  "+234 812 777 8899", "Pending",  AMBER,  AMBER_L),
    ("TechShield Nigeria",          "CAC: RC-445901", "techshield@mail.com",  "+234 901 222 3344", "Active",   GREEN,  GREEN_L),
    ("Delta Build Co.",             "CAC: RC-558123", "deltabuild@mail.com",  "+234 805 555 6677", "Suspended",RED,    RED_L),
    ("Horizon Construction",        "CAC: RC-662904", "horizon@mail.com",     "+234 703 888 9900", "Active",   GREEN,  GREEN_L),
]
cols_c = 2
cw, ch = 490, 96
for i, (name, cac, email, phone, status, scol, sbg) in enumerate(contractors):
    row, col = i // cols_c, i % cols_c
    cx = 232 + col * (cw + 18)
    cy = 172 + row * (ch + 12)
    d2.rounded_rectangle([cx, cy, cx+cw, cy+ch], radius=10, fill=WHITE, outline=BORDER, width=1)
    # Avatar
    d2.ellipse([cx+14, cy+16, cx+60, cy+62], fill=BLUE)
    d2.text((cx+26, cy+28), name[0], fill=WHITE, font=font(22, bold=True))
    # Info
    d2.text((cx+76, cy+12), name, fill=DARK, font=font(13, bold=True))
    d2.text((cx+76, cy+32), cac,  fill=SLATE, font=font(10))
    d2.text((cx+76, cy+50), email, fill=SLATE, font=font(10))
    d2.text((cx+76, cy+68), phone, fill=SLATE_L, font=font(10))
    # Status badge
    sw = 80
    d2.rounded_rectangle([cx+cw-sw-10, cy+14, cx+cw-10, cy+38], radius=10, fill=sbg)
    d2.text((cx+cw-sw-2, cy+20), status, fill=scol, font=font(9, bold=True))
    # Arrow
    d2.text((cx+cw-28, cy+ch//2-8), "›", fill=SLATE_L, font=font(20))

img2.save(f"{OUT}/02_contractors.png")
print("✅ Contractors saved")


# ════════════════════════════════════════════════════════════════
# IMAGE 3 — CONTRACTOR PROFILE (DETAIL)
# ════════════════════════════════════════════════════════════════
img3 = Image.new("RGB", (W, H), LIGHT_BG)
d3 = ImageDraw.Draw(img3)
draw_sidebar(d3, "Contractors")
draw_topbar(d3)

# Back + title
d3.text((232, 64), "← Back", fill=BLUE, font=font(11))
d3.rounded_rectangle([232, 82, W-10, 160], radius=12, fill=WHITE, outline=BORDER, width=1)
d3.ellipse([250, 94, 320, 148], fill=BLUE)
d3.text((268, 108), "BEL", fill=WHITE, font=font(22, bold=True))
d3.text((336, 92), "Brightline Engineering Ltd", fill=DARK, font=font(18, bold=True))
d3.rounded_rectangle([336, 118, 420, 140], radius=10, fill=GREEN_L)
d3.text((348, 124), "Active", fill=GREEN, font=font(10, bold=True))
d3.text((432, 124), "Registered: Jan 15, 2024", fill=SLATE_L, font=font(10))
# Action buttons
d3.rounded_rectangle([W-220, 100, W-128, 132], radius=6, fill=RED_L, outline=RED, width=1)
d3.text((W-210, 110), "Suspend Account", fill=RED, font=font(10, bold=True))

# Two column cards
# Left — Company Info
d3.rounded_rectangle([232, 172, 620, 520], radius=10, fill=WHITE, outline=BORDER, width=1)
d3.text((252, 184), "Company Information", fill=DARK, font=font(13, bold=True))
d3.line([252, 204, 600, 204], fill=BORDER, width=1)
fields = [
    ("CAC Reg. Number", "RC-204871"),
    ("TIN Number",      "12345678-0001"),
    ("Phone",           "+234 803 111 2233"),
    ("Email",           "brightline@mail.com"),
    ("Address",         "14 Apapa Rd, Lagos Island"),
    ("Contact Person",  "Engr. Samuel Okeke"),
]
for i, (lbl, val) in enumerate(fields):
    fy = 216 + i * 48
    d3.text((252, fy),    lbl, fill=SLATE, font=font(10))
    d3.text((252, fy+18), val, fill=DARK,  font=font(12, bold=True))

# Right — Banking Details
d3.rounded_rectangle([634, 172, W-10, 340], radius=10, fill=WHITE, outline=BORDER, width=1)
d3.text((654, 184), "Banking Details", fill=DARK, font=font(13, bold=True))
d3.line([654, 204, W-22, 204], fill=BORDER, width=1)
bank_fields = [
    ("Bank Name",    "First Bank of Nigeria"),
    ("Account No.",  "3012345678"),
    ("Account Name", "Brightline Engineering Ltd"),
]
for i, (lbl, val) in enumerate(bank_fields):
    by = 216 + i * 40
    d3.text((654, by),    lbl, fill=SLATE, font=font(10))
    d3.text((654, by+18), val, fill=DARK,  font=font(12, bold=True))

# Documents
d3.rounded_rectangle([634, 352, W-10, 520], radius=10, fill=WHITE, outline=BORDER, width=1)
d3.text((654, 364), "Documents", fill=DARK, font=font(13, bold=True))
d3.line([654, 384, W-22, 384], fill=BORDER, width=1)
docs = ["CAC Certificate", "Form CO2", "TIN Certificate"]
for i, doc in enumerate(docs):
    dy = 396 + i * 38
    d3.rounded_rectangle([654, dy, W-22, dy+30], radius=6,
                          fill=(239, 246, 255), outline=(191, 219, 254), width=1)
    d3.text((668, dy+8), "📄 " + doc, fill=NAVY, font=font(11))
    d3.text((W-80, dy+8), "View ↗", fill=BLUE, font=font(10))

img3.save(f"{OUT}/03_contractor_profile.png")
print("✅ Contractor profile saved")


# ════════════════════════════════════════════════════════════════
# IMAGE 4 — PROPOSAL DETAIL + APPROVAL WORKFLOW
# ════════════════════════════════════════════════════════════════
img4 = Image.new("RGB", (W, H), LIGHT_BG)
d4 = ImageDraw.Draw(img4)
draw_sidebar(d4, "Proposals")
draw_topbar(d4)

d4.text((232, 64), "← Back to Proposals", fill=BLUE, font=font(11))

# Header card
d4.rounded_rectangle([232, 82, W-10, 148], radius=10, fill=WHITE, outline=BORDER, width=1)
d4.text((252, 92),  "PRO-2024-0041", fill=BLUE, font=font(11))
d4.text((252, 108), "Jetty Rehabilitation Phase 3", fill=DARK, font=font(17, bold=True))
d4.rounded_rectangle([252, 128, 340, 142], radius=8, fill=AMBER_L)
d4.text((262, 130), "MD Review", fill=AMBER, font=font(9, bold=True))
d4.text((356, 130), "Submitted: Jun 8, 2024  ·  Brightline Engineering Ltd", fill=SLATE_L, font=font(10))

# Left column — proposal details
d4.rounded_rectangle([232, 156, 760, 400], radius=10, fill=WHITE, outline=BORDER, width=1)
d4.text((252, 168), "Proposal Details", fill=DARK, font=font(13, bold=True))
d4.line([252, 188, 740, 188], fill=BORDER, width=1)
d4.text((252, 200), "Description", fill=SLATE, font=font(10))
d4.text((252, 218), "Complete rehabilitation of Jetty 4 including structural repairs,", fill=DARK, font=font(11))
d4.text((252, 234), "re-decking, fender replacement, and navigational aids installation.", fill=DARK, font=font(11))
d4.text((252, 262), "Estimated Cost", fill=SLATE, font=font(10))
d4.text((252, 280), "₦ 148,500,000.00", fill=NAVY, font=font(18, bold=True))
d4.text((252, 312), "Submitted By", fill=SLATE, font=font(10))
d4.text((252, 328), "Brightline Engineering Ltd  ·  Engr. Samuel Okeke", fill=DARK, font=font(11))
# Documents
d4.text((252, 358), "Attached Documents", fill=SLATE, font=font(10))
for i, doc in enumerate(["Proposal Document.pdf", "Bill of Quantities.xlsx"]):
    dx = 252 + i * 240
    d4.rounded_rectangle([dx, 374, dx+224, 394], radius=6, fill=(239,246,255), outline=(191,219,254), width=1)
    d4.text((dx+8, 380), "📄 " + doc, fill=NAVY, font=font(9))

# Right column — Workflow Timeline
d4.rounded_rectangle([772, 156, W-10, 400], radius=10, fill=WHITE, outline=BORDER, width=1)
d4.text((792, 168), "Approval Workflow", fill=DARK, font=font(13, bold=True))
d4.line([792, 188, W-22, 188], fill=BORDER, width=1)

stages = [
    ("Submitted",         "Jun 8, 2024",  GREEN,  True,  "Engr. Samuel Okeke"),
    ("MD Initial Review", "Pending",      AMBER,  True,  "In Progress"),
    ("Procurement Review","—",            SLATE_L,False, "Awaiting"),
    ("Head of Procurement","—",           SLATE_L,False, "Awaiting"),
    ("MD Final Approval", "—",            SLATE_L,False, "Awaiting"),
]
for i, (stage, date, col, done, actor) in enumerate(stages):
    sy = 200 + i * 38
    # Connector line
    if i < len(stages) - 1:
        d4.line([812, sy+20, 812, sy+38], fill=BORDER, width=2)
    # Circle
    if done:
        d4.ellipse([802, sy+2, 824, sy+24], fill=col)
        d4.text((809, sy+7), "✓" if col==GREEN else "→", fill=WHITE, font=font(10, bold=True))
    else:
        d4.ellipse([802, sy+2, 824, sy+24], fill=WHITE, outline=BORDER, width=2)
    d4.text((836, sy+4),  stage, fill=DARK if done else SLATE_L, font=font(11, bold=True if done else False))
    d4.text((836, sy+18), f"{actor}  ·  {date}", fill=SLATE_L, font=font(9))

# Approval Panel
d4.rounded_rectangle([232, 412, W-10, 680], radius=10, fill=WHITE, outline=BORDER, width=1)
d4.text((252, 424), "Take Action — MD Initial Review", fill=DARK, font=font(13, bold=True))
d4.line([252, 444, W-22, 444], fill=BORDER, width=1)
d4.text((252, 456), "Comments / Minutes (internal only)", fill=SLATE, font=font(10))
d4.rounded_rectangle([252, 474, W-22, 546], radius=6, fill=(248,250,252), outline=BORDER, width=1)
d4.text((266, 490), "Enter your comments or minutes here...", fill=SLATE_L, font=font(11))
# Action buttons
btn_data = [
    ("✓  Forward to Procurement", GREEN,  WHITE, 252),
    ("↩  Return for Clarification", AMBER, WHITE, 500),
    ("✗  Reject Proposal",         RED,   WHITE, 748),
]
for label_t, bg_col, fg_col, bx in btn_data:
    d4.rounded_rectangle([bx, 556, bx+230, 594], radius=8, fill=bg_col)
    d4.text((bx+16, 566), label_t, fill=fg_col, font=font(11, bold=True))

img4.save(f"{OUT}/04_proposal_workflow.png")
print("✅ Proposal workflow saved")


# ════════════════════════════════════════════════════════════════
# IMAGE 5 — PAYMENTS PAGE
# ════════════════════════════════════════════════════════════════
img5 = Image.new("RGB", (W, H), LIGHT_BG)
d5 = ImageDraw.Draw(img5)
draw_sidebar(d5, "Payments")
draw_topbar(d5, "Payments")

d5.text((240, 68), "Payment Management", fill=DARK, font=font(20, bold=True))
d5.text((240, 94), "Review and process contractor payments", fill=SLATE, font=font(11))

# Stats
for i, (lbl, val, col) in enumerate([
    ("Total Payments", "18", BLUE), ("Completed", "11", GREEN),
    ("Pending Approval", "5", AMBER), ("On Hold", "2", RED)
]):
    px = 240 + i*245
    d5.rounded_rectangle([px, 116, px+228, 160], radius=8, fill=WHITE, outline=BORDER, width=1)
    d5.rounded_rectangle([px, 116, px+5, 160], radius=3, fill=col)
    d5.text((px+18, 124), lbl, fill=SLATE, font=font(10))
    d5.text((px+18, 140), val, fill=DARK, font=font(20, bold=True))

# Payment table
d5.rounded_rectangle([232, 174, W-10, 700], radius=10, fill=WHITE, outline=BORDER, width=1)
d5.rectangle([232, 196, W-10, 224], fill=(248,250,252))
for col_x, col_txt in [(248,"Payment #"),(380,"Contract"),(580,"Contractor"),(780,"Amount"),(930,"Status"),(1080,"Date")]:
    d5.text((col_x, 204), col_txt, fill=SLATE, font=font(10, bold=True))

payments = [
    ("PAY-2024-011", "Jetty Rehab Ph.2",       "Brightline Eng.",   "₦ 42,800,000", "Completed", GREEN,  GREEN_L,  "Jun 1"),
    ("PAY-2024-012", "Road Resurfacing Gt.1",  "Afriglobal Works",  "₦ 18,500,000", "Pending",   AMBER,  AMBER_L,  "Jun 5"),
    ("PAY-2024-013", "Security Upgrade",       "TechShield Nig.",   "₦ 9,200,000",  "Pending",   AMBER,  AMBER_L,  "Jun 6"),
    ("PAY-2024-014", "Admin Block Renovation", "Crestview Contr.",  "₦ 31,750,000", "Completed", GREEN,  GREEN_L,  "Jun 7"),
    ("PAY-2024-015", "Warehouse Expansion",    "Delta Build Co.",   "₦ 55,000,000", "On Hold",   RED,    RED_L,    "Jun 8"),
    ("PAY-2024-016", "Gate Barrier Install.",  "Horizon Const.",    "₦ 7,400,000",  "Pending",   AMBER,  AMBER_L,  "Jun 8"),
]
for i, (num, contract, contractor, amount, status, sc, sbg, date) in enumerate(payments):
    ry = 230 + i*72
    if i % 2 == 0:
        d5.rectangle([233, ry, W-11, ry+70], fill=(252,253,255))
    d5.text((248,  ry+16), num,        fill=BLUE,  font=font(10))
    d5.text((380,  ry+16), contract,   fill=DARK,  font=font(10))
    d5.text((580,  ry+16), contractor, fill=SLATE, font=font(10))
    d5.text((780,  ry+16), amount,     fill=NAVY,  font=font(11, bold=True))
    d5.rounded_rectangle([928, ry+10, 928+84, ry+36], radius=10, fill=sbg)
    d5.text((938, ry+16), status, fill=sc, font=font(9, bold=True))
    d5.text((1080, ry+16), date,   fill=SLATE_L, font=font(10))
    d5.rounded_rectangle([W-80, ry+14, W-22, ry+38], radius=6, fill=(239,246,255))
    d5.text((W-70, ry+20), "Review", fill=BLUE, font=font(9))

img5.save(f"{OUT}/05_payments.png")
print("✅ Payments saved")

print(f"\n🎉 All 5 screenshots saved to {OUT}/")
