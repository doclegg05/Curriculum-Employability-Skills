"""
Generate merged Teacher's Guides for all 3 SPOKES lessons.
Combines the Teachers Guide PDF format with Presenter Notes content.
Each PDF is themed to match its corresponding HTML presentation.
"""
from fpdf import FPDF
import os

LOGO = "C:/Users/Instructor/Dev/Employability Skills Curriculum/SPOKES-Logo.png"

# ── Theme definitions matching each HTML lesson ──────────────────────

THEME_ACCOUNTABILITY = dict(
    primary=(0, 123, 175),       # #007baf
    accent=(55, 181, 80),        # #37b550
    dark=(0, 64, 113),           # #004071
    gold=(211, 178, 87),         # #d3b257
    gray=(96, 99, 107),          # #60636b
    light=(237, 243, 247),       # #edf3f7
    mauve=(167, 37, 63),         # #a7253f
    text=(51, 51, 51),
    white=(255, 255, 255),
    cover_grad_top=(0, 64, 113),
    cover_grad_bot=(0, 19, 63),
    accent_line=(55, 181, 80),   # green accent stripe
    badge_w=(55, 181, 80),       # green
    badge_i=(0, 123, 175),       # blue
    badge_p=(0, 64, 113),        # dark
    badge_e=(167, 37, 63),       # mauve
    badge_a=(211, 178, 87),      # gold
)

THEME_TIME = dict(
    primary=(0, 123, 175),
    accent=(55, 181, 80),
    dark=(0, 64, 113),
    gold=(211, 178, 87),
    gray=(96, 99, 107),
    light=(237, 243, 247),
    mauve=(167, 37, 63),
    text=(51, 51, 51),
    white=(255, 255, 255),
    cover_grad_top=(0, 64, 113),
    cover_grad_bot=(0, 40, 90),
    accent_line=(211, 178, 87),  # gold accent stripe
    badge_w=(55, 181, 80),
    badge_i=(0, 123, 175),
    badge_p=(0, 64, 113),
    badge_e=(167, 37, 63),
    badge_a=(211, 178, 87),
)

THEME_INTERVIEW = dict(
    primary=(0, 123, 175),
    accent=(55, 181, 80),
    dark=(0, 19, 63),            # #00133f royal navy
    gold=(211, 178, 87),
    gray=(96, 99, 107),
    light=(237, 243, 247),
    mauve=(167, 37, 63),         # prominent in this theme
    text=(51, 51, 51),
    white=(255, 255, 255),
    cover_grad_top=(0, 19, 63),  # royal
    cover_grad_bot=(167, 37, 63),# mauve gradient
    accent_line=(167, 37, 63),   # mauve accent stripe
    badge_w=(55, 181, 80),
    badge_i=(0, 123, 175),
    badge_p=(0, 19, 63),         # royal dark
    badge_e=(211, 178, 87),      # gold (matches HTML)
    badge_a=(0, 123, 175),
)


class TeachersGuidePDF(FPDF):

    def __init__(self, title, subtitle, theme):
        super().__init__()
        self._title = title
        self._subtitle = subtitle
        self.t = theme  # shortcut to theme dict
        self.set_auto_page_break(auto=True, margin=18)
        self.set_top_margin(18)   # leave room for header
        self.set_left_margin(10)
        self.set_right_margin(10)
        self.add_font("ui", "", "C:/Windows/Fonts/segoeui.ttf")
        self.add_font("ui", "B", "C:/Windows/Fonts/segoeuib.ttf")
        self.add_font("ui", "I", "C:/Windows/Fonts/segoeuii.ttf")
        self.add_font("ui", "BI", "C:/Windows/Fonts/segoeuiz.ttf")

    def _badge_color(self, letter):
        key = f"badge_{letter.lower()}"
        return self.t.get(key, self.t["dark"])

    def header(self):
        if self.page_no() <= 1:
            return
        # Row 1: Logo (10mm wide, ~6.6mm tall) with text to its right, vertically centered
        logo_w = 10
        logo_h = logo_w * 532 / 800  # maintain aspect ratio = 6.65mm
        logo_y = 4
        self.image(LOGO, 10, logo_y, logo_w)
        # Text vertically centered with logo
        text_y = logo_y + (logo_h / 2) - 1.5
        self.set_xy(22, text_y)
        self.set_font("ui", "I", 7)
        self.set_text_color(*self.t["gray"])
        self.cell(88, 3, f"SPOKES {self._title} -- Teacher's Guide", align="L")
        self.cell(88, 3, f"(c) 2026 WV Adult Basic Education  |  Page {self.page_no()}", align="R")
        # Separator line with generous clearance below logo
        line_y = logo_y + logo_h + 2
        self.set_draw_color(*self.t["primary"])
        self.set_line_width(0.5)
        self.line(10, line_y, 200, line_y)
        # Reset cursor below header for body content
        self.set_xy(10, line_y + 3)

    def footer(self):
        if self.page_no() <= 1:
            return
        self.set_y(-10)
        self.set_draw_color(*self.t["accent_line"])
        self.set_line_width(0.2)
        self.line(10, self.get_y(), 200, self.get_y())

    # ── Cover page ──
    def cover_page(self):
        self.add_page()
        self.alias_nb_pages()
        # Gradient-style cover block (simulated with two rects)
        self.set_fill_color(*self.t["cover_grad_top"])
        self.rect(0, 0, 210, 55, "F")
        self.set_fill_color(*self.t["cover_grad_bot"])
        self.rect(0, 55, 210, 50, "F")
        # Accent stripe
        self.set_fill_color(*self.t["accent_line"])
        self.rect(0, 105, 210, 2.5, "F")
        # Logo centered on cover
        self.image(LOGO, 72, 8, 66)
        # Title text below logo
        self.set_y(50)
        self.set_font("ui", "B", 28)
        self.set_text_color(*self.t["white"])
        self.multi_cell(0, 13, self._title, align="C")
        self.ln(1)
        self.set_font("ui", "", 13)
        self.set_text_color(200, 215, 230)
        self.multi_cell(0, 7, self._subtitle, align="C")
        # Below the accent stripe
        self.set_y(116)
        self.set_font("ui", "B", 20)
        self.set_text_color(*self.t["dark"])
        self.cell(0, 10, "Teacher's Guide", align="C")
        self.ln(9)
        self.set_font("ui", "", 11)
        self.set_text_color(*self.t["gray"])
        self.cell(0, 6, "Instructor Speaking Notes, Discussion Prompts & Slide Guide", align="C")
        self.ln(4)
        self.set_font("ui", "I", 10)
        self.set_text_color(*self.t["gold"])
        self.cell(0, 6, "WIPPEA Lesson Format", align="C")
        self.ln(14)
        # Description box
        self.set_fill_color(*self.t["light"])
        self.set_draw_color(*self.t["primary"])
        y = self.get_y()
        self.rect(20, y, 170, 42, "DF")
        self.set_xy(25, y + 5)
        self.set_font("ui", "", 10)
        self.set_text_color(*self.t["text"])
        self.multi_cell(160, 5.5, (
            "This guide walks you through every slide in sequence with speaking notes, "
            "discussion prompts to spark class conversation, teaching tips, handout "
            "references showing when to distribute materials, and a printable checklist "
            "of everything you need before class."
        ))
        # Footer
        self.set_y(230)
        self.set_font("ui", "", 9)
        self.set_text_color(*self.t["gray"])
        self.cell(0, 5, "(c) 2026 WV Adult Basic Education", align="C")
        self.ln(4)
        self.cell(0, 5, "Strategic Planning in Occupational Knowledge for Employment and Success", align="C")

    # ── Table of contents ──
    def toc(self, chapters):
        self.add_page()
        self.set_font("ui", "B", 16)
        self.set_text_color(*self.t["dark"])
        self.cell(0, 10, "Table of Contents")
        self.ln(12)
        for badge, title, slides in chapters:
            y = self.get_y()
            # Badge with WIPPEA-specific color
            self.set_fill_color(*self._badge_color(badge))
            self.rect(15, y, 14, 8, "F")
            self.set_xy(15, y)
            self.set_font("ui", "B", 9)
            self.set_text_color(*self.t["white"])
            self.cell(14, 8, badge, align="C")
            # Title
            self.set_xy(33, y)
            self.set_font("ui", "B", 11)
            self.set_text_color(*self.t["dark"])
            self.cell(100, 8, title)
            # Slide range
            self.set_font("ui", "", 10)
            self.set_text_color(*self.t["gray"])
            self.cell(0, 8, slides, align="R")
            self.ln(12)
        # Checklist note
        self.ln(6)
        self.set_draw_color(*self.t["gold"])
        self.set_fill_color(255, 250, 230)
        y = self.get_y()
        self.rect(15, y, 180, 14, "DF")
        self.set_xy(20, y + 4)
        self.set_font("ui", "B", 10)
        self.set_text_color(*self.t["gold"])
        self.cell(0, 6, "Printable Resources Checklist -- See the final page")

    # ── Chapter heading ──
    def chapter_head(self, badge, title, wippea_label):
        self.add_page()
        top = 18  # clear the header area
        # Banner with theme dark color
        self.set_fill_color(*self.t["dark"])
        self.rect(0, top, 210, 20, "F")
        # Accent stripe under banner
        self.set_fill_color(*self.t["accent_line"])
        self.rect(0, top + 20, 210, 1.5, "F")
        # Badge with WIPPEA color
        bc = self._badge_color(badge)
        self.set_fill_color(*bc)
        self.rect(14, top + 1, 18, 18, "F")
        self.set_xy(14, top + 3)
        self.set_font("ui", "B", 13)
        self.set_text_color(*self.t["white"])
        self.cell(18, 14, badge, align="C")
        # Chapter title
        self.set_xy(37, top + 3)
        self.set_font("ui", "B", 14)
        self.set_text_color(*self.t["white"])
        self.cell(0, 14, title)
        # WIPPEA label below banner
        self.set_y(top + 24)
        self.set_font("ui", "I", 9)
        self.set_text_color(*self.t["gold"])
        self.cell(0, 6, wippea_label, align="L")
        self.ln(8)

    # ── Page break helpers ──
    @property
    def _page_bottom(self):
        """Usable bottom y in mm (above footer/margin)."""
        return self.h - self.b_margin

    def _fits(self, needed_mm):
        """True if needed_mm of content fits on the current page."""
        return self.get_y() + needed_mm <= self._page_bottom

    def _ensure_space(self, needed_mm):
        """Break to next page if needed_mm won't fit."""
        if not self._fits(needed_mm):
            self.add_page()

    def _estimate_box(self, text, width=165, line_h=5):
        """Estimate height of a boxed text block."""
        self.set_font("ui", "", 9)
        # Use fpdf2 multi_cell dry-run to count lines
        n_lines = max(1, len(text) / (width * 0.48) + 1)
        return 12 + n_lines * line_h

    # ── Slide entry ──
    def slide_entry(self, num, title, slide_type=""):
        # A slide heading needs room for itself (~16mm) plus at least
        # the "Speaking Notes:" label and 2 lines of text (~25mm)
        self._ensure_space(40)
        self.ln(3)
        # Thin accent line above each slide
        self.set_draw_color(*self.t["light"])
        self.set_line_width(0.2)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(3)
        self.set_font("ui", "B", 11)
        self.set_text_color(*self.t["dark"])
        txt = f"SLIDE {num}"
        self.cell(self.get_string_width(txt), 6, txt)
        self.set_font("ui", "", 11)
        self.set_text_color(*self.t["gray"])
        self.cell(5, 6, " -- ")
        self.set_font("ui", "B", 11)
        self.set_text_color(*self.t["primary"])
        self.cell(0, 6, title)
        if slide_type:
            self.set_font("ui", "I", 9)
            self.set_text_color(*self.t["gray"])
            self.ln(6)
            self.cell(0, 5, f"  {slide_type}")
        self.ln(7)

    # ── Speaking notes ──
    def speaking_notes(self, text):
        # Ensure the label + at least 3 lines stay together (~25mm)
        self._ensure_space(25)
        self.set_font("ui", "B", 10)
        self.set_text_color(*self.t["dark"])
        self.cell(0, 5, "Speaking Notes:")
        self.ln(5)
        self.set_font("ui", "", 10)
        self.set_text_color(*self.t["text"])
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    # ── Discussion prompt ──
    def discussion(self, text):
        h = self._estimate_box(text)
        self._ensure_space(h)
        y = self.get_y()
        self.set_draw_color(*self.t["accent"])
        self.set_fill_color(240, 255, 240)
        self.rect(15, y, 180, h, "DF")
        self.set_xy(20, y + 3)
        self.set_font("ui", "B", 9)
        self.set_text_color(*self.t["accent"])
        self.cell(0, 5, ">> DISCUSSION PROMPT")
        self.set_xy(20, y + 9)
        self.set_font("ui", "I", 9)
        self.set_text_color(40, 80, 40)
        self.multi_cell(165, 5, text)
        self.set_y(max(self.get_y() + 2, y + h + 3))

    # ── Teaching tip ──
    def tip(self, text):
        h = self._estimate_box(text)
        self._ensure_space(h)
        y = self.get_y()
        self.set_draw_color(*self.t["gold"])
        self.set_fill_color(255, 250, 230)
        self.rect(15, y, 180, h, "DF")
        self.set_xy(20, y + 3)
        self.set_font("ui", "B", 9)
        self.set_text_color(*self.t["gold"])
        self.cell(0, 5, "* TEACHING TIP")
        self.set_xy(20, y + 9)
        self.set_font("ui", "", 9)
        self.set_text_color(100, 80, 40)
        self.multi_cell(165, 5, text)
        self.set_y(max(self.get_y() + 2, y + h + 3))

    # ── Materials callout ──
    def materials(self, text):
        h = self._estimate_box(text, width=140)
        self._ensure_space(h)
        y = self.get_y()
        self.set_draw_color(*self.t["primary"])
        self.set_fill_color(230, 242, 250)
        self.rect(15, y, 180, h, "DF")
        self.set_xy(20, y + 3)
        self.set_font("ui", "B", 9)
        self.set_text_color(*self.t["primary"])
        self.cell(0, 5, "[HANDOUT]")
        self.set_xy(55, y + 3)
        self.set_font("ui", "", 9)
        self.set_text_color(*self.t["gray"])
        self.multi_cell(140, 5, text)
        self.set_y(max(self.get_y() + 2, y + h + 3))

    # ── Video callout ──
    def video(self, title):
        self._ensure_space(12)
        self.set_font("ui", "B", 9)
        self.set_text_color(*self.t["primary"])
        self.cell(0, 5, f"[VIDEO] {title}")
        self.ln(6)

    # ── Checklist page ──
    def checklist(self, items):
        self.add_page()
        self.set_font("ui", "B", 16)
        self.set_text_color(*self.t["dark"])
        self.cell(0, 10, "Materials Checklist")
        self.ln(12)
        self.set_font("ui", "I", 10)
        self.set_text_color(*self.t["gray"])
        self.cell(0, 6, "Print Before Class")
        self.ln(12)
        # Table header
        self.set_fill_color(*self.t["dark"])
        self.set_font("ui", "B", 9)
        self.set_text_color(*self.t["white"])
        self.cell(10, 8, "", fill=True)
        self.cell(85, 8, "  Resource", fill=True)
        self.cell(95, 8, "  Location", fill=True)
        self.ln(8)
        # Rows
        alt = False
        for resource, filename in items:
            if alt:
                self.set_fill_color(*self.t["light"])
            else:
                self.set_fill_color(*self.t["white"])
            self.set_font("ui", "", 9)
            self.set_text_color(*self.t["text"])
            self.cell(10, 7, "  [ ]", fill=True)
            self.cell(85, 7, f"  {resource}", fill=True)
            self.set_font("ui", "I", 8)
            self.set_text_color(*self.t["gray"])
            self.cell(95, 7, f"  {filename}", fill=True)
            self.ln(7)
            alt = not alt
        self.ln(6)
        self.set_font("ui", "I", 9)
        self.set_text_color(*self.t["gray"])
        self.multi_cell(0, 5, "Note: All resources are available in the Handouts folder and linked in the presentation sidebar under Resources.")


# =====================================================================
# LESSON 1: EMPLOYEE ACCOUNTABILITY
# =====================================================================
def build_accountability_guide():
    pdf = TeachersGuidePDF("Employee Accountability", "Taking Ownership for Career Success", THEME_ACCOUNTABILITY)
    pdf.cover_page()
    pdf.toc([
        ("W", "Chapter 1: Warm-Up", "Slides 1-4"),
        ("I", "Chapter 2: What Is Accountability?", "Slides 5-8"),
        ("P", "Chapter 3: Habits of Mind", "Slides 9-13"),
        ("P", "Chapter 4: The 5 Cs Framework", "Slides 14-15"),
        ("P", "Chapter 5: 6 Principles", "Slides 16-17"),
        ("P", "Chapter 6: Victim vs. Accountable", "Slides 18-20"),
        ("P", "Chapter 7: Workplace Application", "Slides 21-26"),
        ("E", "Chapter 8: SMART Goals", "Slides 27-28"),
        ("A", "Chapter 9: Key Takeaways & Closing", "Slides 29-30"),
    ])

    # ── Chapter 1: Warm-Up ──
    pdf.chapter_head("W", "CHAPTER 1: WARM-UP", "WARM-UP")

    pdf.slide_entry(1, "Title Slide")
    pdf.speaking_notes("Welcome students and introduce the topic: Employee Accountability -- Taking Ownership for Career Success. Set the tone by explaining that accountability is one of the most valued traits employers look for.")
    pdf.tip("Start with a personal anecdote. Share a brief story about a time accountability mattered in your own work experience. This builds rapport and models the vulnerability you'll ask of students.")

    pdf.slide_entry(2, "Essential Questions")
    pdf.speaking_notes("Three essential questions frame the lesson:\n1. Are you accountable for your actions?\n2. How do your Habits of Mind influence your accountability?\n3. How do I move from victim thinking to accountable thinking?\n\nRead these aloud and tell students these questions will be revisited throughout the lesson.")
    pdf.discussion("Before diving in, ask: 'Without overthinking it, raise your hand if you consider yourself an accountable person.' Then ask: 'What does being accountable actually mean to you?' Accept a few quick responses.")

    pdf.slide_entry(3, "Learning Objectives")
    pdf.speaking_notes("Five learning objectives are displayed. Walk through them so students know what to expect:\n1. Define employee accountability and explain its importance\n2. Identify Habits of Mind that support accountability\n3. Explain benefits and recognize common barriers\n4. Analyze workplace scenarios for accountability behaviors\n5. Reflect on personal accountability and create a SMART goal action plan")

    pdf.slide_entry(4, "Opening Statement", "Big Statement")
    pdf.speaking_notes("'Are you accountable for your actions?' This bold question sets the reflective tone. Pause and let students sit with it.")
    pdf.discussion("Ask students to think silently for 30 seconds: 'Think of one time in the past week when you had to take ownership of something -- at home, at work, or at school. Hold that memory.'")

    # ── Chapter 2: What Is Accountability? ──
    pdf.chapter_head("I", "CHAPTER 2: WHAT IS ACCOUNTABILITY?", "INTRODUCTION")

    pdf.slide_entry(5, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Let's start with the basics -- what does accountability actually mean, and why is it different from responsibility?'")

    pdf.slide_entry(6, "Responsibility vs. Accountability")
    pdf.speaking_notes("This is a foundational distinction:\n- RESPONSIBILITY = Assigned (tasks given to you)\n- ACCOUNTABILITY = Ownership (owning the outcome)\n\nExplain that responsibility is what your boss hands you; accountability is what you do with it. You can be responsible for a task and still not be accountable -- for example, if you blame others when it goes wrong.")
    pdf.discussion("Ask: 'Can someone give me an example where a person was responsible for something but NOT accountable?' Then: 'What would accountability have looked like in that situation?'")

    pdf.slide_entry(7, "No Excuses. No Blame. Solutions.", "Big Statement")
    pdf.speaking_notes("This three-word philosophy captures the accountability mindset. Accountable people don't waste energy on excuses or blame -- they channel it into finding solutions.")

    pdf.slide_entry(8, "Why Accountability Matters")
    pdf.speaking_notes("Four benefit cards: Trust (builds credibility), Professionalism (demonstrates maturity), Opportunity (leads to promotions), Growth (enables continuous improvement).\n\nFor Trust, explain that people rely on those who follow through. For Professionalism, note that handling mistakes well actually impresses employers more than never making mistakes. For Opportunity, share that employers notice and reward accountability.")
    pdf.discussion("Ask: 'How does someone's accountability -- or lack of it -- affect trust and teamwork in a workplace? Can you think of an example where being reliable helped you earn a new opportunity?'")

    # ── Chapter 3: Habits of Mind ──
    pdf.chapter_head("P", "CHAPTER 3: HABITS OF MIND", "PRESENTATION")

    pdf.slide_entry(9, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now that we know WHAT accountability is, let's talk about HOW we think -- because the way we think determines how we act.'")

    pdf.slide_entry(10, "Framework Quote & Context")
    pdf.speaking_notes("Featured quote from Arthur Costa & Bena Kallick: 'What keeps us from being accountable isn't just what we do -- it's how we think.' Explain the Habits of Mind framework: these are not specific skills but patterns of thinking that help people approach problems and make decisions. They are learned behaviors, not personality traits.")
    pdf.materials("Distribute Handout 1: Habits of Mind Worksheet now. Students will reference this as you walk through the habits.")
    pdf.discussion("Ask: 'What do you think keeps people from being accountable at work? Is it laziness? Not caring? Or is it something about how they think and react?'")

    pdf.slide_entry(11, "Self-Reflection Introduction")
    pdf.speaking_notes("Introduce the self-reflection activity. Students rate themselves on several Habits of Mind using a 1-5 scale. Emphasize this is personal and honest -- there are no right or wrong answers. They will be invited but NOT required to share. Give students 5-7 minutes to complete.")
    pdf.materials("Distribute Handout 2: Self-Reflection Worksheet now. Walk around to answer questions but respect privacy.")

    pdf.slide_entry("12-13", "Key Habits of Mind (Two Slides)")
    pdf.speaking_notes("Slide 12: Persisting, Managing Impulsivity, Listening with Empathy, Thinking Flexibly.\nSlide 13: Striving for Accuracy, Taking Responsible Risks, Continuous Learning.\n\nFor each habit, give a quick real-world workplace example. For 'Managing Impulsivity': 'This is the person who takes a breath before replying to a frustrating email.' For 'Persisting': 'The employee who keeps trying different approaches rather than giving up.'")
    pdf.discussion("Ask: 'Looking at your self-reflection worksheet, which habit did you rate yourself highest on? Which one do you want to work on?'")
    pdf.tip("Close by reinforcing: 'People who practice these habits don't blame others -- they reflect, correct, and improve.'")

    # ── Chapter 4: The 5 Cs ──
    pdf.chapter_head("P", "CHAPTER 4: THE 5 CS FRAMEWORK", "PRESENTATION")

    pdf.slide_entry(14, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now let's look at a framework organizations use to build accountability into workplace culture -- The 5 Cs.'")

    pdf.slide_entry(15, "The 5 Cs -- Interactive Flip Cards")
    pdf.speaking_notes("Interactive flip cards students hover over:\n1. CLARITY -- Set clear goals so everyone knows what success looks like\n2. COMMITMENT -- Be genuinely invested and follow through\n3. COMMUNICATION -- Share expectations and feedback openly\n4. COLLABORATION -- Work together and share accountability\n5. CONSEQUENCES -- Actions have outcomes; follow-through matters\n\nFor Clarity, stress that confusion about expectations is the biggest barrier. For Consequences, clarify that they aren't just negative -- recognition reinforces accountability too.")
    pdf.discussion("Ask: 'Which of the 5 Cs is the hardest to practice? Think about a job or class you've been in -- which C was missing, and how did it affect the group?'")

    # ── Chapter 5: 6 Principles ──
    pdf.chapter_head("P", "CHAPTER 5: 6 PRINCIPLES OF PERSONAL ACCOUNTABILITY", "PRESENTATION")

    pdf.slide_entry(16, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'The 5 Cs are about organizational culture. Now let's get personal -- here are 6 principles YOU can practice every day.'")

    pdf.slide_entry(17, "The 6 Principles")
    pdf.speaking_notes("1. Practice Optimism -- Frame mistakes as learning opportunities, not failures.\n2. Practice Self-Awareness -- See things as they really are; avoid blind spots.\n3. Own Your Actions -- Take responsibility instead of playing victim.\n4. Be Solution-Oriented -- Think creatively; ask for help when needed.\n5. Change the Narrative -- Create a new path forward using facts, skills, and resources.\n6. Supercharge Leadership -- Accept responsibility for your output.")
    pdf.discussion("Ask: 'Which of these 6 principles resonates most with you right now? How could practicing just ONE of these change something in your current situation?'")

    # ── Chapter 6: Victim vs. Accountable ──
    pdf.chapter_head("P", "CHAPTER 6: VICTIM VS. ACCOUNTABLE MINDSET", "PRESENTATION")

    pdf.slide_entry(18, "Section Divider", "Section Title")
    pdf.speaking_notes("This is one of the most impactful sections. Say: 'We all face difficult situations. The difference is in how we respond.'")

    pdf.slide_entry(19, "Two Roads Comparison")
    pdf.speaking_notes("Side-by-side comparison:\nVICTIM ROAD: Ignore, deny, blame, rationalize, resist, hide.\nACCOUNTABLE ROAD: Recognize and own it, forgive, self-examine, learn, act on solutions, grow.\n\nRead through both columns slowly. Emphasize that the victim road feels easier but leads nowhere, while the accountable road takes courage but leads to growth.")
    pdf.discussion("Ask: 'Be honest -- have you ever caught yourself on the victim road? What happened? What would the accountable road have looked like?' Normalize this by sharing that everyone slips into victim thinking sometimes.")

    pdf.slide_entry(20, "Key Reflective Question", "Big Statement")
    pdf.speaking_notes("'Accountable people ask: NOT \"how do I avoid it?\" BUT \"how fast can I get through it?\"' Avoidance is the hallmark of victim thinking; accountable people face challenges head-on.")

    # ── Chapter 7: Workplace Application ──
    pdf.chapter_head("P", "CHAPTER 7: WORKPLACE APPLICATION", "PRESENTATION")

    pdf.slide_entry(21, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now let's apply everything we've learned to real workplace situations.'")

    pdf.slide_entry(22, "Three Areas of Accountability")
    pdf.speaking_notes("Three cards: Area A (Actions & Choices -- communication, time, behavior, attitude); Area B (Responsibilities -- punctuality, calls, cleanliness, duties); Area C (Goals -- career, financial, health, education).\n\nPoint out that accountability isn't just big dramatic moments -- it's in everyday small choices. Being on time is accountability.")
    pdf.discussion("Ask: 'Which area are you strongest in? Which needs the most work? Give me a specific example.'")

    pdf.slide_entry(23, "Workplace Scenarios Introduction", "Big Statement")
    pdf.speaking_notes("'Let's look at two examples from the workplace.' This transitions to the core practice exercise.")
    pdf.materials("Distribute Handout 3: Workplace Scenarios v2 now. Contains both Maria and Annette scenarios with discussion questions. Teacher version with answer keys is in your lesson plan.")
    pdf.tip("Have students read Scenario 1A (Maria) first. List examples of strong accountability on the board. THEN distribute Scenario 1B (Annette) for weak accountability. Doing them separately creates stronger contrast.")

    pdf.slide_entry(24, "Maria -- Strong Accountability (Healthcare)")
    pdf.speaking_notes("Maria's five accountability behaviors: verified medication discrepancy, documented the call, helped unsteady resident, immediately reported her own mistake, helped a newer nurse. Highlight that Maria didn't try to hide her mistake -- she reported it immediately. That's the hardest form of accountability.")

    pdf.slide_entry(25, "Annette -- Weak Accountability (Healthcare)")
    pdf.speaking_notes("Annette's victim behaviors: ignored alert, didn't document, blamed the CNA, became defensive, complained about understaffing. Point out how each behavior maps to the 'Victim Road' from Slide 19.")

    pdf.slide_entry(26, "Scenario Reflection Prompt")
    pdf.speaking_notes("'What Habits of Mind did Maria demonstrate that Annette did not?' This ties scenarios back to the Habits of Mind framework.")
    pdf.discussion("Expected connections: Maria showed Persisting, Managing Impulsivity, Listening with Empathy. Annette lacked Thinking Flexibly, Striving for Accuracy. Ask: 'What could Annette do differently?' List responses on the board.")

    # ── Chapter 8: SMART Goals ──
    pdf.chapter_head("E", "CHAPTER 8: SMART GOALS", "EVALUATION")

    pdf.slide_entry(27, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now it's your turn. You're going to create a personal accountability goal using the SMART framework.'")

    pdf.slide_entry(28, "SMART Goals Framework")
    pdf.speaking_notes("S-Specific, M-Measurable, A-Achievable, R-Relevant, T-Time-bound.\n\nGive a concrete example: 'I will arrive 10 minutes early to work every day for the next 30 days' is SMART. 'I'll be more punctual' is not. Give students 10-15 minutes to complete.")
    pdf.materials("Distribute Handout 4: SMART Goal Worksheet. Students define one meaningful goal for the next 3-6 months including action steps, timeline, obstacles, and accountability partner.")
    pdf.discussion("After completion, invite 2-3 volunteers to share. Offer feedback: 'Is it specific enough? How will you measure it? What's your deadline?'")

    # ── Chapter 9: Closing ──
    pdf.chapter_head("A", "CHAPTER 9: KEY TAKEAWAYS & CLOSING", "APPLICATION")

    pdf.slide_entry(29, "Key Takeaways")
    pdf.speaking_notes("Six summary takeaways:\n1. Accountability is a choice -- own outcomes, not blame\n2. Habits of Mind shape behavior -- think before you act\n3. The 5 Cs create the framework -- clarity to consequences\n4. Move from victim to accountable -- recognize, learn, act\n5. SMART goals track progress -- be specific and time-bound\n6. Accountability = success -- trust, credibility, opportunity")
    pdf.materials("Distribute Handout 5: Career Planning Worksheet as a take-home activity. Students identify occupations of interest, skills to develop, and create a personal action plan.")
    pdf.tip("Consider using Handout 5 as a bridge to a future lesson. Ask students to bring their completed worksheet to the next class session.")

    pdf.slide_entry(30, "Closing Slide")
    pdf.speaking_notes("Quote: 'When you're personally accountable, you take ownership of what happens as a result of your choices and actions.' Call to action: 'Own Your Success.' Thank students for their participation.")
    pdf.discussion("Final round: 'In one sentence, what is one thing you're going to do differently starting today?' Go around the room.")

    # ── Checklist ──
    pdf.checklist([
        ("Habits of Mind Worksheet", "Handouts folder"),
        ("Self-Reflection Worksheet", "Handouts folder"),
        ("Workplace Scenarios v2", "Handouts folder"),
        ("SMART Goal Worksheet", "Handouts folder"),
        ("Career Planning Worksheet", "Handouts folder"),
        ("Rubric", "Handouts folder"),
        ("Lesson Plan", "Handouts folder"),
    ])

    out = "C:/Users/Instructor/Dev/Employability Skills Curriculum/lesson-employee-accountability/resources/Employee_Accountability_Teachers_Guide.pdf"
    pdf.output(out)
    print(f"Created: {out}")


# =====================================================================
# LESSON 2: TIME MANAGEMENT
# =====================================================================
def build_time_management_guide():
    pdf = TeachersGuidePDF("Time Management", "Maximizing Productivity & Achieving Goals", THEME_TIME)
    pdf.cover_page()
    pdf.toc([
        ("W", "Chapter 1: Warm-Up", "Slides 1-2"),
        ("I", "Chapter 2: Introduction", "Slides 3-6"),
        ("P", "Chapter 3: Setting Priorities", "Slides 7-11"),
        ("P", "Chapter 4: Tools & Strategies", "Slides 12-18"),
        ("P", "Chapter 5: Common Challenges", "Slides 19-30"),
        ("E", "Chapter 6: Evaluation", "Slides 31-34"),
        ("A", "Chapter 7: Application", "Slides 35-37"),
    ])

    # ── Chapter 1 ──
    pdf.chapter_head("W", "CHAPTER 1: WARM-UP", "WARM-UP")

    pdf.slide_entry(1, "Time Management", "Title Slide")
    pdf.speaking_notes("Welcome students. Print and/or review the rubric with the learners. The rubric outlines what areas/objectives learners will cover.")
    pdf.materials("Rubric -- review with learners or distribute.")

    pdf.slide_entry(2, "Self-Reflection")
    pdf.speaking_notes("Option 1 (Printable): Give each student the Time Management Self-Assessment Worksheet to reflect on strengths and weaknesses.\n\nOption 2 (Virtual): Direct students to the Psychology Today time management test. They do NOT need to log-in -- click 'no thanks' on the pop-up to see results. The five stars next to each area rate how well they did. Encourage learners to share what they found.")
    pdf.materials("Time Management Self-Assessment Worksheet")
    pdf.discussion("After completing the assessment, ask: 'What did you discover? Where do you excel? Where do you struggle? Would anyone like to share one strength and one area for growth?'")

    # ── Chapter 2 ──
    pdf.chapter_head("I", "CHAPTER 2: INTRODUCTION", "INTRODUCTION")

    pdf.slide_entry(3, "Module Objective", "Section Title")
    pdf.speaking_notes("Transition slide. Use it to set the purpose for the lesson.")

    pdf.slide_entry(4, "We All Have 24 Hours")
    pdf.speaking_notes("Time is a resource distributed equally to all people, but we each have different responsibilities, financial obligations, family sizes, and levels of support. The goal of this module is to motivate learners to accomplish day-to-day tasks using their time wisely to achieve long-range goals.")
    pdf.discussion("Ask: 'What makes time management harder for YOU specifically? What's your biggest time challenge right now?'")

    pdf.slide_entry(5, "Goal Statement", "Big Statement")
    pdf.speaking_notes("Emphasize the core goal: 'The goal of effective time management is to maximize productivity and achieve your goals.' Explain that being busy and being productive are not the same thing.")

    pdf.slide_entry(6, "What You Will Be Able to Do")
    pdf.speaking_notes("Four learning objectives:\n1. Understand time management and its importance at home and on the job\n2. Identify uncontrollable events and develop coping strategies\n3. Distinguish between urgent and important tasks\n4. Use practical tools and systems to accomplish day-to-day and long-range goals")

    # ── Chapter 3 ──
    pdf.chapter_head("P", "CHAPTER 3: SETTING PRIORITIES", "PRESENTATION")

    pdf.slide_entry(7, "Setting Priorities", "Section Title")
    pdf.speaking_notes("Transition into the priorities section.")

    pdf.slide_entry(8, "What Are Priorities?")
    pdf.speaking_notes("Priorities are things that are more important than others and need to be dealt with first. They establish the sequence in which things should be done.")
    pdf.discussion("Ask: 'What are your current top 3 priorities in life? How do you decide what comes first each day?'")

    pdf.slide_entry(9, "Watch: The Big Rocks of Time", "Video Slide")
    pdf.speaking_notes("Play the embedded video to introduce the Big Rocks concept. This sets up the worksheet activity on the next slide.")
    pdf.video("Covey's Big Rocks -- Scheduling Your Priorities")
    pdf.tip("A live demonstration with a physical jar, rocks, and sand is much more memorable than the video alone. Fill the jar with sand first to show nothing else fits, then start over with big rocks.")

    pdf.slide_entry(10, "The Big Rocks of Time")
    pdf.speaking_notes("If you fill your jar with sand first, there's no room for the big rocks. Put the big rocks in first -- your most important priorities -- then let smaller things fill around them.")
    pdf.materials("Big Rocks of Time Worksheet -- distribute for learners to identify their own priorities.")
    pdf.discussion("After the video and worksheet, ask: 'What are YOUR big rocks? What are the pebbles and sand that tend to fill up your jar first?'")

    pdf.slide_entry(11, "You've Identified Your Priorities...Now What?", "Big Statement")
    pdf.speaking_notes("Transition: Now you need a system to dedicate time to each priority.")

    # ── Chapter 4 ──
    pdf.chapter_head("P", "CHAPTER 4: TOOLS & STRATEGIES", "PRESENTATION")

    pdf.slide_entry(12, "Tools & Strategies", "Section Title")
    pdf.speaking_notes("Transition into the practical tools section.")

    pdf.slide_entry(13, "Set SMART Goals")
    pdf.speaking_notes("SMART goal-setting directly relates to effective time management. Writing down your goals increases your chances of achieving them, provides commitment, and improves focus. S-Specific, M-Measurable, A-Achievable, R-Relevant, T-Time-bound.")
    pdf.tip("Give a non-example first: 'I want to get healthier' -- not SMART. Then transform it: 'I will walk 20 minutes every morning for the next 4 weeks' -- SMART.")

    pdf.slide_entry(14, "Utilize a Flow Chart")
    pdf.speaking_notes("A flow chart helps make quick daily or weekly decisions about what to tackle next based on urgency and importance. It can be modified or customized for practical daily use.")
    pdf.materials("Get Your Priorities Straight Flow Chart")

    pdf.slide_entry(15, "The Eisenhower Matrix")
    pdf.speaking_notes("Four quadrants: Do First (Urgent + Important), Schedule (Not Urgent + Important), Delegate (Urgent + Not Important), Eliminate (Not Urgent + Not Important).\n\nTry the Eisenhower Matrix if you: find yourself putting out fires all day, are busy but don't feel high impact, have long-term goals but no energy, or have a hard time saying no.")
    pdf.discussion("Ask: 'Think about yesterday. What quadrant did you spend most time in? What task do you keep putting in Quadrant 1 that should have been scheduled in Quadrant 2?'")

    pdf.slide_entry(16, "Classify This Task", "Interactive Tabs")
    pdf.speaking_notes("Three interactive tabs with scenario examples:\n- Urgent Task (DO FIRST): Child has fever, bill due today, report due in one hour\n- Important Task (SCHEDULE): Meal planning, gym, GED work, job applications\n- Time Waster (ELIMINATE): Social media scrolling, extra TV episodes")
    pdf.discussion("Ask: 'What is something you did yesterday that might belong in the Eliminate quadrant?' Allow 2-3 volunteers to share without judgment.")

    pdf.slide_entry(17, "Daily & Weekly Planners")
    pdf.speaking_notes("Keeping activities in view ensures priority tasks get accomplished. It can also help you find free time you didn't know you had!")
    pdf.materials("Daily Planner and Weekly Planner templates")
    pdf.tip("Have students fill in tomorrow's daily planner right now as practice.")

    pdf.slide_entry(18, "Family To-Do Lists & Delegation")
    pdf.speaking_notes("Creating family to-do lists and delegating age-appropriate chores builds self-esteem, teaches life skills, and fosters teamwork. Frame delegation as a gift to your family, not a burden.")
    pdf.discussion("Ask: 'What chores do your kids do? What could you start delegating this week?'")

    # ── Chapter 5 ──
    pdf.chapter_head("P", "CHAPTER 5: COMMON CHALLENGES", "PRESENTATION")

    pdf.slide_entry(19, "Common Challenges", "Section Title")
    pdf.speaking_notes("Transition: Highlight common challenges to effective time management.")

    pdf.slide_entry(20, "Time Management Dangers", "Interactive Flip Cards")
    pdf.speaking_notes("Five dangers: Distractions, Procrastination, Multitasking, Over-Commitment, No Structure. Have learners click each flip card to explore.")

    pdf.slide_entry(21, "Technology Distractions")
    pdf.speaking_notes("Smartphones are designed to capture and hold your attention. Every notification is a deliberate interruption.")
    pdf.discussion("Group Activity: Each person counts notifications received on their phone today. Who has the most? What apps are sending them? What strategies will you use to stay focused? What could you turn off right now?")

    pdf.slide_entry(22, "Watch: Technology Distractions", "Video Slide")
    pdf.speaking_notes("Play the embedded video. After watching, include time for self-reflection on practical tips learners plan to use.")
    pdf.video("How Smartphones Sabotage Your Brain's Ability to Focus")

    pdf.slide_entry(23, "Procrastination")
    pdf.speaking_notes("Procrastination is the act of putting off something until later. The cycle: Procrastinate, Make excuses, Feel guilty, Panic, Repeat. The good news? It's a habit that can be broken!")
    pdf.discussion("Ask: 'What is one thing you have been putting off? What is the REAL reason you haven't started it yet?'")

    pdf.slide_entry(24, "Watch: Procrastination", "Video Slide")
    pdf.speaking_notes("Play the embedded video about breaking the procrastination cycle.")
    pdf.video("3 Steps to Break the Procrastination Cycle")

    pdf.slide_entry(25, "Multitasking")
    pdf.speaking_notes("Often seen as a strength, but science shows it leads to inefficiency, more mistakes, reduced creativity, and stress/burnout. Switching between tasks wastes mental energy.")

    pdf.slide_entry(26, "Watch: Multitasking", "Video Slide")
    pdf.speaking_notes("Play the embedded video on what multitasking does to the brain.")
    pdf.video("What Multitasking Does to Your Brain")

    pdf.slide_entry(27, "Over-Commitment")
    pdf.speaking_notes("The inability to say 'No' leads to spreading yourself too thin. Learning to set boundaries is a skill, not selfishness.")
    pdf.discussion("Ask learners to identify situations where they struggle with saying no. Practice together: 'I appreciate you thinking of me, but I can't commit right now.'")

    pdf.slide_entry(28, "Lack of Structure & Routine")
    pdf.speaking_notes("Without daily structure, time slips away. Small, consistent habits compound into big results. Strategies: Focus on one task at a time, learn something new for 20 minutes daily, create a 'digital sunset,' use a Weekly Reset Sunday routine.")
    pdf.tip("Additional resource: The free audiobook 'Make Your Bed' by Admiral William H. McRaven on YouTube.")

    pdf.slide_entry(29, "Watch: 10 Habits That Will Completely Change Your Life", "Video Slide")
    pdf.speaking_notes("Play the embedded video. Discuss how small, consistent habit changes compound into big improvements in time management over time.")
    pdf.video("10 Habits That Will Completely Change Your Life")

    pdf.slide_entry(30, "What Would You Do?", "Interactive Accordion")
    pdf.speaking_notes("Three expandable scenarios about managing unexpected free time:\n\n1. 'You have 2 unexpected free hours this afternoon' -- Before defaulting to scrolling, ask what's on your Big Rocks list. Use the Eisenhower Matrix to decide.\n\n2. 'You wake up 30 minutes earlier than expected' -- Don't check your phone first. Use the first 20 minutes for intention-setting and reviewing priorities.\n\n3. 'A task finishes faster than expected' -- Protect this found time before someone else claims it. Move to the next planner item or tackle 2-minute tasks.")
    pdf.discussion("After exploring the accordion, ask: 'What do you typically do when you get unexpected free time? Does it align with your priorities?'")

    # ── Chapter 6 ──
    pdf.chapter_head("E", "CHAPTER 6: EVALUATION", "EVALUATION")

    pdf.slide_entry(31, "Check Your Knowledge", "Section Title")
    pdf.speaking_notes("Transition into the evaluation section.")

    pdf.slide_entry(32, "Quick Check", "Interactive Checkpoint")
    pdf.speaking_notes("Multiple choice question: 'You need to prepare for next week's job interview. Which Eisenhower Matrix quadrant?' Correct answer: B -- Schedule It (important but not yet urgent). Use as discussion: 'What happens if you wait until the night before?'")

    pdf.slide_entry(33, "Assessment Debrief")
    pdf.speaking_notes("Four debrief questions: What did your score reveal? What surprised you? One thing to change this week (make it SMART)? Accountability partner?")
    pdf.materials("Pre/Post Test and Rubric")

    pdf.slide_entry(34, "Exit Ticket")
    pdf.speaking_notes("Three reflection questions:\n1. What did you learn today that you didn't know before?\n2. What tips or tools will you use to better manage your time?\n3. What is one thing you will change starting today?\n\nDistribute exit ticket slips or have students write on index cards. Provide opportunity for 2-3 volunteers to share aloud.")
    pdf.tip("Collect exit tickets to inform follow-up instruction.")

    # ── Chapter 7 ──
    pdf.chapter_head("A", "CHAPTER 7: APPLICATION", "APPLICATION")

    pdf.slide_entry(35, "Put It Into Practice", "Section Title")
    pdf.speaking_notes("Transition into the application section.")

    pdf.slide_entry(36, "How Will You Put Your TIME to Use?", "Round Robin")
    pdf.speaking_notes("Stand and Deliver activity. Each learner picks one question and writes it on a blank sheet. Papers pass to the right -- each person writes their response. Repeat until papers return. Each student reads summaries aloud.\n\nQuestions:\n1. What are the most important concepts you learned?\n2. How will you use this information in daily life or at work?\n3. What other steps can you take to learn more?\n4. With whom can you share what you've learned?\n5. What is one question you still have?")
    pdf.tip("If more than 5 students, put them in groups. Adjust to fit your class size. The key is every student both writes and reads.")

    pdf.slide_entry(37, "Own Your Time", "Closing")
    pdf.speaking_notes("Congratulate learners on completing the lesson. Quote: 'This is the beginning of a new day. You have been given this day to use as you will.' Encourage learners to own their time going forward.")
    pdf.discussion("Final round: 'In one word, describe how you feel about managing your time now compared to when we started.'")

    # ── Checklist ──
    pdf.checklist([
        ("Time Management Self-Assessment", "Handouts folder"),
        ("Big Rocks of Time Worksheet", "Handouts folder"),
        ("Get Your Priorities Straight Flow Chart", "Handouts folder"),
        ("Daily Planner", "Handouts folder"),
        ("Weekly Planner", "Handouts folder"),
        ("Pre/Post Test", "Handouts folder"),
        ("Rubric", "Handouts folder"),
        ("Lesson Plan", "Handouts folder"),
    ])

    out = "C:/Users/Instructor/Dev/Employability Skills Curriculum/lesson-time-management/Teacher-Resources/Time_Management_Teachers_Guide.pdf"
    pdf.output(out)
    print(f"Created: {out}")


# =====================================================================
# LESSON 3: INTERVIEW SKILLS
# =====================================================================
def build_interview_skills_guide():
    pdf = TeachersGuidePDF("Interview Skills", "Mastering Key Techniques to Secure Your Dream Job", THEME_INTERVIEW)
    pdf.cover_page()
    pdf.toc([
        ("W", "Chapter 1: Introduction & Warm-Up", "Slides 1-2"),
        ("I", "Chapter 2: Understanding Interviews", "Slides 3-7"),
        ("P", "Chapter 3: Preparing for Interviews", "Slides 8-11"),
        ("P", "Chapter 4: Professional Presentation", "Slides 12-17"),
        ("P", "Chapter 5: Interview Techniques", "Slides 18-25"),
        ("E", "Chapter 6: Evaluation", "Slides 26-27"),
        ("A", "Chapter 7: Application", "Slides 28-31"),
    ])

    # ── Chapter 1 ──
    pdf.chapter_head("W", "CHAPTER 1: INTRODUCTION & WARM-UP", "WARM-UP")

    pdf.slide_entry(1, "Title Slide")
    pdf.speaking_notes("Welcome students: 'By the end of today, you'll have practiced real interview techniques, answered tough questions using a proven framework, and built the confidence to walk into any interview prepared.'")

    pdf.slide_entry(2, "Sell an Object!", "Warm-Up Activity")
    pdf.speaking_notes("Students choose a classroom object and create a 60-second pitch highlighting creative uses and selling points. This mirrors interview dynamics -- both require quick thinking, clear communication, and persuasive reasoning.\n\nInstructions: Give 3-5 minutes to brainstorm individually or in pairs. Each person/group presents their 60-second pitch. Then discuss the connection to interviewing.")
    pdf.discussion("After pitches, ask: 'What made some pitches more convincing? What skills did you use -- creativity, confidence, clear communication? How does selling an object connect to selling yourself in an interview?'")
    pdf.tip("Scatter 8-10 interesting objects around the room before students arrive. The more mundane the better -- the challenge is making something ordinary sound extraordinary. Keep energy high and applaud every pitch.")

    # ── Chapter 2 ──
    pdf.chapter_head("I", "CHAPTER 2: UNDERSTANDING INTERVIEWS", "INTRODUCTION")

    pdf.slide_entry(3, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now that we're warmed up, let's break down what an interview actually is and why it matters.'")

    pdf.slide_entry(4, "What Is an Interview?")
    pdf.speaking_notes("An interview is a structured conversation to assess mutual fit, skills, and readiness. It is a two-way street -- the employer evaluates the candidate, but the candidate also evaluates the organization. Formats include in-person, phone, video, and panel. Emphasize the word 'mutual' -- this reframe reduces anxiety.")
    pdf.discussion("Ask: 'Has anyone been on a job interview before? What format was it? What was the hardest part?'")

    pdf.slide_entry(5, "Interviewing Is a Skill")
    pdf.speaking_notes("Interviewing improves with practice, like riding a bike. Practice enhances skill, preparation reduces anxiety, feedback refines approach, and simulating scenarios builds readiness. This is a critical mindset shift -- many students believe some people are 'naturally good' at interviews.")

    pdf.slide_entry(6, "The Interview Process -- 5 Phases")
    pdf.speaking_notes("Timeline: 1) Preparation (research, practice), 2) Beginning (greetings, tone), 3) Core Discussion (Q&A), 4) Closing (final questions, express interest), 5) Follow-Up (thank you, reflection).\n\nStudents often focus only on the middle. Preparation and follow-up are just as important and often overlooked.")

    pdf.slide_entry(7, "Inspirational Quote")
    pdf.speaking_notes("'Every interview is a chance to grow.' Even interviews that don't lead to offers are valuable practice.")

    # ── Chapter 3 ──
    pdf.chapter_head("P", "CHAPTER 3: PREPARING FOR INTERVIEWS", "PREPARING FOR INTERVIEWS")

    pdf.slide_entry(8, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Preparation is the foundation of a great interview.'")

    pdf.slide_entry(9, "Preparation Tips")
    pdf.speaking_notes("Four essentials: 1) Research the Employer (mission, culture, news), 2) Review the Job Description (align skills), 3) Practice Interview Questions (rehearse aloud), 4) Plan Attire & Arrival (professional, 10-15 min early). MOST interview anxiety comes from lack of preparation.")

    pdf.slide_entry(10, "Researching the Employer")
    pdf.speaking_notes("Three panels: Understand Company Overview, Learn Company Culture, Demonstrate Initiative. Show students HOW to research: company website, 'About' page, news articles, Glassdoor reviews. Knowing specific facts lets you tailor answers and shows genuine interest.")
    pdf.discussion("Activity: 'Pick a company you'd like to work for. In 3 minutes, find three facts using your phone. What's their mission? Products? Culture?' Have students share.")

    pdf.slide_entry(11, "Walk In Prepared", "Quote Slide")
    pdf.speaking_notes("'Walk in prepared. Walk out confident.' Brief pause to reinforce preparation message.")

    # ── Chapter 4 ──
    pdf.chapter_head("P", "CHAPTER 4: PROFESSIONAL PRESENTATION", "PROFESSIONAL PRESENTATION")

    pdf.slide_entry(12, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now let's talk about how you present yourself during the interview.'")

    pdf.slide_entry(13, "Dress for Success")
    pdf.speaking_notes("Appropriate attire shows professionalism and respect. Match company culture. Clean grooming and minimal accessories. 'Dress for the job you want, not the job you have.'\n\nBe sensitive -- some students may not have professional attire. Suggest thrift stores, community resources, or Dress for Success organizations. Clean and neat matters more than expensive.")
    pdf.discussion("Ask: 'What would you wear to a bank? A construction company? A restaurant? How would you find out what's appropriate?'")

    pdf.slide_entry(14, "Watch: What Should I Wear?", "Video Slide")
    pdf.speaking_notes("Play the embedded video. After watching, ask students what tips they'll remember.")
    pdf.video("What Should I Wear to a Job Interview?")

    pdf.slide_entry(15, "Body Language Matters")
    pdf.speaking_notes("'Your body speaks before you say a word.' Positive signals: Smile, eye contact, open gestures. Posture: Sit upright, lean slightly forward, nod. Avoid: Fidgeting, checking phone, crossing arms.")
    pdf.tip("Quick activity: Have students pair up and practice introducing themselves with a firm handshake, eye contact, and a smile. 30 seconds each direction.")

    pdf.slide_entry(16, "Watch: Body Language Tips", "Video Slide")
    pdf.speaking_notes("Play the embedded body language video.")
    pdf.video("7 Body Language Tips to Impress at Your Next Interview")

    pdf.slide_entry(17, "Basic Interview Tips")
    pdf.speaking_notes("Four tips: 1) Arrive early, be polite to everyone (receptionist too!), 2) Confident introduction with firm handshake, 3) Bring resume copies, notepad, pen, 4) Maintain eye contact, express enthusiasm. Many employers ask the receptionist about candidate behavior in the lobby.")

    # ── Chapter 5 ──
    pdf.chapter_head("P", "CHAPTER 5: INTERVIEW TECHNIQUES & FOLLOW-UP", "INTERVIEW TECHNIQUES")

    pdf.slide_entry(18, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition: 'Now for the heart of the lesson -- how to actually answer interview questions effectively.'")

    pdf.slide_entry(19, "The STAR Method")
    pdf.speaking_notes("S-Situation: Describe a specific event (not generalized). T-Task: Your role and what needed to be accomplished. A-Action: What YOU did (focus on you, not the team; use past tense). R-Result: The outcome and what you learned.\n\nWhy use it? Gives clear, focused answers showing problem-solving and decision-making.")
    pdf.tip("If the outcome was bad, tell students to point out what they LEARNED: 'What I learned is that in the future, I will [better approach].' Turning negatives into growth stories is powerful.")

    pdf.slide_entry(20, "STAR Example 1 -- Handling Stress")
    pdf.speaking_notes("Question: 'Tell me about a stressful situation.'\n(S-T) Worked five 12-hour shifts, asked to stay for urgent exams.\n(A) Agreed to stay, worked as team, prioritized critical exams.\n(R) Turned stressful situation manageable; patients well cared for.\n\nHighlight how specific and concrete this answer is.")

    pdf.slide_entry(21, "STAR Example 2 -- Upset Customer")
    pdf.speaking_notes("Question: 'Tell me about dealing with an upset customer.'\n(S-T) Nursing home: family complained room not cleaned in 2 days.\n(A) Reassured family, reported to supervisor, housekeeper assigned immediately.\n(R) Family pleased with quick response.\n\nHighlight: took initiative, communicated up the chain, achieved positive resolution.")
    pdf.discussion("Ask: 'Can someone give an example of a stressful situation they've faced? Let's walk through it using STAR together.' Coach one student live so the class can see how it works.")

    pdf.slide_entry(22, "STAR Method Practice", "Worksheet Activity")
    pdf.speaking_notes("Students practice STAR on four scenarios: 1) Challenging customer, 2) Coworker conflict, 3) Decision reflection, 4) Colleague's mistake. Give 15-20 minutes. Walk around to provide support. Remind them: specific examples, past tense.")
    pdf.materials("STAR Interview Worksheet: 'Shine Bright with STAR Interviews!'")

    pdf.slide_entry(23, "Questions to Ask the Interviewer")
    pdf.speaking_notes("Five questions, with #5 starred as a must-ask:\n1. Characteristics of best-suited person?\n2. Advancement opportunities?\n3. Who does well here and who doesn't?\n4. Any reservations about my fit I can address?\n5. [MUST ASK] When will you decide and how will I be notified?\n\nQuestion #4 is bold but powerful -- gives you a chance to address concerns before leaving.")
    pdf.discussion("Ask: 'Which question feels most comfortable? Which feels scariest? Why is it important to ask about the timeline?'")

    pdf.slide_entry(24, "During & Closing the Interview")
    pdf.speaking_notes("While There: Good posture, organize thoughts, refer to resume, express willingness to learn. Wrapping Up: Ask questions, thank sincerely, shake hands. Follow-Up: Thank you within 24 hours, reflect, follow up after 1 week.")

    pdf.slide_entry(25, "ChatGPT Interview Practice", "Activity")
    pdf.speaking_notes("AI-powered self-directed practice:\n1. Choose a job you're interested in\n2. Open ChatGPT (free version works)\n3. Paste the provided prompt\n4. Answer questions as if real\n5. Ask for feedback on answers\n\nThis is a tool students can use anytime on their own.")
    pdf.materials("ChatGPT Interview Practice Prompts")
    pdf.tip("If time allows, have students do this in class (20-30 min). If short on time, assign as homework. Emphasize this is a tool they can use repeatedly.")

    # ── Chapter 6 ──
    pdf.chapter_head("E", "CHAPTER 6: EVALUATION", "EVALUATION")

    pdf.slide_entry(26, "Check Your Knowledge", "Section Title")
    pdf.speaking_notes("Transition into the evaluation section.")

    pdf.slide_entry(27, "Exit Ticket")
    pdf.speaking_notes("Three reflection questions:\n1. Name two things you will do before your next interview to prepare\n2. Describe how you would use the STAR method for behavioral questions\n3. What question will you ask an employer and why?")
    pdf.materials("Interview Skills Rubric -- use for evaluating responses and mock interview performance.")

    # ── Chapter 7 ──
    pdf.chapter_head("A", "CHAPTER 7: APPLICATION", "APPLICATION")

    pdf.slide_entry(28, "Put It Into Practice", "Section Title")
    pdf.speaking_notes("Transition: 'The best way to learn interviewing is to DO it. Let's practice.'")

    pdf.slide_entry(29, "Mock Interview Round Robin")
    pdf.speaking_notes("Partners take turns as interviewer and candidate. Four questions:\n1. Tell me about yourself and why you're interested\n2. Describe a time you solved a difficult problem\n3. Greatest strengths and one area you're improving?\n4. Where do you see yourself in five years?\n\nPeer feedback: 2 positives + 1 suggestion using the Interview Rubric. Allow 30-40 minutes. Rotate partners if time allows.")
    pdf.materials("Interview Skills Rubric -- distribute for peer feedback during mock interviews.")
    pdf.tip("Set up chairs facing each other, no desks between. Remind students to practice everything: handshake, eye contact, posture, STAR answers, closing question. The more realistic, the more valuable.")
    pdf.discussion("After the round robin, debrief: 'What was the hardest question? What feedback surprised you? What will you do differently in a real interview?'")

    pdf.slide_entry(30, "Follow-Up Etiquette")
    pdf.speaking_notes("Three-step timeline:\n1. Within 24 Hours: Send personalized thank-you note (handwritten or email)\n2. Reflect: Review interview for strengths and improvement areas\n3. After One Week: Courteous follow-up call if no response\n\nMany students don't realize a thank-you note is expected. It keeps you top of mind.")
    pdf.discussion("Ask: 'Have you ever sent a thank-you note after an interview? What would you say?' Practice together: draft a 2-3 sentence thank-you as a class.")

    pdf.slide_entry(31, "Closing Slide")
    pdf.speaking_notes("Quote: 'The secret of getting ahead is getting started.' Thank students for their participation and courage. Remind them to use the STAR method, ChatGPT practice tool, and follow-up checklist.")
    pdf.discussion("Final round: 'Complete this sentence: After today, I feel more confident about interviews because ___.'")

    # ── Checklist ──
    pdf.checklist([
        ("STAR Interview Worksheet", "Handouts folder"),
        ("Interview Skills Rubric", "Handouts folder"),
        ("ChatGPT Interview Practice Prompts", "Handouts folder"),
        ("Lesson Plan", "Handouts folder"),
        ("Classroom objects", "Gather 8-10 for Sell an Object warm-up"),
    ])

    out = "C:/Users/Instructor/Dev/Employability Skills Curriculum/lesson-interview-skills/Teacher-Resources/Interview_Skills_Teachers_Guide.pdf"
    pdf.output(out)
    print(f"Created: {out}")


if __name__ == "__main__":
    build_accountability_guide()
    build_time_management_guide()
    build_interview_skills_guide()
    print("\nAll Teacher's Guides generated successfully!")
