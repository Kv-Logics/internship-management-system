from PIL import Image, ImageDraw, ImageFont
import os


def download_logo_if_needed():
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'nitt_logo.png')
    logo_path = os.path.abspath(logo_path)
    if os.path.exists(logo_path):
        return logo_path
    cwd_path = os.path.abspath("nitt_logo.png")
    if os.path.exists(cwd_path):
        return cwd_path
    return None


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
    faculty_signature_path: str = None,
    dean_signature_path: str = None
):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    template_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "reference_image.jpeg")
    )
    if not os.path.exists(template_path):
        template_path = os.path.abspath("reference_image.jpeg")

    img = Image.open(template_path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # ── Fonts ────────────────────────────────────────────────────────────────
    _base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    _bold_paths = [
        os.path.join(_base, "fonts", "timesbd.ttf"),                          # bundled — guaranteed consistent
        "C:/Windows/Fonts/timesbd.ttf",                                       # Windows local
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",              # Debian/Ubuntu Docker
        "/usr/share/fonts/dejavu/DejaVuSerif-Bold.ttf",                       # RHEL/CentOS
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",      # Debian/Ubuntu
        "/usr/share/fonts/liberation/LiberationSerif-Bold.ttf",               # RHEL/CentOS
    ]
    _regular_paths = [
        os.path.join(_base, "fonts", "times.ttf"),
        "C:/Windows/Fonts/times.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
        "/usr/share/fonts/liberation/LiberationSerif-Regular.ttf",
    ]

    def _load_font(paths, size):
        for p in paths:
            try:
                return ImageFont.truetype(p, size)
            except (IOError, OSError):
                continue
        return ImageFont.load_default()

    font_bold    = _load_font(_bold_paths, 28)
    font_regular = _load_font(_regular_paths, 28)
    font_verif   = _load_font(_bold_paths, 15)

    DARK = (30, 41, 59, 255)
    GREY = (100, 116, 139, 255)

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _text_size(text, font):
        bb = draw.textbbox((0, 0), text, font=font)
        return bb[2] - bb[0], bb[3] - bb[1]

    def _fit_font(text, field_w, base_size=28, min_size=10):
        """Return a font scaled down until text fits within field_w pixels."""
        for size in range(base_size, min_size - 1, -1):
            f = _load_font(_bold_paths, size)
            if _text_size(text, f)[0] <= field_w:
                return f
        return _load_font(_bold_paths, min_size)

    def draw_on_field(text, x_start, x_end, underline_y, font, fill=DARK):
        """Centre text in field, sitting 10px above the underline."""
        tw, th = _text_size(text, font)
        x = (x_start + x_end) // 2 - tw // 2
        y = underline_y - th - 10
        draw.text((x, y), text, font=font, fill=fill)

    def draw_fitted(text, x_start, x_end, underline_y, base_size=28, fill=DARK):
        """Draw text auto-scaled to fit within the field width."""
        font = _fit_font(text, x_end - x_start, base_size)
        draw_on_field(text, x_start, x_end, underline_y, font, fill)

    def draw_at_center(text, cx, underline_y, font, fill=DARK):
        """Centre text on a fixed x and sit it 10px above the underline."""
        tw, th = _text_size(text, font)
        x = cx - tw // 2
        y = underline_y - th - 10
        draw.text((x, y), text, font=font, fill=fill)

    # ── 1. Verification ID — bottom center below decorative divider ───────────
    if certificate_number:
        vt = f"VERIFICATION ID: {certificate_number}"
        vtw, _ = _text_size(vt, font_verif)
        draw.text((768 - vtw // 2, 945), vt, font=font_verif, fill=GREY)

    # ── 2. Cover pre-printed "(Institute/University Name)" ────────────────────
    draw.rectangle([930, 400, 1200, 440], fill=(255, 255, 255, 255))

    # ── 3. Intern name  (field x=391–1165, y=383) ────────────────────────────
    draw_fitted(intern_name.strip().title(), 391, 1165, 383)

    # ── 4. College name  (extended line x=287–1332, y=428) ───────────────────
    draw.line([(287, 428), (1332, 428)], fill=(14, 14, 14, 255), width=2)
    draw_fitted(college_name.strip().title(), 287, 1332, 428)

    # ── 5. Department  (extended line x=378–1332, y=513) ─────────────────────
    draw.rectangle([970, 480, 1040, 525], fill=(255, 255, 255, 255))   # erase old "at"
    draw.line([(970, 513), (1332, 513)], fill=(30, 41, 59, 255), width=2)
    tw_at, th_at = _text_size("at", font_regular)
    draw.text((1345, 513 - th_at - 10), "at", font=font_regular, fill=DARK)
    draw_fitted(domain.strip(), 378, 1332, 513)

    # ── 6. Dates ─────────────────────────────────────────────────────────────
    try:
        sd, sm, sy = start_date.strftime('%d'), start_date.strftime('%m'), start_date.strftime('%Y')
        ed, em, ey = end_date.strftime('%d'),   end_date.strftime('%m'),   end_date.strftime('%Y')
    except Exception:
        sd = sm = ed = em = ""
        sy = str(start_date)
        ey = str(end_date)

    for val, cx in [(sd, 485), (sm, 548), (sy, 632), (ed, 727), (em, 792), (ey, 881)]:
        draw_at_center(val, cx, 598, font_bold)

    # ── 7. Internship title — pixel-width split into up to 2 lines ────────────
    _tw = 1280 - 248
    title_text = title.strip()
    if _text_size(title_text, font_bold)[0] <= _tw:
        draw_on_field(title_text, 248, 1280, 679, font_bold)
    else:
        # Split at the last word that fits on line 1
        words = title_text.split()
        line1, line2 = "", ""
        for word in words:
            candidate = (line1 + " " + word).strip()
            if _text_size(candidate, font_bold)[0] <= _tw:
                line1 = candidate
            else:
                line2 = (line2 + " " + word).strip()
        draw_on_field(line1, 248, 1280, 679, font_bold)
        if line2:
            # If line 2 still overflows, scale it down
            l2_font = _fit_font(line2, _tw)
            draw_on_field(line2, 248, 1280, 719, l2_font)

    # ── 8. Mentor name ────────────────────────────────────────────────────────
    mentor_display = mentor_name.strip()
    _mentor_lower = mentor_display.lower()
    if not any(_mentor_lower.startswith(p) for p in ("dr.", "dr ", "prof.", "prof ")):
        mentor_display = f"Dr. {mentor_display}"
    draw_fitted(mentor_display, 555, 1100, 761)

    # ── 9. Bottom date (y=969) ────────────────────────────────────────────────
    for val, cx in [(ed, 224), (em, 276), (ey, 352)]:
        draw_at_center(val, cx, 969, font_bold)

    # ── 10. White out redundant "Signature: _______" lines ───────────────────
    draw.rectangle([100, 863, 650, 900], fill=(255, 255, 255, 255))
    draw.rectangle([850, 863, 1350, 900], fill=(255, 255, 255, 255))

    # ── 11. Mentor signature image (above line y=825, center x=429) ───────────
    if faculty_signature_path and os.path.exists(faculty_signature_path):
        try:
            sig = Image.open(faculty_signature_path).convert("RGBA")
            sig.thumbnail((180, 45), Image.Resampling.LANCZOS)
            sw, sh = sig.size
            img.alpha_composite(sig, (int(429 - sw / 2), int(820 - sh)))
        except Exception as e:
            print("Faculty signature overlay failed:", e)

    # ── 12. Dean signature image (above line y=825, center x=1127) ────────────
    if dean_signature_path and os.path.exists(dean_signature_path):
        try:
            sig = Image.open(dean_signature_path).convert("RGBA")
            sig.thumbnail((180, 45), Image.Resampling.LANCZOS)
            sw, sh = sig.size
            img.alpha_composite(sig, (int(1127 - sw / 2), int(820 - sh)))
        except Exception as e:
            print("Dean signature overlay failed:", e)

    # ── Save ──────────────────────────────────────────────────────────────────
    img.convert("RGB").save(output_path, "PDF", resolution=100.0)
    return output_path