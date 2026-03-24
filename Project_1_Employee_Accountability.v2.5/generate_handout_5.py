"""Generate updated Handout #5: Career & Education Planning (expanded to 2 pages)."""
import os
from fpdf import FPDF

BASE_DIR = os.path.dirname(__file__)
RESOURCES = os.path.join(BASE_DIR, "Handouts")
os.makedirs(RESOURCES, exist_ok=True)
LOGO_PATH = os.path.join(BASE_DIR, "Source Material", "SPOKES-Logo.png")

BLUE = (45, 109, 181)
GREEN = (76, 184, 72)
DARK = (30, 74, 125)
GRAY = (90, 106, 122)
MUTED_BG = (238, 244, 250)
WHITE = (255, 255, 255)
LIGHT_GRAY = (200, 200, 200)
GREEN_BG = (236, 253, 245)


class CareerPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)

    def header_block(self):
        self.set_fill_color(*BLUE)
        self.rect(0, 0, 210, 22, "F")
        # SPOKES logo centered
        if os.path.exists(LOGO_PATH):
            logo_h = 14
            logo_w = logo_h * (800 / 532)
            logo_x = (210 - logo_w) / 2
            self.image(LOGO_PATH, x=logo_x, y=4, h=logo_h)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*WHITE)
        self.set_xy(10, 4)
        self.cell(0, 7, "Employee Accountability", align="L")
        self.set_font("Helvetica", "", 9)
        self.set_xy(10, 12)
        self.cell(0, 6, "Handout #5: Career & Education Planning", align="L")
        self.set_xy(-65, 8)
        self.set_font("Helvetica", "B", 11)
        self.cell(55, 7, "Career Planning", align="R")
        self.set_y(26)

    def name_date_row(self):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.cell(95, 8, "Name: _________________________________________")
        self.cell(95, 8, "Date: ______________________", align="R")
        self.ln(10)

    def section_heading(self, text):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*BLUE)
        self.set_fill_color(*MUTED_BG)
        self.cell(0, 8, f"  {text}", fill=True, border=0)
        self.ln(10)

    def write_lines(self, num=3):
        self.set_draw_color(*LIGHT_GRAY)
        for _ in range(num):
            self.ln(6)
            self.line(self.get_x(), self.get_y(), self.get_x() + 190, self.get_y())
        self.ln(4)


def generate_handout_5():
    pdf = CareerPDF()

    # ===== PAGE 1 =====
    pdf.add_page()
    pdf.header_block()
    pdf.name_date_row()

    # Directions
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 5,
        "Directions: This handout helps you connect accountability to your career and education "
        "goals. Be thoughtful and honest -- this is YOUR plan for moving forward."
    )
    pdf.ln(3)

    # SECTION I: Core Interests & Values
    pdf.section_heading("SECTION I: Career Interests & Values")

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 6, "1. Three occupations I am most interested in exploring:")
    pdf.ln(8)

    for letter in ["a", "b", "c"]:
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(0, 7, f"   {letter}. ________________________________________________________________________________")
        pdf.ln(8)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, "2. What skills, values, or interests connect you to these careers?")
    pdf.write_lines(3)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, "3. What education or training is needed for your top career choice?")
    pdf.write_lines(2)

    # SECTION II: Skill Development Plan
    pdf.section_heading("SECTION II: Skill Development Plan")

    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 5,
        "Identify skills you need to develop for your target career. For each, describe a specific, "
        "actionable plan for building that skill."
    )
    pdf.ln(3)

    # Skills table
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    col_w = [10, 50, 80, 50]
    headers = ["#", "Skill Needed", "How I Will Develop This Skill", "Timeline"]
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 8, f" {h}", border=1, fill=True)
    pdf.ln()

    pdf.set_text_color(*DARK)
    for i in range(3):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(col_w[0], 16, f" {i+1}.", border=1, fill=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(col_w[1], 16, "", border=1, fill=True)
        pdf.cell(col_w[2], 16, "", border=1, fill=True)
        pdf.cell(col_w[3], 16, "", border=1, fill=True)
        pdf.ln()

    pdf.ln(4)

    # SECTION III: Connecting Accountability
    pdf.section_heading("SECTION III: Connecting Accountability to Your Goals")

    questions = [
        "1. Which Habits of Mind will be most important for your target career? Why?",
        "2. How will the 5 Cs of Accountability (Clarity, Commitment, Communication, Collaboration, Consequences) help you succeed?",
    ]

    for q in questions:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(0, 5, q)
        pdf.write_lines(3)

    # ===== PAGE 2 =====
    pdf.add_page()
    pdf.header_block()

    # SECTION IV: Accountability Support Network
    pdf.section_heading("SECTION IV: My Accountability Support Network")

    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 5,
        "Accountable people don't go it alone. Identify people who can support your goals "
        "and hold you accountable. Think about teachers, supervisors, mentors, family, or peers."
    )
    pdf.ln(3)

    support_roles = [
        ("Mentor / Role Model", "Someone who has experience in your target career or education path."),
        ("Accountability Partner", "A peer who will check in on your progress and challenge you to follow through."),
        ("Professional Contact", "A supervisor, teacher, or counselor who can provide feedback and opportunities."),
    ]

    for i, (role, desc) in enumerate(support_roles):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.cell(0, 28, "", fill=True, border=1)
        pdf.set_xy(x + 3, y + 2)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*BLUE)
        pdf.cell(0, 5, f"{role}")
        pdf.set_xy(x + 3, y + 7)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(*GRAY)
        pdf.cell(0, 5, desc)
        pdf.set_xy(x + 3, y + 14)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 5, "Name: ________________________________    Contact: ________________________________")
        pdf.set_xy(x + 3, y + 21)
        pdf.cell(0, 5, "How they will support my accountability: _________________________________________________________")
        pdf.set_xy(x, y + 28)
        pdf.ln(2)

    pdf.ln(3)

    # SECTION V: Daily Accountability Habits
    pdf.section_heading("SECTION V: Daily Accountability Habits")

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 6, "1. What is ONE accountability habit you will practice every day starting this week?")
    pdf.write_lines(2)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, "2. How will you remind yourself to practice this habit? (alarm, note, partner check-in, etc.)")
    pdf.write_lines(2)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, "3. How will you know if this habit is working? What will be different in 30 days?")
    pdf.write_lines(2)

    pdf.ln(2)

    # SECTION VI: My Accountability Commitment
    pdf.set_fill_color(*GREEN_BG)
    x = pdf.get_x()
    y = pdf.get_y()
    box_h = 58
    pdf.cell(0, box_h, "", fill=True, border=1)

    # Accent bar
    pdf.set_fill_color(*GREEN)
    pdf.rect(x, y, 3, box_h, "F")

    pdf.set_xy(x + 6, y + 3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 6, "SECTION VI: My Accountability Commitment")
    pdf.ln(2)

    pdf.set_xy(x + 6, y + 11)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(178, 5,
        "Write your personal accountability commitment in your own words. Make it specific to your "
        "goals and the habits you want to build."
    )

    # Writing lines inside the box
    pdf.set_draw_color(*LIGHT_GRAY)
    for line_i in range(3):
        line_y = y + 24 + (line_i * 7)
        pdf.line(x + 6, line_y, x + 184, line_y)

    # Signature line
    pdf.set_xy(x + 6, y + 47)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 5, "Signature: ____________________________________________     Date: ______________________")

    path = os.path.join(RESOURCES, "Handout_5_Career_Planning.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


if __name__ == "__main__":
    generate_handout_5()
