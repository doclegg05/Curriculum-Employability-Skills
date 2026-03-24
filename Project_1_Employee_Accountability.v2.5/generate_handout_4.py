"""Generate updated Handout #4: SMART Goal Worksheet with worked example."""
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
EXAMPLE_BG = (245, 250, 255)
ORANGE = (217, 119, 6)


class SmartPDF(FPDF):
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
        self.cell(0, 6, "Handout #4: SMART Goal Worksheet", align="L")
        self.set_xy(-65, 8)
        self.set_font("Helvetica", "B", 11)
        self.cell(55, 7, "SMART Goals", align="R")
        self.set_y(26)

    def name_date_row(self):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.cell(95, 8, "Name: _________________________________________")
        self.cell(95, 8, "Date: ______________________", align="R")
        self.ln(10)


def generate_handout_4():
    pdf = SmartPDF()

    # ===== PAGE 1: SMART Framework + Worked Example =====
    pdf.add_page()
    pdf.header_block()
    pdf.name_date_row()

    # Directions
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 5,
        "Directions: Use the SMART framework to create a meaningful accountability goal. "
        "Review the example below, then write your own SMART goal on the next page."
    )
    pdf.ln(3)

    # SMART framework reference
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*BLUE)
    pdf.set_fill_color(*MUTED_BG)
    pdf.cell(0, 8, "  What Makes a Goal SMART?", fill=True)
    pdf.ln(10)

    smart_items = [
        ("S", "Specific", "What exactly will I do? (clear, detailed action)"),
        ("M", "Measurable", "How will I track progress? (numbers, milestones, evidence)"),
        ("A", "Achievable", "Is this realistic for me right now? (within my control)"),
        ("R", "Relevant", "Why does this matter? (connects to my growth or career)"),
        ("T", "Time-bound", "What is my deadline? (specific date or timeframe)"),
    ]

    for letter, word, question in smart_items:
        x = pdf.get_x()
        y = pdf.get_y()
        # Letter circle
        pdf.set_fill_color(*BLUE)
        pdf.set_text_color(*WHITE)
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_xy(x + 2, y)
        pdf.cell(10, 8, letter, fill=True, align="C")
        # Word
        pdf.set_text_color(*DARK)
        pdf.set_xy(x + 15, y)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(30, 8, word)
        # Question
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*GRAY)
        pdf.set_xy(x + 47, y)
        pdf.cell(0, 8, question)
        pdf.ln(10)

    pdf.ln(3)

    # ===== WORKED EXAMPLE =====
    pdf.set_fill_color(*ORANGE)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "  Worked Example: Building an Accountability Goal", fill=True)
    pdf.ln(10)

    # Example box - draw background and accent line first, then fill content
    x = pdf.get_x()
    y = pdf.get_y()
    label_col = 24  # width for the label column
    text_col = 160  # width for the text column
    box_w = 190
    left_pad = 5

    example_parts = [
        ("Scenario:", "Jamal works as a warehouse associate. He has been late to work 3 times this month and received a verbal warning from his supervisor."),
        ("Specific:", "I will arrive at work at least 10 minutes before my shift starts every day."),
        ("Measurable:", "I will track my arrival time in a phone log; my goal is zero late arrivals this month."),
        ("Achievable:", "I will set two alarms and prep my clothes/lunch the night before."),
        ("Relevant:", "Being on time builds trust with my supervisor and keeps me eligible for the lead position opening next quarter."),
        ("Time-bound:", "I will achieve 30 consecutive days of on-time arrivals by March 15."),
    ]

    complete_goal = (
        "COMPLETE GOAL: \"I will arrive at work 10 minutes early every day for 30 "
        "consecutive days by March 15, tracking my arrival in a phone log, so that I "
        "rebuild trust with my supervisor and position myself for the warehouse lead opening.\""
    )

    # Pre-calculate box height by measuring content
    # Each entry: label on left, text wraps on right within (box_w - left_pad - label_col - 4)
    text_w = box_w - left_pad - label_col - 4
    line_h = 4.2
    entry_gap = 1.5
    total_h = 4  # top padding
    for label, text in example_parts:
        pdf.set_font("Helvetica", "", 8.5)
        # Estimate lines: approximate chars per line
        n_lines = max(1, len(pdf.multi_cell(text_w, line_h, text, dry_run=True, output="LINES")))
        total_h += n_lines * line_h + entry_gap
    # Add complete goal height
    pdf.set_font("Helvetica", "B", 8.5)
    n_lines = max(1, len(pdf.multi_cell(box_w - left_pad - 4, line_h, complete_goal, dry_run=True, output="LINES")))
    total_h += 3 + n_lines * line_h + 4  # gap + content + bottom padding

    box_h = total_h

    # Draw box background
    pdf.set_fill_color(*EXAMPLE_BG)
    pdf.rect(x, y, box_w, box_h, "DF")

    # Draw accent line on the left
    pdf.set_draw_color(*ORANGE)
    pdf.set_line_width(0.8)
    pdf.line(x + 1.5, y + 1, x + 1.5, y + box_h - 1)
    pdf.set_line_width(0.2)
    pdf.set_draw_color(0, 0, 0)

    # Fill in content
    cur_y = y + 4
    for label, text in example_parts:
        # Label
        pdf.set_xy(x + left_pad, cur_y)
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.set_text_color(*BLUE)
        pdf.cell(label_col, line_h, label)

        # Text value
        pdf.set_xy(x + left_pad + label_col, cur_y)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(text_w, line_h, text)
        cur_y = pdf.get_y() + entry_gap

    # Complete goal statement
    cur_y += 2
    pdf.set_xy(x + left_pad, cur_y)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(box_w - left_pad - 4, line_h, complete_goal)

    pdf.set_xy(x, y + box_h)
    pdf.ln(5)

    # Weak vs Strong comparison
    pdf.set_fill_color(*MUTED_BG)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*BLUE)
    pdf.cell(0, 7, "  Common Mistakes vs. SMART Goals", fill=True)
    pdf.ln(9)

    comparisons = [
        ("I'll try to be better at work.", "I will complete all assigned tasks by their deadline for the next 2 weeks."),
        ("I need to communicate more.", "I will give my supervisor a progress update every Friday at 3 PM for the next month."),
        ("I want to be more reliable.", "I will respond to all work emails within 4 hours during business hours for 30 days."),
    ]

    # Table header
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    pdf.cell(95, 7, "  Weak Goal (Vague)", border=1, fill=True)
    pdf.cell(95, 7, "  SMART Goal (Specific & Measurable)", border=1, fill=True)
    pdf.ln()

    pdf.set_text_color(*DARK)
    for i, (weak, strong) in enumerate(comparisons):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        row_y = pdf.get_y()
        row_x = pdf.get_x()

        # Weak goal column
        pdf.set_font("Helvetica", "I", 8)
        pdf.cell(95, 12, "", border=1, fill=True)
        pdf.set_xy(row_x + 2, row_y + 1)
        pdf.multi_cell(91, 4, weak)

        # Strong goal column
        pdf.set_xy(row_x + 95, row_y)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(95, 12, "", border=1, fill=True)
        pdf.set_xy(row_x + 97, row_y + 1)
        pdf.multi_cell(91, 4, strong)

        pdf.set_xy(row_x, row_y + 12)

    # ===== PAGE 2: Build Your Own =====
    pdf.add_page()
    pdf.header_block()

    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 9, "  Build Your SMART Accountability Goal", fill=True)
    pdf.ln(12)

    build_items = [
        ("SPECIFIC", "What exactly will I do? Be as detailed as possible:"),
        ("MEASURABLE", "How will I measure or track my progress?"),
        ("ACHIEVABLE", "What makes this realistic for me? What resources or support do I need?"),
        ("RELEVANT", "Why is this goal important to my career, education, or personal growth?"),
        ("TIME-BOUND", "What is my target completion date?"),
    ]

    for label, prompt in build_items:
        pdf.set_fill_color(*MUTED_BG)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*BLUE)
        pdf.cell(0, 7, f"  {label} -- {prompt}", fill=True)
        pdf.ln(2)
        # Writing lines
        pdf.set_draw_color(*LIGHT_GRAY)
        for _ in range(3):
            pdf.ln(6)
            pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
        pdf.ln(6)

    # Complete goal statement box
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, "  MY COMPLETE GOAL STATEMENT:", fill=True)
    pdf.ln(2)
    pdf.set_draw_color(*BLUE)
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.rect(x, y, 190, 22, "D")
    pdf.set_xy(x, y + 22)
    pdf.ln(4)

    # ===== PAGE 3: Action Steps & Accountability Plan =====
    pdf.add_page()
    pdf.header_block()

    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "  Action Steps & Accountability Plan", fill=True)
    pdf.ln(10)

    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 4.5,
        "Break your SMART goal into small, manageable action steps. Set a target date and check off when completed."
    )
    pdf.ln(2)

    # Action Steps table
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    col_w = [10, 112, 36, 32]
    headers = ["#", "Action Step", "Target Date", "Completed?"]
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 7, f" {h}", border=1, fill=True)
    pdf.ln()

    pdf.set_text_color(*DARK)
    for i in range(4):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(col_w[0], 12, f" {i+1}.", border=1, fill=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(col_w[1], 12, "", border=1, fill=True)
        pdf.cell(col_w[2], 12, "", border=1, fill=True)
        pdf.cell(col_w[3], 12, "", border=1, fill=True, align="C")
        pdf.ln()

    pdf.ln(4)

    # Planning for Obstacles
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*BLUE)
    pdf.set_fill_color(*MUTED_BG)
    pdf.cell(0, 7, "  Planning for Obstacles", fill=True)
    pdf.ln(8)

    pdf.set_font("Helvetica", "I", 8.5)
    pdf.set_text_color(*GRAY)
    pdf.cell(0, 5, "Think about what might get in your way and how you will handle it.")
    pdf.ln(6)

    # Obstacle table
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    pdf.cell(95, 7, " Potential Obstacle", border=1, fill=True)
    pdf.cell(95, 7, " My Plan to Overcome It", border=1, fill=True)
    pdf.ln()

    pdf.set_text_color(*DARK)
    for i in range(2):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        pdf.cell(95, 14, "", border=1, fill=True)
        pdf.cell(95, 14, "", border=1, fill=True)
        pdf.ln()

    pdf.ln(4)

    # Accountability Support
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*BLUE)
    pdf.set_fill_color(*MUTED_BG)
    pdf.cell(0, 7, "  Accountability Support Network", fill=True)
    pdf.ln(8)

    pdf.set_font("Helvetica", "I", 8.5)
    pdf.set_text_color(*GRAY)
    pdf.cell(0, 5, "Who will help hold you accountable? Choose people you trust who will be honest with you.")
    pdf.ln(6)

    for i in range(2):
        bg = MUTED_BG if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.cell(0, 16, "", fill=True, border=1)
        pdf.set_xy(x + 3, y + 2)
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 5, f"Person {i+1}: ________________________________    Relationship: ________________________________")
        pdf.set_xy(x + 3, y + 9)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.cell(0, 5, "How they will help: ___________________________________________________________________________")
        pdf.set_xy(x, y + 16)
        pdf.ln(1)

    # Commitment signature
    pdf.ln(3)
    pdf.set_fill_color(*MUTED_BG)
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.cell(0, 18, "", fill=True, border=1)
    pdf.set_xy(x + 3, y + 2)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*BLUE)
    pdf.cell(0, 5, "My Commitment")
    pdf.set_xy(x + 3, y + 8)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 5, "I commit to following through on this SMART goal and holding myself accountable for my progress.")
    pdf.set_xy(x + 3, y + 14)
    pdf.cell(0, 4, "Signature: ____________________________________________     Date: ______________________")

    path = os.path.join(RESOURCES, "Handout_4_SMART_Goal_Fillable.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


if __name__ == "__main__":
    generate_handout_4()
