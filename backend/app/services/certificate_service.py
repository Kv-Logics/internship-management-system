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
    # Priority: bundled fonts (project/fonts/) → Windows → Linux system fonts
    _base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    _font_candidates = [
        os.path.join(_base, "fonts", "timesbd.ttf"),                           # bundled (best — copy timesbd.ttf here)
        "C:/Windows/Fonts/timesbd.ttf",                                        # Windows
        "/usr/share/fonts/liberation/LiberationSerif-Bold.ttf",                # RHEL/CentOS
        "/usr/share/fonts/dejavu/DejaVuSerif-Bold.ttf",                        # RHEL/CentOS
        "/usr/share/fonts/google-noto/NotoSerif-Bold.ttf",                     # RHEL (noto)
        "/usr/share/fonts/noto/NotoSerif-Bold.ttf",                            # RHEL (noto alt)
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",       # Ubuntu/Debian
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",               # Ubuntu/Debian
    ]
    _font_candidates_bold = _font_candidates
    _font_candidates_verif = _font_candidates

    font_bold = font_verif = None
    for path in _font_candidates_bold:
        try:
            font_bold = ImageFont.truetype(path, 28)
            break
        except (IOError, OSError):
            continue
    for path in _font_candidates_verif:
        try:
            font_verif = ImageFont.truetype(path, 15)
            break
        except (IOError, OSError):
            continue
    if font_bold is None:
        font_bold = ImageFont.load_default()
    if font_verif is None:
        font_verif = ImageFont.load_default()

    DARK = (30, 41, 59, 255)
    GREY = (100, 116, 139, 255)

    # ── Drawing helpers ───────────────────────────────────────────────────────
    def _text_size(text, font):
        bb = draw.textbbox((0, 0), text, font=font)
        return bb[2] - bb[0], bb[3] - bb[1]

    def draw_on_field(text, x_start, x_end, underline_y, font, fill=DARK):
        """Centre text horizontally within [x_start, x_end] and sit it ON the underline."""
        tw, th = _text_size(text, font)
        cx = (x_start + x_end) // 2
        x  = cx - tw // 2
        y  = underline_y - th - 10         # 10 px breathing room above the line
        draw.text((x, y), text, font=font, fill=fill)

    def draw_at_center(text, cx, underline_y, font, fill=DARK):
        """Centre text on a fixed x-centre and sit it ON the underline."""
        tw, th = _text_size(text, font)
        x = cx - tw // 2
        y = underline_y - th - 10
        draw.text((x, y), text, font=font, fill=fill)

    # ── Field map (measured from the 1536×1024 template) ─────────────────────
    #
    #  All y-values are the TOP of the underline stroke.
    #  x_start / x_end are the left/right extents of the blank field area.
    #
    #  Row              underline_y   x_start   x_end   notes
    #  ───────────────  ───────────   ───────   ─────   ──────────────────────
    #  Name             383           391       1165    after "Mr./Ms."
    #  College          428           287       943     before "(Institute…)"
    #  Date (start dd)  598           466       504     centre = 485
    #  Date (start mm)  598           528       568     centre = 548
    #  Date (start yy)  598           592       673     centre = 632
    #  Date (end   dd)  598           708       747     centre = 727
    #  Date (end   mm)  598           772       812     centre = 792
    #  Date (end   yy)  598           836       927     centre = 881
    #  Title line 1     679           248       1280
    #  Title line 2     719           248       1280
    #  Mentor           761           555       1100    after "Dr./Prof."
    #  Bottom date dd   889           —         —       centre = 420
    #  Bottom date mm   889           —         —       centre = 480
    #  Bottom date yy   889           —         —       centre = 560

    # 1. Verification ID — bottom center, below the decorative divider (y~932)
    if certificate_number:
        text = f"VERIFICATION ID: {certificate_number}"
        tw, th = _text_size(text, font_verif)
        draw.text((768 - tw // 2, 945), text, font=font_verif, fill=GREY)

    # Cover "(Institute/University Name)" pre-printed text on template
    draw.rectangle([930, 400, 1200, 440], fill=(255, 255, 255, 255))

    # 2. Student name
    draw_on_field(intern_name.title(), 391, 1165, 383, font_bold)

    # 3. College / institute name
    # Redraw the entire college underline as one continuous line x=287 to x=1332
    # (avoids any gap between original template line and extension)
    draw.line([(287, 428), (1332, 428)], fill=(14, 14, 14, 255), width=2)
    draw_on_field(college_name.title(), 287, 1332, 428, font_bold)

    # 3b. Department name — field: x=287 to 870, underline y=513
    draw_on_field(domain, 287, 870, 513, font_bold)

    # 4. Dates ─────────────────────────────────────────────────────────────────
    try:
        sd = start_date.strftime('%d')
        sm = start_date.strftime('%m')
        sy = start_date.strftime('%Y')
        ed = end_date.strftime('%d')
        em = end_date.strftime('%m')
        ey = end_date.strftime('%Y')
    except Exception:
        sd = sm = ""; sy = str(start_date)
        ed = em = ""; ey = str(end_date)

    # Start date slots
    draw_at_center(sd, 485, 598, font_bold)
    draw_at_center(sm, 548, 598, font_bold)
    draw_at_center(sy, 632, 598, font_bold)
    # End date slots
    draw_at_center(ed, 727, 598, font_bold)
    draw_at_center(em, 792, 598, font_bold)
    draw_at_center(ey, 881, 598, font_bold)

    # 5. Project / internship title (up to two lines)
    MAX_CHARS = 55
    if len(title) > MAX_CHARS:
        words = title.split()
        line1, line2 = "", ""
        for word in words:
            candidate = (line1 + " " + word).strip()
            if len(candidate) <= MAX_CHARS:
                line1 = candidate
            else:
                line2 = (line2 + " " + word).strip()
        draw_on_field(line1, 248, 1280, 679, font_bold)
        if line2:
            draw_on_field(line2, 248, 1280, 719, font_bold)
    else:
        draw_on_field(title, 248, 1280, 679, font_bold)

    # 6. Mentor name (ensure "Dr." / "Prof." prefix)
    mentor_display = mentor_name.strip()
    if not any(mentor_display.startswith(p) for p in ("Dr.", "Dr ", "Prof.", "Prof ")):
        mentor_display = f"Dr. {mentor_display}"
    draw_on_field(mentor_display, 555, 1100, 761, font_bold)

    # 7. Issue date (bottom-left) — y=969, slots: dd c=224, mm c=276, yyyy c=352
    draw_at_center(ed, 224, 969, font_bold)
    draw_at_center(em, 276, 969, font_bold)
    draw_at_center(ey, 352, 969, font_bold)

    # White out redundant "Signature: _______" lines
    draw.rectangle([100, 863, 650, 900], fill=(255, 255, 255, 255))
    draw.rectangle([850, 863, 1350, 900], fill=(255, 255, 255, 255))

    # 8. Mentor signature — image sits ABOVE the line at y=825, centered x=258-601
    if faculty_signature_path and os.path.exists(faculty_signature_path):
        try:
            sig = Image.open(faculty_signature_path).convert("RGBA")
            sig.thumbnail((180, 45), Image.Resampling.LANCZOS)
            sw, sh = sig.size
            # Place image above the line: bottom of image at y=820
            img.alpha_composite(sig, (int(429 - sw / 2), int(820 - sh)))
        except Exception as e:
            print("Faculty signature overlay failed:", e)

    # 9. Dean signature — image sits ABOVE the line at y=825, centered x=959-1296
    if dean_signature_path and os.path.exists(dean_signature_path):
        try:
            sig = Image.open(dean_signature_path).convert("RGBA")
            sig.thumbnail((180, 45), Image.Resampling.LANCZOS)
            sw, sh = sig.size
            # Place image above the line: bottom of image at y=820
            img.alpha_composite(sig, (int(1127 - sw / 2), int(820 - sh)))
        except Exception as e:
            print("Dean signature overlay failed:", e)

    # Save
    img.convert("RGB").save(output_path, "PDF", resolution=100.0)
    return output_path