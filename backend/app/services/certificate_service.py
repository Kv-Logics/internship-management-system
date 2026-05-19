import os
import urllib.request
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, Frame

def download_logo_if_needed():
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'nitt_logo.png')
    logo_path = os.path.abspath(logo_path)
    
    if not os.path.exists(logo_path):
        try:
            url = "https://upload.wikimedia.org/wikipedia/en/5/51/NITT_logo.png"
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response, open(logo_path, 'wb') as out_file:
                out_file.write(response.read())
        except Exception as e:
            return None
    return logo_path

def generate_certificate_pdf(intern_name: str, college_name: str, title: str, domain: str, start_date, end_date, output_path: str, certificate_number: str, mentor_name: str):
    # Clean up prefixes from DB to prevent "Dr. Dr."
    clean_name = mentor_name.strip()
    if clean_name.startswith("Dr. "): clean_name = clean_name[4:].strip()
    elif clean_name.startswith("Dr."): clean_name = clean_name[3:].strip()
    elif clean_name.startswith("Prof. "): clean_name = clean_name[6:].strip()
    elif clean_name.startswith("Prof."): clean_name = clean_name[5:].strip()
    
    mentor_name_final = f"Dr. {clean_name}"

    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    c = canvas.Canvas(output_path, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # 1. Premium Double Border
    c.setStrokeColor(colors.HexColor("#0f172a")) # Slate 900
    c.setLineWidth(5)
    c.rect(0.5*inch, 0.5*inch, width - 1*inch, height - 1*inch)
    
    c.setStrokeColor(colors.HexColor("#3b82f6")) # Blue 500
    c.setLineWidth(1.5)
    c.rect(0.58*inch, 0.58*inch, width - 1.16*inch, height - 1.16*inch)
    
    # 2. Draw NIT Logo Top Center
    logo_path = download_logo_if_needed()
    if logo_path and os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, width / 2.0 - 45, height - 1.7*inch, width=90, height=90, mask='auto')
        except:
            pass

    # 3. Verification ID (Top Left)
    if certificate_number:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#64748b")) # Slate 500
        c.drawString(0.8*inch, height - 0.9*inch, f"VERIFICATION ID: {certificate_number}")

    # 4. Header Text
    c.setFont("Helvetica-Bold", 34)
    c.setFillColor(colors.HexColor("#1e3b8e")) # Premium Dark Blue
    c.drawCentredString(width / 2.0, height - 2.5*inch, "CERTIFICATE OF INTERNSHIP")
    
    # 5. Subtitle
    c.setFont("Helvetica-Oblique", 16)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(width / 2.0, height - 3.2*inch, "This is to certify that")
    
    # 6. Intern Name
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(width / 2.0, height - 3.8*inch, intern_name)
    
    # 7. Platypus Paragraph for core wrapped text
    styles = getSampleStyleSheet()
    
    style_core = ParagraphStyle(
        'CoreText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#334155"),
        alignment=1 # Center alignment
    )
    
    # Format dates
    s_date = start_date.strftime("%B %d, %Y") if hasattr(start_date, 'strftime') else start_date
    e_date = end_date.strftime("%B %d, %Y") if hasattr(end_date, 'strftime') else end_date

    # The exact text the user requested, perfectly centered and wrapped
    text_html = f"""
    a student of <b>{college_name}</b>, has successfully completed the internship program at<br/>
    National Institute of Technology, Tiruchirappalli from <b>{s_date}</b> to <b>{e_date}</b>.<br/><br/>
    During this tenure, the student contributed to the project titled:<br/><br/>
    <font size="16" color="#1e3b8e"><b>"{title}"</b></font><br/><br/>
    under the domain of <b>{domain}</b>, under the guidance of <b>{mentor_name_final}</b>.<br/><br/>
    <font size="12" color="#475569">We appreciate the student’s sincere efforts, dedication, and valuable contributions<br/>
    during the internship period and wish them success in all future endeavors.</font>
    """
    
    p = Paragraph(text_html, style_core)
    
    # Draw paragraph onto canvas using a Frame
    frame_width = width - 2*inch
    frame_height = 4*inch
    f = Frame(1*inch, 1.6*inch, frame_width, frame_height, showBoundary=0)
    f.addFromList([p], c)
    
    # 8. Signature Blocks (Bottom)
    c.setStrokeColor(colors.HexColor("#0f172a"))
    c.setLineWidth(1)
    
    # Left Signature Line (Faculty Mentor)
    c.line(1.4*inch, 1.4*inch, 3.4*inch, 1.4*inch)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(1.5*inch, 1.2*inch, "FACULTY MENTOR")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(1.5*inch, 1.05*inch, "National Institute of Technology")
    
    # Right Signature Line (Research Dean)
    c.line(width - 3.4*inch, 1.4*inch, width - 1.4*inch, 1.4*inch)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(width - 3.2*inch, 1.2*inch, "RESEARCH DEAN")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(width - 3.2*inch, 1.05*inch, "NIT Administration Seal")
    
    # Save PDF
    c.save()
    return output_path