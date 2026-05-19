import os
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

def generate_certificate_pdf(intern_name: str, college_name: str, title: str, domain: str, start_date, end_date, output_path: str, certificate_number: str, mentor_name: str):
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Ensure Mentor Name is prefixed with "Dr. " if not already present
    if not mentor_name.startswith("Dr. ") and not mentor_name.startswith("Prof. "):
        mentor_name = f"Dr. {mentor_name}"

    # Setup Jinja2 environment
    template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('certificate.html')
    
    # Render HTML template with context
    html_content = template.render(
        intern_name=intern_name,
        college_name=college_name,
        title=title,
        domain=domain,
        start_date=start_date.strftime("%B %d, %Y") if hasattr(start_date, 'strftime') else start_date,
        end_date=end_date.strftime("%B %d, %Y") if hasattr(end_date, 'strftime') else end_date,
        certificate_number=certificate_number,
        mentor_name=mentor_name
    )
    
    # Convert HTML to PDF
    with open(output_path, "wb") as pdf_file:
        pisa_status = pisa.CreatePDF(
            html_content,
            dest=pdf_file
        )
    
    if pisa_status.err:
        raise Exception(f"Failed to generate PDF: {pisa_status.err}")
        
    return output_path