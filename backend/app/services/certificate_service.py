from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import Paragraph, Frame, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import os
import urllib.request

def download_logo_if_needed():
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'nitt_logo.png')
    logo_path = os.path.abspath(logo_path)
    if not os.path.exists(logo_path):
        try:
            print(f"Downloading NIT logo to: {logo_path}")
            url = "https://upload.wikimedia.org/wikipedia/en/5/51/NITT_logo.png"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req) as response, open(logo_path, 'wb') as out_file:
                out_file.write(response.read())
        except Exception as e:
            print(f"WARNING: Failed to download NIT logo ({e}).")
            return None
    return logo_path

def generate_certificate_pdf(
    intern_name: str,
    college_name: str,
    title: str,
    domain: str,
    start_date,
    end_date,
    output_path: str,
    certificate_number: str,
    mentor_name: str = "Assigned Faculty",
    faculty_signature_path: str = None
):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    c = canvas.Canvas(output_path, pagesize=landscape(letter))
    width, height = landscape(letter)

    # --- Borders ---
    c.setStrokeColor(colors.HexColor("#0f172a"))
    c.setLineWidth(4.5)
    c.rect(0.4*inch, 0.4*inch, width - 0.8*inch, height - 0.8*inch)
    c.setStrokeColor(colors.HexColor("#3b82f6"))
    c.setLineWidth(1.0)
    c.rect(0.48*inch, 0.48*inch, width - 0.96*inch, height - 0.96*inch)

    # --- Logo ---
    logo_path = download_logo_if_needed()
    if logo_path and os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, width/2.0 - 40, height - 1.8*inch, width=80, height=80, mask='auto')
        except Exception as e:
            print(f"Error rendering logo: {e}")

    # --- Verification ID ---
    if certificate_number:
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawString(0.8*inch, height - 0.8*inch, f"VERIFICATION ID: {certificate_number}")

    # --- Date formatting ---
    try:
        start_str = f"{start_date.day} {start_date.strftime('%B %Y')}"
        end_str   = f"{end_date.day} {end_date.strftime('%B %Y')}"
    except Exception:
        start_str, end_str = str(start_date), str(end_date)

    # --- Styles ---
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'],
        fontName='Times-Bold', fontSize=28,
        textColor=colors.HexColor("#1e3b8e"),
        alignment=TA_CENTER, spaceAfter=20
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle', parent=styles['Normal'],
        fontName='Times-Italic', fontSize=15,
        textColor=colors.HexColor("#475569"),
        alignment=TA_CENTER, spaceAfter=20
    )
    name_style = ParagraphStyle(
        'NameStyle', parent=styles['Heading2'],
        fontName='Times-Bold', fontSize=26,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_CENTER, spaceAfter=20
    )
    body_style = ParagraphStyle(
        'BodyStyle', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=13,
        textColor=colors.HexColor("#334155"),
        alignment=TA_CENTER, spaceAfter=12, leading=20
    )
    project_title_style = ParagraphStyle(
        'ProjectTitleStyle', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=15,
        textColor=colors.HexColor("#1e3b8e"),
        alignment=TA_CENTER, spaceAfter=12
    )

    # --- Story ---
    story = []
    story.append(Paragraph("INTERNSHIP COMPLETION CERTIFICATE", title_style))
    story.append(Paragraph("This is to certify that", subtitle_style))
    story.append(Paragraph(intern_name.title(), name_style))

    body1 = (
        f"a student of {college_name}, has successfully completed the "
        f"Summer Internship Program 2026 at the National Institute of Technology, "
        f"Tiruchirappalli from {start_str} to {end_str}."
    )
    story.append(Paragraph(body1, body_style))

    story.append(Paragraph("During the internship period, the student worked on the project", body_style))
    story.append(Paragraph(title, project_title_style))

    mentor_display = mentor_name.title()
    if not mentor_display.startswith("Dr.") and not mentor_display.startswith("Dr "):
        mentor_display = f"Dr. {mentor_display}"
    body3 = f"in the domain of {domain} under the guidance of {mentor_display}."
    story.append(Paragraph(body3, body_style))

    frame_width  = width - 2*inch
    frame_height = height - 3.2*inch
    f = Frame(1*inch, 1.5*inch, frame_width, frame_height, showBoundary=0)
    f.addFromList(story, c)

    # --- Signature block (bottom-left) ---
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)

    left_x = 2.5*inch
    # Draw e-signature image above the line if available
    if faculty_signature_path and os.path.exists(faculty_signature_path):
        try:
            c.drawImage(
                faculty_signature_path,
                left_x - 1.0*inch, 1.25*inch,
                width=2.0*inch, height=0.7*inch,
                mask='auto', preserveAspectRatio=True
            )
        except Exception as e:
            print("Failed to draw signature:", e)

    c.line(left_x - 1.25*inch, 1.2*inch, left_x + 1.25*inch, 1.2*inch)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(left_x, 0.95*inch, "FACULTY MENTOR")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawCentredString(left_x, 0.75*inch, "National Institute of Technology")

    # --- Issue date (bottom-right) ---
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawString(width - 2.8*inch, 0.95*inch, f"Issued on: {end_str}")

    c.save()
    return output_path