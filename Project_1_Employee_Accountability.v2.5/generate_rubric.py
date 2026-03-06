"""Generate Employee Accountability Rubric in the old SPOKES format with current content."""
import os
from fpdf import FPDF

BASE_DIR = os.path.dirname(__file__)
RESOURCES = os.path.join(BASE_DIR, "Handouts")
os.makedirs(RESOURCES, exist_ok=True)
LOGO_CANDIDATES = [
    os.path.join(BASE_DIR, "SPOKES-Logo.png"),
    os.path.join(BASE_DIR, "Source Material", "SPOKES-Logo.png"),
]

# Colors matching old version
BLUE = (0, 112, 192)
DARK = (0, 0, 0)
WHITE = (255, 255, 255)
LIGHT_BLUE_BG = (218, 232, 250)
HEADER_GRAY = (242, 242, 242)


class RubricPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="L", format="letter")
        self.set_auto_page_break(auto=False)


def generate_rubric():
    pdf = RubricPDF()
    pdf.add_page()
    pw = 279.4   # letter landscape width mm
    ph = 215.9   # letter landscape height mm
    margin = 10
    usable = pw - 2 * margin

    # ── Title ──
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*BLUE)
    pdf.set_xy(margin, 6)
    pdf.cell(usable, 9, "Employee Accountability Rubric", align="L")

    # Blue line under title
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.8)
    pdf.line(margin, 16, pw - margin, 16)

    # SPOKES logo below blue line, top-right
    logo_path = next((path for path in LOGO_CANDIDATES if os.path.exists(path)), None)
    if logo_path:
        pdf.image(logo_path, x=pw - margin - 58, y=17, h=20)

    # ── Name / Date / Teacher row ──
    pdf.set_line_width(0.3)
    pdf.set_draw_color(*DARK)
    y = 19
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.set_xy(margin, y)
    pdf.cell(14, 6, "Name:")
    pdf.line(24, y + 6, 110, y + 6)

    pdf.set_xy(115, y)
    pdf.cell(12, 6, "Date:")
    pdf.line(127, y + 6, 190, y + 6)

    pdf.set_xy(margin, y + 8)
    pdf.cell(18, 6, "Teacher:")
    pdf.line(28, y + 14, 110, y + 14)

    # ── Info section: Lesson Goal, Essential Question, Student Expectations ──
    info_y = 35
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*DARK)

    # LESSON GOAL
    pdf.set_xy(margin, info_y)
    pdf.cell(32, 5, "LESSON GOAL", border=1)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_xy(margin + 32, info_y)
    pdf.cell(88, 5, "Understand and develop personal and employee accountability.", border=1)

    # ESSENTIAL QUESTION
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_xy(margin, info_y + 5)
    pdf.cell(32, 5, "ESSENTIAL", border=0)
    pdf.set_xy(margin, info_y + 9)
    pdf.cell(32, 5, "QUESTION(S)", border=0)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_xy(margin + 32, info_y + 5)
    pdf.cell(88, 10, "Are you accountable for your actions?", border=0)

    # STUDENT EXPECTATIONS
    pdf.set_font("Helvetica", "B", 8)
    exp_x = 140
    pdf.set_xy(exp_x, info_y)
    pdf.cell(0, 4.5, "STUDENT EXPECTATIONS")
    pdf.set_font("Helvetica", "", 7.5)
    expectations = [
        "1.  Participate in discussions about accountability.",
        "2.  Complete self-reflection on Habits of Mind.",
        "3.  Analyze workplace scenarios for accountability.",
        "4.  Create a SMART goal action plan.",
        "5.  Complete career planning activity.",
        "6.  Demonstrate engagement and participation.",
    ]
    for i, exp in enumerate(expectations):
        pdf.set_xy(exp_x, info_y + 5 + i * 3.5)
        pdf.cell(0, 3.5, exp)

    # ── Rubric table ──
    table_y = 61
    cat_w = 52
    exc_w = 50
    meet_w = 50
    app_w = 50
    emer_w = 45
    tot_w = usable - cat_w - exc_w - meet_w - app_w - emer_w
    col_widths = [cat_w, exc_w, meet_w, app_w, emer_w, tot_w]

    # Header row
    pdf.set_xy(margin, table_y)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    headers = ["Category", "Exceeding\n10 points", "Meeting\n8 points",
               "Approaching\n5 points", "Emerging\n2 points", "Total"]
    header_h = 9
    for i, h in enumerate(headers):
        x = margin + sum(col_widths[:i])
        pdf.set_xy(x, table_y)
        pdf.cell(col_widths[i], header_h, "", border=1, fill=True)
        lines = h.split("\n")
        if len(lines) == 2:
            pdf.set_xy(x, table_y + 0.5)
            pdf.cell(col_widths[i], 4, lines[0], align="C")
            pdf.set_xy(x, table_y + 4.5)
            pdf.cell(col_widths[i], 4, lines[1], align="C")
        else:
            pdf.set_xy(x, table_y + 1.5)
            pdf.cell(col_widths[i], 6, lines[0], align="C")

    # Rubric rows data
    rows = [
        (
            "Discussion:",
            "Participate in discussions about\naccountability.",
            "Engaged fully in classroom\ndiscussions by offering\nthoughtful responses.",
            "Participated in classroom\ndiscussions.",
            "Did not offer comments during\ndiscussions but looked engaged\nand demonstrated active\nlistening.",
            "Did not participate in\nclassroom discussions.",
        ),
        (
            "Self-Reflection:",
            "Complete self-reflection on\nHabits of Mind.",
            "Honest, detailed reflection\nwith specific examples\nfrom work or school.",
            "Completed reflection\nappropriately.",
            "Partial completion of\nreflection; limited detail.",
            "Completed little or none\nof the reflection.",
        ),
        (
            "Scenario Analysis:",
            "Analyze workplace scenarios to\nevaluate accountability.",
            "Identified all examples;\nproposed multiple creative\nimprovements.",
            "Identified most examples;\nproposed reasonable\nimprovements.",
            "Identified some examples;\nimprovements were vague.",
            "Did not complete scenario\nanalysis.",
        ),
        (
            "SMART Goal:",
            "Create a SMART goal action\nplan.",
            "All 5 SMART criteria met;\ngoal is specific, realistic,\nand includes support plan.",
            "Meets all SMART criteria.",
            "Goal is missing 1-2\nSMART elements.",
            "Goal is incomplete or\nnot attempted.",
        ),
        (
            "Career Planning:",
            "Complete career planning\nactivity.",
            "Connected career goals to\naccountability; identified\nbarriers and solutions.",
            "Made relevant connections\nbetween career goals and\naccountability.",
            "Connections between career\ngoals and accountability\nwere unclear.",
            "Did not complete career\nplanning activity.",
        ),
        (
            "Engagement:",
            "Demonstrate participation and\nengagement throughout lesson.",
            "On time; actively supported\npeers; asked questions;\nfully engaged throughout.",
            "Completed tasks; participated\nwhen called upon.",
            "Late or distracted at times;\nminimal participation.",
            "Not accountable; did not\nparticipate.",
        ),
    ]

    row_h = 20
    pdf.set_text_color(*DARK)
    for r_idx, row_data in enumerate(rows):
        y = table_y + header_h + r_idx * row_h
        cat_title, cat_desc, exc, meet, appr, emer = row_data

        # Alternate row background
        bg = WHITE if r_idx % 2 == 0 else HEADER_GRAY

        for c_idx in range(6):
            x = margin + sum(col_widths[:c_idx])
            pdf.set_fill_color(*bg)
            pdf.set_xy(x, y)
            pdf.cell(col_widths[c_idx], row_h, "", border=1, fill=True)

        # Category column: bold title + description
        x = margin
        pdf.set_font("Helvetica", "B", 7.5)
        pdf.set_xy(x + 1, y + 1)
        pdf.multi_cell(cat_w - 2, 3.5, cat_title)
        pdf.set_font("Helvetica", "", 6.5)
        desc_y = pdf.get_y()
        pdf.set_xy(x + 1, desc_y + 0.3)
        pdf.multi_cell(cat_w - 2, 3.2, cat_desc)

        # Exceeding
        pdf.set_font("Helvetica", "", 6.5)
        x = margin + cat_w
        pdf.set_xy(x + 1, y + 1.5)
        pdf.multi_cell(exc_w - 2, 3.2, exc)

        # Meeting
        x = margin + cat_w + exc_w
        pdf.set_xy(x + 1, y + 1.5)
        pdf.multi_cell(meet_w - 2, 3.2, meet)

        # Approaching
        x = margin + cat_w + exc_w + meet_w
        pdf.set_xy(x + 1, y + 1.5)
        pdf.multi_cell(app_w - 2, 3.2, appr)

        # Emerging
        x = margin + cat_w + exc_w + meet_w + app_w
        pdf.set_xy(x + 1, y + 1.5)
        pdf.multi_cell(emer_w - 2, 3.2, emer)

    # ── Scoring section at bottom ──
    score_y = table_y + header_h + len(rows) * row_h + 4
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*DARK)
    pdf.set_xy(margin, score_y)

    # Directions line
    pdf.cell(19, 5, "Directions:", align="L")
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(55, 5, "Combine subtotals from each row")
    pdf.set_font("ZapfDingbats", "", 7)
    bullet_x = margin + 80
    pdf.set_xy(bullet_x, score_y)
    pdf.cell(4, 5, "l")  # ZapfDingbats bullet
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(bullet_x + 5, score_y)
    pdf.cell(20, 5, "Multiply by 2")
    pdf.set_font("ZapfDingbats", "", 7)
    pdf.set_xy(bullet_x + 27, score_y)
    pdf.cell(4, 5, "l")  # ZapfDingbats bullet
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(bullet_x + 32, score_y)
    pdf.cell(0, 5, "The result is the final score.")

    # Example line
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_xy(margin, score_y + 6)
    pdf.cell(17, 5, "Example:")
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(57, 5, "Combine subtotals from each row = ")
    pdf.line(84, score_y + 11, 125, score_y + 11)
    pdf.set_xy(127, score_y + 6)
    pdf.cell(28, 5, "multiply by 2  = ")
    pdf.line(155, score_y + 11, 190, score_y + 11)
    pdf.set_xy(192, score_y + 6)
    pdf.cell(20, 5, "Final Score")

    # FINAL SCORE box
    pdf.set_font("Helvetica", "B", 9)
    fs_x = pw - margin - 35
    pdf.set_xy(fs_x, score_y)
    pdf.cell(35, 5, "FINAL SCORE", align="C")
    pdf.set_xy(fs_x, score_y + 6)
    pdf.cell(35, 8, "", border=1)

    path = os.path.join(RESOURCES, "Employee_Accountability_Rubric.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


if __name__ == "__main__":
    generate_rubric()
