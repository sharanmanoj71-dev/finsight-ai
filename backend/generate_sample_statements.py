import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_data"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

# 1. Generate Realistic CSV
CSV_PATH = SAMPLE_DIR / "chase_checking_sample.csv"
csv_content = """Date,Description,Debit,Credit,Balance
2026-03-01,EMPLOYER PAYROLL DIRECT DEPOSIT ACME CORP,,3200.00,7450.00
2026-03-01,METROPOLITAN APARTMENTS MONTHLY LEASE RENT,1450.00,,6000.00
2026-03-02,WHOLE FOODS MARKET GROCERY #1042,128.45,,5871.55
2026-03-03,SHELL OIL GAS STATION PUMP 04,45.20,,5826.35
2026-03-04,STARBUCKS STORE #0492 SEATTLE,6.75,,5819.60
2026-03-05,NETFLIX STREAMING MONTHLY SUBSCRIPTION,19.99,,5799.61
2026-03-05,SPOTIFY USA MUSIC SUBSCRIPTION,10.99,,5788.62
2026-03-06,UBER TRIP RIDE TO DOWNTOWN,24.50,,5764.12
2026-03-07,AMAZON.COM DIGITAL RETAIL ORDER,64.20,,5699.92
2026-03-08,CONEDISON ELECTRIC AND GAS UTILITY BILL,115.40,,5584.52
2026-03-09,CHIPOTLE MEXICAN GRILL LUNCH,15.80,,5568.72
2026-03-10,PLANET FITNESS MONTHLY GYM DUES,24.99,,5543.73
2026-03-11,COMCAST XFINITY INTERNET BROADBAND,79.99,,5463.74
2026-03-12,UBER EATS BURGER JOINT ORDER,34.50,,5429.24
2026-03-13,UBER EATS BURGER JOINT ORDER,34.50,,5394.74
2026-03-14,TRADER JOES GROCERY MARKET,92.15,,5302.59
2026-03-15,EMPLOYER PAYROLL DIRECT DEPOSIT ACME CORP,,3200.00,8502.59
2026-03-16,APPLE STORE #R102 NEW LAPTOP ACCESSORIES,2499.00,,6003.59
2026-03-17,CVS PHARMACY HEALTHCARE PRESCRIPTION,28.60,,5974.99
2026-03-18,TARGET SUPERSTORE SUPPLIES,84.10,,5890.89
2026-03-19,AT&T WIRELESS MONTHLY CELL PHONE,85.00,,5805.89
2026-03-20,ATM CASH WITHDRAWAL 5TH AVE BRANCH,800.00,,5005.89
2026-03-21,STARBUCKS STORE #0492 SEATTLE,7.25,,4998.64
2026-03-22,CHEVRON GAS STATION FUEL,42.00,,4956.64
2026-03-23,BEST BUY ELECTRONICS HDMI CABLES,35.99,,4920.65
2026-03-24,WHOLE FOODS MARKET ORGANIC GROCERY,112.40,,4808.25
2026-03-25,VANGUARD INDEX FUNDS RETIREMENT TRANSFER,400.00,,4408.25
2026-03-26,DELTA AIRLINES FLIGHT TICKET BOSTON,285.00,,4123.25
2026-03-27,MARRIOTT HOTEL ROOM STAY,195.00,,3928.25
2026-03-28,DOORDASH SUSHI DINNER,48.20,,3880.05
2026-03-29,AMAZON.COM BOOKS AND ACCESSORIES,52.30,,3827.75
2026-03-30,LOCAL BISTRO DINNER SPLIT,65.40,,3762.35
2026-03-31,FREELANCE DESIGN INVOICE CLIENT PAYOUT,,1500.00,5262.35
"""
with open(CSV_PATH, "w", encoding="utf-8") as f:
    f.write(csv_content.strip())
print(f"Generated CSV: {CSV_PATH}")

# 2. Generate Realistic PDF Bank Statement
PDF_PATH = SAMPLE_DIR / "wells_fargo_statement.pdf"

doc = SimpleDocTemplate(
    str(PDF_PATH),
    pagesize=letter,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    "DocTitle",
    parent=styles["Heading1"],
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#0f172a")
)
sub_style = ParagraphStyle(
    "DocSub",
    parent=styles["Normal"],
    fontSize=9,
    leading=13,
    textColor=colors.HexColor("#475569")
)
table_text_style = ParagraphStyle(
    "TableText",
    parent=styles["Normal"],
    fontSize=8,
    leading=10,
    textColor=colors.HexColor("#1e293b")
)
table_bold_style = ParagraphStyle(
    "TableBold",
    parent=styles["Normal"],
    fontSize=8,
    leading=10,
    textColor=colors.HexColor("#0f172a"),
    fontName="Helvetica-Bold"
)

elements = []

elements.append(Paragraph("<b>WELLS FARGO BANK, N.A.</b>", title_style))
elements.append(Paragraph("Account Statement | Preferred Checking Account ****4821", sub_style))
elements.append(Spacer(1, 10))

summary_data = [
    [Paragraph("<b>Statement Period:</b> March 01, 2026 - March 31, 2026", sub_style), Paragraph("<b>Account Holder:</b> FinSight Demo User", sub_style)],
    [Paragraph("<b>Opening Balance:</b> $4,250.00", sub_style), Paragraph("<b>Closing Balance:</b> $5,262.35", sub_style)],
    [Paragraph("<b>Total Deposits & Additions:</b> $7,900.00", sub_style), Paragraph("<b>Total Withdrawals & Debits:</b> $6,887.65", sub_style)]
]
summary_table = Table(summary_data, colWidths=[270, 270])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
elements.append(summary_table)
elements.append(Spacer(1, 15))

elements.append(Paragraph("<b>TRANSACTION ACTIVITY</b>", ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, leading=14, textColor=colors.HexColor("#0f172a"))))
elements.append(Spacer(1, 6))

headers = [
    Paragraph("<b>Date</b>", table_bold_style),
    Paragraph("<b>Description / Payee</b>", table_bold_style),
    Paragraph("<b>Withdrawals (-)</b>", table_bold_style),
    Paragraph("<b>Deposits (+)</b>", table_bold_style),
    Paragraph("<b>Balance</b>", table_bold_style)
]

tx_rows = [headers]
raw_txs = [
    ("2026-03-01", "EMPLOYER PAYROLL DIRECT DEPOSIT ACME CORP", "", "$3,200.00", "$7,450.00"),
    ("2026-03-01", "METROPOLITAN APTS MONTHLY LEASE RENT", "$1,450.00", "", "$6,000.00"),
    ("2026-03-02", "WHOLE FOODS MARKET GROCERY #1042", "$128.45", "", "$5,871.55"),
    ("2026-03-03", "SHELL OIL GAS STATION PUMP 04", "$45.20", "", "$5,826.35"),
    ("2026-03-04", "STARBUCKS STORE #0492 SEATTLE", "$6.75", "", "$5,819.60"),
    ("2026-03-05", "NETFLIX STREAMING MONTHLY SUBSCRIPTION", "$19.99", "", "$5,799.61"),
    ("2026-03-05", "SPOTIFY USA MUSIC SUBSCRIPTION", "$10.99", "", "$5,788.62"),
    ("2026-03-06", "UBER TRIP RIDE TO DOWNTOWN", "$24.50", "", "$5,764.12"),
    ("2026-03-07", "AMAZON.COM DIGITAL RETAIL ORDER", "$64.20", "", "$5,699.92"),
    ("2026-03-08", "CONEDISON ELECTRIC AND GAS UTILITY BILL", "$115.40", "", "$5,584.52"),
    ("2026-03-09", "CHIPOTLE MEXICAN GRILL LUNCH", "$15.80", "", "$5,568.72"),
    ("2026-03-10", "PLANET FITNESS MONTHLY GYM DUES", "$24.99", "", "$5,543.73"),
    ("2026-03-11", "COMCAST XFINITY INTERNET BROADBAND", "$79.99", "", "$5,463.74"),
    ("2026-03-12", "UBER EATS BURGER JOINT ORDER", "$34.50", "", "$5,429.24"),
    ("2026-03-13", "UBER EATS BURGER JOINT ORDER", "$34.50", "", "$5,394.74"),
    ("2026-03-14", "TRADER JOES GROCERY MARKET", "$92.15", "", "$5,302.59"),
    ("2026-03-15", "EMPLOYER PAYROLL DIRECT DEPOSIT ACME CORP", "", "$3,200.00", "$8,502.59"),
    ("2026-03-16", "APPLE STORE #R102 NEW LAPTOP ACCESSORIES", "$2,499.00", "", "$6,003.59"),
    ("2026-03-17", "CVS PHARMACY HEALTHCARE PRESCRIPTION", "$28.60", "", "$5,974.99"),
    ("2026-03-18", "TARGET SUPERSTORE SUPPLIES", "$84.10", "", "$5,890.89"),
    ("2026-03-19", "AT&T WIRELESS MONTHLY CELL PHONE", "$85.00", "", "$5,805.89"),
    ("2026-03-20", "ATM CASH WITHDRAWAL 5TH AVE BRANCH", "$800.00", "", "$5,005.89"),
    ("2026-03-21", "STARBUCKS STORE #0492 SEATTLE", "$7.25", "", "$4,998.64"),
    ("2026-03-25", "VANGUARD INDEX FUNDS RETIREMENT TRANSFER", "$400.00", "", "$4,598.64"),
    ("2026-03-31", "FREELANCE DESIGN INVOICE CLIENT PAYOUT", "", "$1,500.00", "$5,262.35"),
]

for r in raw_txs:
    tx_rows.append([
        Paragraph(r[0], table_text_style),
        Paragraph(r[1], table_text_style),
        Paragraph(r[2], table_text_style),
        Paragraph(r[3], table_text_style),
        Paragraph(r[4], table_text_style)
    ])

table = Table(tx_rows, colWidths=[65, 230, 80, 80, 85])
table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
]))
elements.append(table)

doc.build(elements)
print(f"Generated PDF: {PDF_PATH}")
