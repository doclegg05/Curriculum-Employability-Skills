"""Generate updated Handouts #1 and #2 with aligned habit lists."""
import os
from fpdf import FPDF

BASE_DIR = os.path.dirname(__file__)
RESOURCES = os.path.join(BASE_DIR, "Handouts")
os.makedirs(RESOURCES, exist_ok=True)
LOGO_PATH = os.path.join(BASE_DIR, "Source Material", "SPOKES-Logo.png")

# Shared constants
BLUE = (45, 109, 181)
GREEN = (76, 184, 72)
DARK = (30, 74, 125)
GRAY = (90, 106, 122)
MUTED_BG = (238, 244, 250)
WHITE = (255, 255, 255)
LIGHT_GRAY = (220, 220, 220)

# The 7 aligned habits used across both handouts
HABITS = [
    ("Persisting", "Sticking with a task even when it gets hard; trying new strategies when the first approach doesn't work."),
    ("Managing Impulsivity", "Pausing to think before acting or speaking; considering consequences before making decisions."),
    ("Listening with Understanding & Empathy", "Paying attention to others' ideas and feelings before responding; seeking to understand different perspectives."),
    ("Thinking Flexibly", "Considering multiple viewpoints; adapting when plans change or fail; being open to new approaches."),
    ("Striving for Accuracy", "Checking work carefully; setting high standards; taking pride in quality and attention to detail."),
    ("Taking Responsible Risks", "Trying new things thoughtfully, even when uncertain; stepping outside your comfort zone to grow."),
    ("Remaining Open to Continuous Learning", "Reflecting on experiences, seeking feedback, and actively working to improve over time."),
]


class HandoutPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def header_block(self, title, handout_num):
        # Blue header bar
        self.set_fill_color(*BLUE)
        self.rect(0, 0, 210, 28, "F")
        # SPOKES logo centered with white background
        if os.path.exists(LOGO_PATH):
            logo_h = 18
            logo_w = logo_h * (800 / 532)
            logo_x = (210 - logo_w) / 2
            pad = 2
            self.set_fill_color(*WHITE)
            self.rect(logo_x - pad, 5 - pad, logo_w + pad * 2, logo_h + pad * 2, "F")
            self.image(LOGO_PATH, x=logo_x, y=5, h=logo_h)
        # Title
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*WHITE)
        self.set_xy(10, 6)
        self.cell(0, 8, "Employee Accountability", align="L")
        # Handout number
        self.set_font("Helvetica", "", 10)
        self.set_xy(10, 15)
        self.cell(0, 8, f"Handout #{handout_num}", align="L")
        # Subtitle on right
        self.set_font("Helvetica", "B", 14)
        self.set_xy(-80, 8)
        self.cell(70, 10, title, align="R")
        self.ln(22)

    def name_date_row(self):
        self.set_y(32)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.cell(95, 8, "Name: _________________________________________", border=0)
        self.cell(95, 8, "Date: ______________________", border=0, align="R")
        self.ln(12)

    def section_heading(self, text):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*BLUE)
        self.set_fill_color(*MUTED_BG)
        self.cell(0, 9, f"  {text}", fill=True, border=0)
        self.ln(11)

    def directions_text(self, text):
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*GRAY)
        self.multi_cell(0, 5, text)
        self.ln(3)

    def write_line(self, label, length_mm=170):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        x = self.get_x()
        y = self.get_y()
        self.cell(0, 7, label)
        self.line(x, y + 7, x + length_mm, y + 7)
        self.ln(10)


def generate_handout_1():
    pdf = HandoutPDF()
    pdf.add_page()
    pdf.header_block("Habits of Mind", 1)
    pdf.name_date_row()

    pdf.directions_text(
        "Directions: Review the Habits of Mind below. For each habit, think about how it "
        "connects to accountability. Then write a brief example of a time you demonstrated "
        "(or could demonstrate) this habit at work, school, or home."
    )

    # Table header
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    col_w = [42, 62, 86]
    headers = ["Habit of Mind", "What It Looks Like", "My Example (work, school, or home)"]
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 8, f" {h}", border=1, fill=True, align="L")
    pdf.ln()

    # Table rows
    pdf.set_text_color(*DARK)
    for i, (habit, desc) in enumerate(HABITS):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)

        x = pdf.get_x()
        y = pdf.get_y()
        row_h = 22

        # Habit name
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_xy(x, y)
        pdf.cell(col_w[0], row_h, "", border=1, fill=True)
        pdf.set_xy(x + 1, y + 2)
        pdf.multi_cell(col_w[0] - 2, 4.5, habit, align="L")

        # Description
        pdf.set_font("Helvetica", "", 8)
        pdf.set_xy(x + col_w[0], y)
        pdf.cell(col_w[1], row_h, "", border=1, fill=True)
        pdf.set_xy(x + col_w[0] + 1, y + 2)
        pdf.multi_cell(col_w[1] - 2, 4, desc, align="L")

        # Example (blank for writing)
        pdf.set_xy(x + col_w[0] + col_w[1], y)
        pdf.cell(col_w[2], row_h, "", border=1, fill=True)

        pdf.set_xy(x, y + row_h)

    pdf.ln(6)

    # Connection box
    pdf.set_fill_color(*MUTED_BG)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*BLUE)
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.cell(0, 18, "", fill=True, border=1)
    pdf.set_xy(x + 3, y + 2)
    pdf.cell(0, 5, "Connection to Accountability:")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.set_xy(x + 3, y + 8)
    pdf.multi_cell(184, 4.5,
        "Habits of Mind help people make thoughtful choices, take responsibility for outcomes, "
        "and learn from every experience. People who practice these habits don't blame others "
        "-- they reflect, correct, and improve."
    )

    path = os.path.join(RESOURCES, "Handout_1_Habits_of_Mind.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def generate_handout_2():
    pdf = HandoutPDF()
    pdf.add_page()
    pdf.header_block("Self-Reflection", 2)
    pdf.name_date_row()

    pdf.directions_text(
        "Directions: Rate how often you demonstrate each Habit of Mind using the scale below. "
        "Be honest with yourself -- this is for your own growth, not a grade."
    )

    # Rating scale box
    pdf.set_fill_color(*MUTED_BG)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*BLUE)
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.cell(0, 8, "", fill=True, border=0)
    pdf.set_xy(x + 3, y + 1)
    pdf.cell(0, 6, "Rating Scale:   1 = Rarely     2 = Sometimes     3 = Often     4 = Usually     5 = Almost Always")
    pdf.ln(10)

    # Rating table header
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    col_w = [38, 92, 12, 12, 12, 12, 12]  # habit, description, 1-5 ratings -- total 190mm
    pdf.cell(col_w[0], 8, " Habit of Mind", border=1, fill=True)
    pdf.cell(col_w[1], 8, " Description", border=1, fill=True)
    for n in ["1", "2", "3", "4", "5"]:
        # Narrower rating columns
        pdf.cell(col_w[2] if n == "1" else col_w[2], 8, n, border=1, fill=True, align="C")
    pdf.ln()

    # Rating rows
    pdf.set_text_color(*DARK)
    for i, (habit, desc) in enumerate(HABITS):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)

        x = pdf.get_x()
        y = pdf.get_y()
        row_h = 16

        # Habit name
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_xy(x, y)
        pdf.cell(col_w[0], row_h, "", border=1, fill=True)
        pdf.set_xy(x + 1, y + 2)
        pdf.multi_cell(col_w[0] - 2, 4, habit, align="L")

        # Description (shortened)
        short_desc = desc.split(";")[0] + "."
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_xy(x + col_w[0], y)
        pdf.cell(col_w[1], row_h, "", border=1, fill=True)
        pdf.set_xy(x + col_w[0] + 1, y + 2)
        pdf.multi_cell(col_w[1] - 2, 3.8, short_desc, align="L")

        # Rating boxes (1-5)
        offset = col_w[0] + col_w[1]
        for j in range(5):
            pdf.set_xy(x + offset + j * col_w[2], y)
            pdf.cell(col_w[2], row_h, "", border=1, fill=True, align="C")

        pdf.set_xy(x, y + row_h)

    pdf.ln(8)

    # Reflection Questions
    pdf.section_heading("Reflection Questions")

    questions = [
        "1. Which Habit of Mind is your greatest strength? Give a specific example from work, school, or home:",
        "2. Which Habit of Mind do you most need to develop? What is one step you will take to improve it?",
        "3. How do your Habits of Mind affect your accountability at work or school? Give an example:",
    ]

    for q in questions:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(0, 5, q)
        # Blank lines for writing
        pdf.set_draw_color(*LIGHT_GRAY)
        for _ in range(4):
            pdf.ln(6)
            pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
        pdf.ln(4)

    path = os.path.join(RESOURCES, "Handout_2_Self_Reflection.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


if __name__ == "__main__":
    generate_handout_1()
    generate_handout_2()
