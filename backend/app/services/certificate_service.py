from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
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
            
    # Institution Name
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.HexColor("#1e3b8e")) # Premium Dark Blue
    c.drawCentredString(width / 2.0, height - 2.1*inch, "NATIONAL INSTITUTE OF TECHNOLOGY, TIRUCHIRAPPALLI")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(width / 2.0, height - 2.3*inch, "Tiruchirappalli, Tamil Nadu 620015, India")

    # 3. Certificate Number (Top Left, Small & Premium)
    if certificate_number:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor("#64748b")) # Slate 500
        c.drawString(0.8*inch, height - 0.8*inch, f"VERIFICATION ID: {certificate_number}")

    # 4. Certificate Header
    c.setFont("Times-Bold", 34)
    c.setFillColor(colors.HexColor("#0f172a")) 
    c.drawCentredString(width / 2.0, height - 3.2*inch, "CERTIFICATE OF EXCELLENCE")
    
    # 5. Presented to text
    c.setFont("Times-Italic", 16)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawCentredString(width / 2.0, height - 3.8*inch, "This is to certify that")
    
    # 6. Intern Name (Large & Elegant)
    c.setFont("Times-Bold", 28)
    c.setFillColor(colors.HexColor("#1e40af"))
    c.drawCentredString(width / 2.0, height - 4.4*inch, intern_name)
    
    # 7. Core Description block
    c.setFont("Times-Roman", 14)
    c.setFillColor(colors.HexColor("#1e293b")) 
    
    line1 = f"a student of {college_name}, has successfully completed"
    c.drawCentredString(width / 2.0, height - 5.0*inch, line1)
    
    line2 = f"an academic internship program from {start_date} to {end_date}."
    c.drawCentredString(width / 2.0, height - 5.3*inch, line2)
    
    line3 = "During this tenure, they made valuable contributions to the research project titled:"
    c.drawCentredString(width / 2.0, height - 5.8*inch, line3)
    
    c.setFont("Times-BoldItalic", 16)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(width / 2.0, height - 6.2*inch, f"\"{title}\"")
    
    c.setFont("Times-Roman", 14)
    c.setFillColor(colors.HexColor("#1e293b")) 
    c.drawCentredString(width / 2.0, height - 6.6*inch, f"under the domain of {domain}, guided by {mentor_name}.")
    
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