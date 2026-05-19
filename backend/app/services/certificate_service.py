from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import Paragraph, Frame, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os
import urllib.request

def download_logo_if_needed():
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'nitt_logo.png')
    logo_path = os.path.abspath(logo_path)
    
    if not os.path.exists(logo_path):
        try:
            print(f"Downloading official NIT logo to: {logo_path}")
            url = "https://upload.wikimedia.org/wikipedia/en/5/51/NITT_logo.png"
            # Use a realistic User-Agent to avoid HTTP 403 Forbidden from Wikimedia
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response, open(logo_path, 'wb') as out_file:
                out_file.write(response.read())
            print("NIT logo downloaded successfully!")
        except Exception as e:
            print(f"WARNING: Failed to download NIT logo ({e}). A fallback logo placeholder will be rendered.")
            return None
    return logo_path

def generate_certificate_pdf(intern_name: str, college_name: str, title: str, domain: str, start_date, end_date, output_path: str, certificate_number: str, mentor_name: str = "Assigned Faculty"):
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    c = canvas.Canvas(output_path, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # 1. Elegant Double Border Design
    c.setStrokeColor(colors.HexColor("#0f172a")) # Slate 900
    c.setLineWidth(6)
    c.rect(0.4*inch, 0.4*inch, width - 0.8*inch, height - 0.8*inch)
    
    c.setStrokeColor(colors.HexColor("#3b82f6")) # Blue 500
    c.setLineWidth(1.5)
    c.rect(0.48*inch, 0.48*inch, width - 0.96*inch, height - 0.96*inch)
    
    # 2. Draw official NIT Trichy Logo (Centered at the top)
    logo_path = download_logo_if_needed()
    if logo_path and os.path.exists(logo_path):
        try:
            # Draw logo beautifully at the top center
            c.drawImage(logo_path, width / 2.0 - 45, height - 1.6*inch, width=90, height=90, mask='auto')
        except Exception as e:
            print(f"Error rendering logo: {e}")
            c.setFillColor(colors.HexColor("#1e3a8a"))
            c.circle(width / 2.0, height - 1.1*inch, 35, fill=True, stroke=False)
            
    # 3. Certificate Number (Top Left, Small & Premium)
    if certificate_number:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor("#64748b")) # Slate 500
        c.drawString(0.8*inch, height - 0.8*inch, f"VERIFICATION ID: {certificate_number}")

    # Use ReportLab Platypus for elegant word-wrapping and layout
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Times-Bold',
        fontSize=30,
        textColor=colors.HexColor("#1e3b8e"),
        alignment=TA_CENTER,
        spaceAfter=25
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=16,
        textColor=colors.HexColor("#475569"),
        alignment=TA_CENTER,
        spaceAfter=25
    )
    
    name_style = ParagraphStyle(
        'NameStyle',
        parent=styles['Heading2'],
        fontName='Times-Bold',
        fontSize=28,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_CENTER,
        spaceAfter=25
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=14,
        textColor=colors.HexColor("#334155"),
        alignment=TA_CENTER,
        spaceAfter=15,
        leading=20
    )
    
    project_title_style = ParagraphStyle(
        'ProjectTitleStyle',
        parent=styles['Normal'],
        fontName='Times-BoldItalic',
        fontSize=16,
        textColor=colors.HexColor("#1e3b8e"),
        alignment=TA_CENTER,
        spaceAfter=15
    )

    story = []
    
    story.append(Paragraph("CERTIFICATE OF INTERNSHIP", title_style))
    story.append(Paragraph("This is to certify that", subtitle_style))
    story.append(Paragraph(intern_name, name_style))
    
    body1 = f"a student of {college_name}, has successfully completed the internship program at National Institute of Technology, Tiruchirappalli from {start_date} to {end_date}."
    story.append(Paragraph(body1, body_style))
    
    body2 = "During this tenure, the student contributed to the project titled:"
    story.append(Paragraph(body2, body_style))
    
    story.append(Paragraph(f'"{title}"', project_title_style))
    
    mentor_display = mentor_name
    if not mentor_display.startswith("Dr.") and not mentor_display.startswith("Dr "):
        mentor_display = f"Dr. {mentor_name}"

    body3 = f"under the domain of {domain}, under the guidance of {mentor_display}."
    story.append(Paragraph(body3, body_style))
    
    body4 = "We appreciate the student’s sincere efforts, dedication, and valuable contributions during the internship period and wish them success in all future endeavors."
    story.append(Paragraph(body4, body_style))
    
    # Create a Frame to hold the story, leaving space for borders, logo, and signature lines.
    frame_width = width - 2*inch
    frame_height = height - 3.2*inch
    
    f = Frame(1*inch, 1.5*inch, frame_width, frame_height, showBoundary=0)
    f.addFromList(story, c)

    # 8. Signature Blocks (Left and Right at the bottom)
    c.setStrokeColor(colors.HexColor("#94a3b8")) # Slate 400
    c.setLineWidth(1)
    
    # Left Signature Line (Faculty Mentor)
    c.line(1.5*inch, 1.2*inch, 3.5*inch, 1.2*inch)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(1.85*inch, 0.95*inch, "FACULTY MENTOR")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(1.7*inch, 0.75*inch, "National Institute of Technology")
    
    # Right Signature Line (Research Dean)
    c.line(width - 3.5*inch, 1.2*inch, width - 1.5*inch, 1.2*inch)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(width - 3.1*inch, 0.95*inch, "DEAN (R&C)")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(width - 3.3*inch, 0.75*inch, "National Institute of Technology")
    
    # 9. Save PDF
    c.save()
    return output_path