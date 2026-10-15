from pathlib import Path

from fpdf import FPDF


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "lesson-controlling-anger"
OUT = LESSON / "Handouts" / "SPOKES Controlling Anger Module Lesson Plan Template 2026.pdf"
LOGO = ROOT / "SPOKES-Logo.png"

BLUE = (0, 123, 175)
DARK_BLUE = (0, 64, 113)
GREEN = (55, 181, 80)
LIGHT_BLUE = (231, 242, 247)
BORDER = (175, 190, 200)
TEXT = (34, 34, 34)


def clean(text):
    return text.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')


class SpokesLessonPlan(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="Letter")
        self.set_auto_page_break(auto=True, margin=16)
        self.set_margins(16, 14, 16)
        self.add_font("ui", "", "C:/Windows/Fonts/segoeui.ttf")
        self.add_font("ui", "B", "C:/Windows/Fonts/segoeuib.ttf")
        self.add_font("ui", "I", "C:/Windows/Fonts/segoeuii.ttf")

    def body_page(self):
        self.add_page()
        self.set_font("ui", "", 10)
        self.set_text_color(*TEXT)

    def cover(self):
        self.add_page()
        self.set_fill_color(*BLUE)
        self.rect(144, 0, 34, 279, "F")
        self.set_draw_color(*BLUE)
        self.set_line_width(0.6)
        self.rect(12, 82, 132, 23)
        self.set_fill_color(*BLUE)
        self.rect(15, 85, 126, 17, "F")
        self.set_font("ui", "B", 14)
        self.set_text_color(255, 255, 255)
        self.set_xy(15, 88)
        self.cell(126, 9, "Controlling Anger", align="C")
        self.image(str(LOGO), 23, 130, 75)
        self.set_font("ui", "", 8)
        self.set_text_color(85, 85, 85)
        self.set_xy(16, 28)
        self.multi_cell(
            80,
            4,
            "Personal Qualities\nInterpersonal Skills\nTechnology Use\nSystems Thinking\nInformation Use",
            align="C",
        )

    def copyright_page(self):
        self.body_page()
        self.set_xy(18, 36)
        self.set_font("ui", "B", 10)
        self.cell(0, 5, "COPYRIGHT 2026")
        self.ln(12)
        self.set_font("ui", "", 10)
        self.multi_cell(
            178,
            5,
            clean(
                "All rights reserved worldwide under International and Pan-American copyright agreements. "
                "No part of this document can be reproduced, stored in a retrieval system, or transmitted "
                "in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise "
                "without the prior written permission of WV Adult Basic Education."
            ),
        )
        self.ln(8)
        self.cell(0, 5, "Courseware Version: 1.0 and subsequent updates")
        self.set_y(236)
        self.set_font("ui", "", 10)
        self.cell(0, 5, "Goal Setting", align="C")

    def title_page(self):
        self.body_page()
        self.set_y(124)
        self.set_font("ui", "B", 10)
        self.cell(0, 6, "Controlling Anger Module", align="C")

    def page_num(self, num):
        self.set_xy(16, 12)
        self.set_font("ui", "", 10)
        self.set_text_color(*TEXT)
        self.cell(8, 5, str(num))
        self.set_y(24)

    def section_bar(self, title):
        if self.get_y() > 244:
            self.body_page()
        self.set_fill_color(*BLUE)
        self.set_text_color(255, 255, 255)
        self.set_font("ui", "B", 9)
        self.cell(0, 7, title, align="C", fill=True)
        self.ln(8)
        self.set_text_color(*TEXT)

    def label(self, title):
        self.set_x(self.l_margin)
        self.set_font("ui", "B", 9)
        self.set_text_color(*TEXT)
        self.multi_cell(0, 4.6, title)
        self.set_font("ui", "", 9)

    def para(self, text, h=4.6):
        self.set_x(self.l_margin)
        self.set_font("ui", "", 9)
        self.set_text_color(*TEXT)
        self.multi_cell(0, h, clean(text))

    def bullets(self, items, h=4.6):
        self.set_x(self.l_margin)
        self.set_font("ui", "", 9)
        for item in items:
            self.set_x(self.l_margin)
            self.multi_cell(0, h, clean(f"- {item}"))

    def estimate(self, width, text, h=4.2, bold=False):
        self.set_font("ui", "B" if bold else "", 8.2)
        return self.multi_cell(width, h, clean(text), dry_run=True, output="HEIGHT")

    def row(self, cells, widths, fills=None, h=4.2):
        fills = fills or [False] * len(cells)
        heights = [self.estimate(widths[i] - 3, cells[i], h=h, bold=i == 0) for i in range(len(cells))]
        row_h = max(8, max(heights) + 3)
        if self.get_y() + row_h > 260:
            self.body_page()
        x = self.l_margin
        y = self.get_y()
        for i, text in enumerate(cells):
            if fills[i]:
                self.set_fill_color(*LIGHT_BLUE)
                self.rect(x, y, widths[i], row_h, "F")
            self.set_draw_color(*BORDER)
            self.rect(x, y, widths[i], row_h)
            self.set_xy(x + 1.5, y + 1.5)
            self.set_font("ui", "B" if i == 0 else "", 8.2)
            self.set_text_color(*TEXT)
            self.multi_cell(widths[i] - 3, h, clean(text))
            x += widths[i]
        self.set_y(y + row_h)

    def header_row(self, labels, widths):
        self.set_fill_color(*BLUE)
        self.set_text_color(255, 255, 255)
        self.set_font("ui", "B", 8.5)
        for label, width in zip(labels, widths):
            self.cell(width, 7, label, border=1, align="C", fill=True)
        self.ln(7)
        self.set_text_color(*TEXT)


def build():
    pdf = SpokesLessonPlan()
    pdf.cover()
    pdf.copyright_page()
    pdf.title_page()

    # Page 1
    pdf.body_page()
    pdf.page_num(1)
    pdf.section_bar("LESSON BASICS")
    pdf.label("Lesson Topic")
    pdf.para("Anger Management")
    pdf.ln(2)
    pdf.label("Standards (CCRS, GED Standard, Employability Skills Framework)")
    pdf.bullets([
        "AK.CTS: Reasons",
        "AK.CTS: Thinks Critically",
        "ER.IS: Understands Teamwork and Works with Others",
        "ER.IS: Negotiates to Resolve Conflict",
        "ER.IS: Respects Individual Differences",
        "WS.CS: Communicates Verbally",
    ])
    pdf.ln(2)
    pdf.label("Objectives (Audience Behavior Condition Degree)")
    pdf.para("Learners will participate in discussions and activities about controlling anger:")
    pdf.bullets([
        "Recognize ways they express and manage anger.",
        "Explain the difference between healthy and unhealthy anger.",
        "Identify personal anger triggers and warning signs.",
        "Identify emotions beneath anger using the Anger Iceberg model.",
        "Practice communication strategies that support healthy anger expression.",
        "Select anger-management tools to use at work, school, and in daily life.",
    ])
    pdf.ln(2)
    pdf.label("Assessment")
    pdf.para(
        "Teacher observation and learner completion of activities. Complete the Controlling Anger Rubric for each learner. "
        "The built-in Jeopardy review game, Styles of Anger Assessment, class discussions, and final reflection are used "
        "to check understanding and application."
    )
    pdf.ln(3)
    pdf.section_bar("LESSON MATERIALS")
    pdf.label("Handouts Needed")
    pdf.bullets([
        "Controlling Anger Rubric",
        "Healthy Anger Worksheet",
        "Role Play: Healthy Anger",
        "Anger Iceberg Template",
        "Anger Iceberg Directions",
        "Speak Listen Activity Directions",
        "Anger Management Toolbox",
        "Styles of Anger Assessment",
    ])
    pdf.ln(2)
    pdf.label("Online Resources")
    pdf.bullets([
        "HTML lesson: lesson-controlling-anger/index.html",
        "JeopardyLabs backup: https://jeopardylabs.com/play/anger-management1",
        "Local videos and captions embedded in the HTML lesson",
    ])
    pdf.ln(2)
    pdf.label("Other Materials or Equipment")
    pdf.bullets([
        "Computer, projector, or smart board",
        "Printed handouts or learner devices",
        "Whiteboard or flipchart and markers",
        "Pens or pencils",
    ])

    # Activity Plan pages
    pdf.body_page()
    pdf.page_num(2)
    pdf.section_bar("ACTIVITY PLAN")
    widths = [31, 111, 40]
    pdf.header_row(["Time", "Activity", "Materials"], widths)
    rows = [
        (
            "Warm-up\n10-15 minutes",
            "Print and/or review the rubric with learners. The rubric outlines what areas/objectives learners will cover.\n\n"
            "Introduce the topic and explain that anger is a normal emotion, but how we respond to anger affects relationships, work, and safety.\n\n"
            "Use Slides 1-3. Play the Rage on a Plane video and ask learners to name common anger triggers at work, at home, or in daily life.",
            "Controlling Anger Rubric\nSlides 1-3\nVideo: Rage on a Plane",
        ),
        (
            "Introduction\n20 minutes",
            "Use Slides 4-7 to distinguish healthy anger from unhealthy anger. Emphasize that healthy anger can protect boundaries and motivate change, while unhealthy anger can damage trust and decision-making.\n\n"
            "Distribute the Healthy Anger Worksheet. If time allows, use the Role Play: Healthy Anger handout to let pairs practice assertive language.",
            "Slides 4-7\nHealthy Anger Worksheet\nRole Play: Healthy Anger",
        ),
        (
            "Presentation\n30 minutes",
            "Use Slides 8-13 to introduce the Anger Iceberg. Explain that anger is often the visible emotion, while fear, hurt, shame, grief, and frustration may be beneath the surface.\n\n"
            "Distribute the Anger Iceberg Template and Directions. Play the Iceberg Theory video, then ask learners to identify what might be beneath anger in a realistic workplace situation.",
            "Slides 8-13\nAnger Iceberg Template\nIceberg Directions\nVideo: Iceberg Theory of Anger",
        ),
    ]
    for r in rows:
        pdf.row(r, widths)

    pdf.body_page()
    pdf.page_num(3)
    pdf.section_bar("ACTIVITY PLAN")
    pdf.header_row(["Time", "Activity", "Materials"], widths)
    rows = [
        (
            "Presentation\n30 minutes",
            "Use Slides 14-18 to teach strategies for managing anger. Review Embrace, Express, and Work Through as a practical sequence.\n\n"
            "Have learners identify personal warning signs and triggers. Play the Anger Thermometer video and discuss how early warning signs can help a person choose a better response.",
            "Slides 14-18\nAnger Management Toolbox\nVideo: Anger Thermometer",
        ),
        (
            "Practice\n35-45 minutes",
            "Use Slides 19-24 for hands-on practice. Complete the Pair & Share: Speak and Listen activity. Learners practice I-statements, listening without interrupting, and reflecting back what they heard.\n\n"
            "Use the Controlling Anger Choice Wheel and Anger Management Toolbox to identify strategies learners can use in real situations. Play the Holding Onto Anger video and debrief the quote.",
            "Slides 19-24\nSpeak Listen Directions\nAnger Management Toolbox\nVideo: Holding Onto Anger",
        ),
        (
            "Evaluation\n20-30 minutes",
            "Use Slides 25-26. Learners participate in the Jeopardy Review Game individually, in teams, or as a whole class. If the embedded game is unavailable, use the JeopardyLabs backup link.\n\n"
            "Use responses and participation as evidence for rubric scoring.",
            "Slides 25-26\nJeopardy review\nCourse Rubric",
        ),
    ]
    for r in rows:
        pdf.row(r, widths)

    pdf.body_page()
    pdf.page_num(4)
    pdf.section_bar("ACTIVITY PLAN")
    pdf.header_row(["Time", "Activity", "Materials"], widths)
    rows = [
        (
            "Application\n20-25 minutes",
            "Use Slides 27-30. Distribute the Styles of Anger Assessment and allow learners time to complete it. Ask learners to identify their anger style and one strategy they can use the next time they feel angry.\n\n"
            "Learners complete the final reflection and share one commitment about how they will handle anger differently going forward. Complete individual rubrics.",
            "Slides 27-30\nStyles of Anger Assessment\nCourse Rubric",
        ),
        (
            "Wrap-Up\n5-10 minutes",
            "Review key takeaways: anger is normal; warning signs matter; anger often has deeper causes; communication and coping strategies can protect relationships and careers.\n\n"
            "Closing message: Choose peace. Choose growth.",
            "Closing slide\nLearner reflections",
        ),
    ]
    for r in rows:
        pdf.row(r, widths)

    pdf.ln(8)
    pdf.section_bar("Other Resources or Alternative Resources")
    pdf.bullets([
        "JeopardyLabs backup review game: https://jeopardylabs.com/play/anger-management1",
        "Optional PowerPoint deck: Teacher-Resources/Controlling Anger 2026 Presentation.pptx",
        "Use the embedded local videos in the HTML lesson before relying on external video links.",
        "For learners who prefer not to share personal experiences, provide workplace scenarios and allow written responses.",
    ])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Created {OUT}")


if __name__ == "__main__":
    build()
