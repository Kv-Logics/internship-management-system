from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
import os

def generate_certificate_pdf(intern_name: str, college_name: str, title: str, domain: str, start_date, end_date, output_path: str, certificate_number: str):
    c = canvas.Canvas(output_path, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # Border
    c.setStrokeColor(colors.HexColor("#1e3a8a"))
    c.setLineWidth(5)
    c.rect(0.5*inch, 0.5*inch, width - 1*inch, height - 1*inch)
    
    # Certificate Number
    if certificate_number:
        c.setFont("Helvetica", 12)
        c.drawString(0.8*inch, height - 0.8*inch, f"Certificate No: {certificate_number}")

    # Title
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.drawCentredString(width / 2.0, height - 2*inch, "CERTIFICATE OF INTERNSHIP")
    
    # Subtitle
    c.setFont("Helvetica", 18)
    c.setFillColor(colors.black)
    c.drawCentredString(width / 2.0, height - 3*inch, "This is proudly presented to")
    
    # Intern Name
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2.0, height - 4*inch, intern_name)
    
    # Details
    c.setFont("Helvetica", 14)
    text = f"from {college_name} for successfully completing an internship"
    c.drawCentredString(width / 2.0, height - 4.8*inch, text)
    text2 = f"in '{title}' ({domain}) from {start_date} to {end_date}."
    c.drawCentredString(width / 2.0, height - 5.2*inch, text2)
    
    c.save()
    return output_path