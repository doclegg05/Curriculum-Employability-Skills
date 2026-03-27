"""
Generate Presenter Notes PDFs for SPOKES Employability Skills Curriculum
"""
import os
from fpdf import FPDF

# ─── Shared helpers ───────────────────────────────────────────────────────────

class PresenterNotesPDF(FPDF):
    """Custom PDF with SPOKES branding and consistent formatting."""

    BLUE = (0, 123, 175)       # #007baf
    DARK = (0, 64, 113)        # #004071
    GREEN = (55, 181, 80)      # #37b550
    GOLD = (211, 178, 87)      # #d3b257
    GRAY = (96, 99, 107)       # #60636b
    LIGHT_BG = (237, 243, 247) # #edf3f7
    WHITE = (255, 255, 255)

    def __init__(self, title, subtitle):
        super().__init__()
        self._title = title
        self._subtitle = subtitle
        self.set_auto_page_break(auto=True, margin=25)
        self.add_font("body", "", "C:/Windows/Fonts/segoeui.ttf")
        self.add_font("body", "B", "C:/Windows/Fonts/segoeuib.ttf")
        self.add_font("body", "I", "C:/Windows/Fonts/segoeuii.ttf")
        self.add_font("body", "BI", "C:/Windows/Fonts/segoeuiz.ttf")

    # ── Header / Footer ──────────────────────────────────────────────────────
    def header(self):
        if self.page_no() == 1:
            return  # title page has custom layout
        self.set_font("body", "I", 8)
        self.set_text_color(*self.GRAY)
        self.cell(0, 6, f"SPOKES Presenter Notes  |  {self._title}", align="L")
        self.ln(2)
        self.set_draw_color(*self.BLUE)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("body", "I", 8)
        self.set_text_color(*self.GRAY)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    # ── Title page ────────────────────────────────────────────────────────────
    def title_page(self):
        self.add_page()
        self.alias_nb_pages()
        # Blue header bar
        self.set_fill_color(*self.DARK)
        self.rect(0, 0, 210, 80, "F")
        # Title
        self.set_y(20)
        self.set_font("body", "B", 24)
        self.set_text_color(*self.WHITE)
        self.multi_cell(0, 12, self._title, align="C")
        self.ln(2)
        self.set_font("body", "", 14)
        self.set_text_color(200, 220, 240)
        self.multi_cell(0, 8, self._subtitle, align="C")
        # Subtitle area
        self.set_y(90)
        self.set_font("body", "B", 16)
        self.set_text_color(*self.BLUE)
        self.cell(0, 10, "Presenter Notes for New Instructors", align="C")
        self.ln(14)
        self.set_font("body", "", 11)
        self.set_text_color(*self.GRAY)
        self.multi_cell(0, 7, (
            "This guide is designed to help you teach this SPOKES lesson for the first time. "
            "It walks through every slide in sequence, explains the purpose and key talking points, "
            "references the handouts and resources students will use, and provides discussion prompts "
            "to encourage meaningful class participation.\n\n"
            "Use this document alongside the interactive lesson presentation. "
            "Handouts are available as downloadable PDFs within the lesson sidebar and the resources folder."
        ), align="L")
        self.ln(8)
        # Info box
        self.set_fill_color(*self.LIGHT_BG)
        self.set_draw_color(*self.BLUE)
        y = self.get_y()
        self.rect(15, y, 180, 30, "DF")
        self.set_xy(20, y + 4)
        self.set_font("body", "B", 10)
        self.set_text_color(*self.DARK)
        self.cell(0, 6, "SPOKES  |  Strategic Planning in Occupational Knowledge for Employment and Success")
        self.set_xy(20, y + 12)
        self.set_font("body", "", 9)
        self.set_text_color(*self.GRAY)
        self.cell(0, 6, "WV Adult Basic Education  |  2026")
        self.set_xy(20, y + 19)
        self.cell(0, 6, "Instructional Framework: WIPPEA (Warm-up, Introduction, Presentation, Practice, Evaluation, Application)")

    # ── Section helpers ───────────────────────────────────────────────────────
    def chapter_heading(self, chapter_num, title):
        """Large colored chapter divider."""
        self.add_page()
        self.set_fill_color(*self.BLUE)
        self.rect(0, 10, 210, 28, "F")
        self.set_y(14)
        self.set_font("body", "B", 18)
        self.set_text_color(*self.WHITE)
        self.cell(0, 10, f"  Chapter {chapter_num}: {title}", align="L")
        self.ln(20)

    def slide_heading(self, slide_num, title):
        """Slide-level heading with number badge."""
        self.ln(4)
        if self.get_y() > 250:
            self.add_page()
        self.set_fill_color(*self.GREEN)
        self.set_font("body", "B", 10)
        self.set_text_color(*self.WHITE)
        x = self.get_x()
        y = self.get_y()
        # Badge
        self.rect(10, y, 22, 7, "F")
        self.set_xy(10, y)
        self.cell(22, 7, f"Slide {slide_num}", align="C")
        # Title
        self.set_xy(35, y)
        self.set_font("body", "B", 12)
        self.set_text_color(*self.DARK)
        self.cell(0, 7, title)
        self.ln(10)

    def body_text(self, text):
        self.set_font("body", "", 10)
        self.set_text_color(*self.GRAY)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def discussion_prompt(self, prompt):
        """Green-bordered discussion prompt box."""
        if self.get_y() > 255:
            self.add_page()
        self.set_draw_color(*self.GREEN)
        self.set_fill_color(240, 255, 240)
        y = self.get_y()
        self.set_font("body", "B", 9)
        self.set_text_color(*self.GREEN)
        # Calculate height needed
        # Use a simple estimate: ~95 chars per line at this font size in the box
        lines = len(prompt) / 80 + 1
        box_h = max(16, 8 + lines * 5.5)
        self.rect(15, y, 180, box_h, "DF")
        self.set_xy(20, y + 3)
        self.cell(0, 5, ">>  DISCUSSION PROMPT")
        self.set_xy(20, y + 9)
        self.set_font("body", "I", 9)
        self.set_text_color(40, 80, 40)
        self.multi_cell(170, 5, prompt)
        self.set_y(y + box_h + 3)

    def handout_reference(self, handout_name, description=""):
        """Blue info box referencing a handout."""
        if self.get_y() > 260:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(230, 242, 250)
        self.set_draw_color(*self.BLUE)
        desc_lines = len(description) / 85 + 1 if description else 0
        box_h = max(12, 8 + desc_lines * 5)
        self.rect(15, y, 180, box_h, "DF")
        self.set_xy(20, y + 3)
        self.set_font("body", "B", 9)
        self.set_text_color(*self.BLUE)
        self.cell(0, 5, f"[HANDOUT]: {handout_name}")
        if description:
            self.set_xy(20, y + 8)
            self.set_font("body", "", 8)
            self.set_text_color(*self.GRAY)
            self.multi_cell(170, 4.5, description)
        self.set_y(y + box_h + 3)

    def teaching_tip(self, tip):
        """Gold-bordered teaching tip box."""
        if self.get_y() > 255:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(255, 250, 230)
        self.set_draw_color(*self.GOLD)
        lines = len(tip) / 80 + 1
        box_h = max(14, 8 + lines * 5.5)
        self.rect(15, y, 180, box_h, "DF")
        self.set_xy(20, y + 3)
        self.set_font("body", "B", 9)
        self.set_text_color(*self.GOLD)
        self.cell(0, 5, "*  TEACHING TIP")
        self.set_xy(20, y + 9)
        self.set_font("body", "", 9)
        self.set_text_color(100, 80, 40)
        self.multi_cell(170, 5, tip)
        self.set_y(y + box_h + 3)

    def bullet_list(self, items):
        self.set_font("body", "", 10)
        self.set_text_color(*self.GRAY)
        for item in items:
            if self.get_y() > 270:
                self.add_page()
            self.cell(8, 6, "\u2022")
            x = self.get_x()
            self.multi_cell(0, 6, item)
            if self.get_x() != 10:
                self.ln(1)


# ═══════════════════════════════════════════════════════════════════════════════
# LESSON 1: EMPLOYEE ACCOUNTABILITY
# ═══════════════════════════════════════════════════════════════════════════════

def build_accountability():
    pdf = PresenterNotesPDF(
        "Employee Accountability",
        "Taking Ownership for Career Success"
    )
    pdf.title_page()

    # ── Materials checklist ────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_font("body", "B", 14)
    pdf.set_text_color(*pdf.DARK)
    pdf.cell(0, 10, "Before You Begin: Materials Checklist")
    pdf.ln(12)
    pdf.body_text(
        "Gather and prepare these materials before class. All handouts are available "
        "as downloadable PDFs in the lesson sidebar under Resources."
    )
    pdf.bullet_list([
        "Handout 1: Habits of Mind Worksheet (one per student)",
        "Handout 2: Self-Reflection Worksheet (one per student)",
        "Handout 3: Workplace Scenarios v2 \u2014 includes both Maria and Annette scenarios (one per student)",
        "Handout 4: SMART Goal Worksheet (one per student)",
        "Handout 5: Career Planning Worksheet (one per student)",
        "Employee Accountability Rubric (for your reference and grading)",
        "Lesson Plan document (Employee_Accountability_Module_Lesson_Plan_4.7.pdf) for timing guidance",
        "Projector or screen to display the interactive lesson presentation",
        "Whiteboard or flip chart for listing student responses during scenario analysis",
        "Estimated lesson time: 2\u20132.5 hours (can be split across two sessions)",
    ])
    pdf.ln(4)
    pdf.teaching_tip(
        "If splitting into two sessions, a natural break point is after Chapter 4 (6 Principles of Personal "
        "Accountability). Session 2 would begin with the Victim vs. Accountable Mindset comparison."
    )

    # ── CHAPTER 1: INTRODUCTION ───────────────────────────────────────────
    pdf.chapter_heading(1, "Introduction & Warm-Up")

    pdf.slide_heading(1, "Title Slide")
    pdf.body_text(
        "Welcome students and introduce the lesson topic: Employee Accountability \u2014 Taking Ownership "
        "for Career Success. Set the tone by explaining that accountability is one of the most valued "
        "traits employers look for, and that today's lesson will give students practical tools to build it."
    )
    pdf.teaching_tip(
        "Start with a personal anecdote. Share a brief story about a time accountability mattered "
        "in your own work experience. This builds rapport and models the vulnerability you'll ask of students."
    )

    pdf.slide_heading(2, "Essential Questions")
    pdf.body_text(
        "Three essential questions frame the entire lesson:\n"
        "1. Are you accountable for your actions?\n"
        "2. How do your Habits of Mind influence your accountability?\n"
        "3. How do I move from victim thinking to accountable thinking?\n\n"
        "Read these aloud and let them sit for a moment. Tell students these questions will be revisited "
        "throughout the lesson and that by the end, they should be able to answer each one."
    )
    pdf.discussion_prompt(
        "Before diving in, ask: 'Without overthinking it, raise your hand if you consider yourself an "
        "accountable person.' Then ask: 'What does being accountable actually mean to you?' "
        "Accept a few quick responses to gauge where the class is starting from."
    )

    pdf.slide_heading(3, "Learning Objectives")
    pdf.body_text(
        "Five learning objectives are displayed. Walk through them briefly so students know what to expect:\n"
        "1. Define employee accountability and explain its importance\n"
        "2. Identify Habits of Mind that support accountability\n"
        "3. Explain benefits and recognize common barriers\n"
        "4. Analyze workplace scenarios for accountability behaviors\n"
        "5. Reflect on personal accountability and create a SMART goal action plan\n\n"
        "Emphasize that this lesson is both knowledge-based and personal \u2014 students will reflect on "
        "their own habits and leave with a concrete goal."
    )

    pdf.slide_heading(4, "Opening Statement: 'Are you accountable for your actions?'")
    pdf.body_text(
        "This bold question sets the reflective tone. Pause and let students sit with it. "
        "This is not the time for answers yet \u2014 it's a provocation to get them thinking."
    )
    pdf.discussion_prompt(
        "Ask students to think silently for 30 seconds: 'Think of one time in the past week when you "
        "had to take ownership of something \u2014 at home, at work, or at school. Hold that memory.' "
        "You'll come back to it later."
    )

    # ── CHAPTER 2: WHAT IS ACCOUNTABILITY? ────────────────────────────────
    pdf.chapter_heading(2, "What Is Accountability?")

    pdf.slide_heading(5, "Section Divider")
    pdf.body_text(
        "Transition slide. Use this moment to say: 'Let's start with the basics \u2014 what does "
        "accountability actually mean, and why is it different from responsibility?'"
    )

    pdf.slide_heading(6, "Responsibility vs. Accountability")
    pdf.body_text(
        "This is a foundational distinction:\n"
        "\u2022 RESPONSIBILITY = Assigned (tasks given to you)\n"
        "\u2022 ACCOUNTABILITY = Ownership (owning the outcome)\n\n"
        "Explain that responsibility is what your boss hands you; accountability is what you do with it. "
        "You can be responsible for a task and still not be accountable \u2014 for example, if you blame "
        "others when it goes wrong or take no initiative to fix problems."
    )
    pdf.discussion_prompt(
        "Ask: 'Can someone give me an example where a person was responsible for something but "
        "NOT accountable?' Then: 'What would accountability have looked like in that situation?'"
    )

    pdf.slide_heading(7, "Big Statement: 'No excuses. No blame. Solutions.'")
    pdf.body_text(
        "This three-word philosophy captures the accountability mindset. Let students read it and absorb it. "
        "Explain that accountable people don't waste energy on excuses or blame \u2014 they channel "
        "it into finding solutions. This is the core shift we want students to internalize."
    )

    pdf.slide_heading(8, "Why Accountability Matters")
    pdf.body_text(
        "Four benefit cards are displayed:\n"
        "\u2022 Trust: Builds credibility with managers and coworkers\n"
        "\u2022 Professionalism: Demonstrates maturity and reliability\n"
        "\u2022 Opportunity: Leads to promotions and leadership roles\n"
        "\u2022 Growth: Enables continuous improvement\n\n"
        "Walk through each card. For Trust, explain that people rely on those who follow through. "
        "For Professionalism, note that handling mistakes well actually impresses employers more than "
        "never making mistakes. For Opportunity, share that employers notice and reward accountability. "
        "For Growth, connect back to the idea that reflecting on mistakes is how we improve."
    )
    pdf.discussion_prompt(
        "Ask: 'How does someone's accountability \u2014 or lack of it \u2014 affect trust and teamwork in a "
        "workplace? Can you think of an example where being reliable or taking responsibility helped "
        "you (or someone you know) earn a new opportunity?'"
    )

    # ── CHAPTER 3: HABITS OF MIND ─────────────────────────────────────────
    pdf.chapter_heading(3, "Habits of Mind")

    pdf.slide_heading(9, "Section Divider")
    pdf.body_text("Transition into the Habits of Mind framework. Set up the concept by saying: "
                  "'Now that we know WHAT accountability is, let's talk about HOW we think \u2014 "
                  "because the way we think determines how we act.'")

    pdf.slide_heading(10, "Framework Quote & Context")
    pdf.body_text(
        "Featured quote from Arthur Costa & Bena Kallick: 'What keeps us from being accountable "
        "isn't just what we do \u2014 it's how we think.'\n\n"
        "Explain the Habits of Mind framework: these are not specific skills like math or reading, but "
        "patterns of thinking that help people approach problems, make decisions, and keep learning "
        "when things get difficult. They are learned behaviors, not personality traits."
    )
    pdf.handout_reference(
        "Handout 1: Habits of Mind Worksheet",
        "Distribute now. Students will reference this as you walk through the habits on the next slides."
    )
    pdf.discussion_prompt(
        "Ask: 'What do you think keeps people from being accountable at work? Is it laziness? "
        "Not caring? Or is it something about how they think and react?' Let 2-3 students share."
    )

    pdf.slide_heading(11, "Self-Reflection Introduction")
    pdf.body_text(
        "Introduce the self-reflection activity. Explain that students will rate themselves on several "
        "Habits of Mind using a 1-5 scale. Emphasize this is personal and honest \u2014 there are no "
        "right or wrong answers. They will be invited but NOT required to share."
    )
    pdf.handout_reference(
        "Handout 2: Self-Reflection Worksheet",
        "Distribute now. Give students 5-7 minutes to complete the rating scale. "
        "Walk around to answer questions but respect privacy."
    )

    pdf.slide_heading("12-13", "Key Habits of Mind (Two Slides)")
    pdf.body_text(
        "Two slides present the key Habits of Mind with descriptions:\n\n"
        "Slide 12:\n"
        "\u2022 Persisting \u2014 Sticking with a task even when it's hard\n"
        "\u2022 Managing Impulsivity \u2014 Pausing to think before acting or speaking\n"
        "\u2022 Listening with Empathy \u2014 Paying attention to others before responding\n"
        "\u2022 Thinking Flexibly \u2014 Considering multiple viewpoints; adapting\n\n"
        "Slide 13:\n"
        "\u2022 Striving for Accuracy \u2014 Checking work carefully; maintaining high standards\n"
        "\u2022 Taking Responsible Risks \u2014 Trying new things thoughtfully\n"
        "\u2022 Continuous Learning \u2014 Reflecting, seeking feedback, and improving\n"
        "\u2022 The Connection: How you think determines how you act\n\n"
        "For each habit, give a quick real-world workplace example. For 'Managing Impulsivity,' "
        "you might say: 'This is the person who takes a breath before replying to a frustrating email "
        "instead of firing back.' For 'Persisting,' try: 'This is the employee who keeps trying different "
        "approaches when the first solution doesn't work, rather than giving up.'"
    )
    pdf.discussion_prompt(
        "After reviewing both slides, ask: 'Looking at your self-reflection worksheet, which habit "
        "did you rate yourself highest on? Which one do you want to work on? Would anyone like to share?'"
    )
    pdf.teaching_tip(
        "Close this section by reinforcing: 'Habits of Mind strengthen accountability by helping people "
        "make thoughtful choices, take responsibility for outcomes, and learn from every experience. "
        "People who practice these habits don't blame others \u2014 they reflect, correct, and improve.'"
    )

    # ── CHAPTER 4: THE 5 CS FRAMEWORK ─────────────────────────────────────
    pdf.chapter_heading(4, "The 5 Cs of Accountability")

    pdf.slide_heading(14, "Section Divider")
    pdf.body_text("Transition by saying: 'Now let's look at a framework that organizations use "
                  "to build accountability into their workplace culture \u2014 The 5 Cs.'")

    pdf.slide_heading(15, "The 5 Cs \u2014 Interactive Flip Cards")
    pdf.body_text(
        "This slide features interactive flip cards that students hover over. The 5 Cs are:\n\n"
        "1. CLARITY \u2014 Set clear goals so everyone knows what success looks like\n"
        "2. COMMITMENT \u2014 Be genuinely invested and follow through on promises\n"
        "3. COMMUNICATION \u2014 Share expectations and feedback openly\n"
        "4. COLLABORATION \u2014 Work together and share accountability\n"
        "5. CONSEQUENCES \u2014 Actions have outcomes; follow-through matters\n\n"
        "Walk through each C in order. For Clarity, stress that confusion about expectations is one "
        "of the biggest barriers to accountability. For Commitment, explain that buy-in happens when "
        "people connect their personal goals with organizational goals. For Communication, emphasize "
        "that honest, timely communication prevents small problems from growing. For Collaboration, "
        "note that shared accountability means the team succeeds or fails together. For Consequences, "
        "clarify that consequences aren't just negative \u2014 recognition and celebration reinforce accountability too."
    )
    pdf.discussion_prompt(
        "Ask: 'Which of the 5 Cs do you think is the hardest to practice in a workplace? Why?' "
        "Then: 'Think about a job or class you've been in \u2014 which C was missing, and how did it "
        "affect the group?'"
    )

    # ── CHAPTER 5: 6 PRINCIPLES ───────────────────────────────────────────
    pdf.chapter_heading(5, "6 Principles of Personal Accountability")

    pdf.slide_heading(16, "Section Divider")
    pdf.body_text("Transition: 'The 5 Cs are about organizational culture. Now let's get personal \u2014 "
                  "here are 6 principles YOU can practice to be more accountable every day.'")

    pdf.slide_heading(17, "The 6 Principles")
    pdf.body_text(
        "Six principles are displayed in a 2x3 grid:\n\n"
        "1. Practice Optimism \u2014 Cultivate realistic hope through challenges. Being optimistic doesn't "
        "mean ignoring problems; it means framing mistakes as learning opportunities rather than failures.\n\n"
        "2. Practice Self-Awareness \u2014 See things as they really are. Blind spots (both positive and "
        "negative) prevent us from being accountable. We need honest self-assessment.\n\n"
        "3. Own Your Actions \u2014 Take responsibility instead of playing victim. When you externalize "
        "blame, you get stuck in self-pity instead of focusing on solutions.\n\n"
        "4. Be Solution-Oriented \u2014 Think creatively; ask for help when needed. It takes humility "
        "to admit you need assistance, and that's a strength.\n\n"
        "5. Change the Narrative \u2014 Create a new path forward using facts, skills, and resources. "
        "A setback doesn't define you; what you do next does.\n\n"
        "6. Supercharge Leadership \u2014 Accept responsibility for your output. Your results are only "
        "as good as the effort and ownership you put in."
    )
    pdf.discussion_prompt(
        "Ask: 'Which of these 6 principles resonates most with you right now? Is there one you "
        "struggle with?' Allow 2-3 students to share. Then ask: 'How could practicing just ONE of "
        "these principles change something in your current work or school situation?'"
    )

    # ── CHAPTER 6: VICTIM VS. ACCOUNTABLE ─────────────────────────────────
    pdf.chapter_heading(6, "Victim vs. Accountable Mindset")

    pdf.slide_heading(18, "Section Divider")
    pdf.body_text("This is one of the most impactful sections. Set it up by saying: "
                  "'We all face difficult situations. The difference is in how we respond. "
                  "Let's compare two very different mindsets.'")

    pdf.slide_heading(19, "Two Roads Comparison")
    pdf.body_text(
        "This slide presents a powerful side-by-side comparison:\n\n"
        "VICTIM ROAD (X):\n"
        "\u2022 Ignore the problem\n"
        "\u2022 Deny involvement\n"
        "\u2022 Blame someone else\n"
        "\u2022 Rationalize and justify\n"
        "\u2022 Resist getting involved\n"
        "\u2022 Hide to avoid it\n\n"
        "ACCOUNTABLE ROAD (YES):\n"
        "\u2022 Recognize and own it\n"
        "\u2022 Forgive yourself and others\n"
        "\u2022 Self-examine contribution\n"
        "\u2022 Learn what to do differently\n"
        "\u2022 Act on solutions\n"
        "\u2022 Grow from experience\n\n"
        "Read through both columns slowly. For each victim behavior, contrast it with the accountable "
        "counterpart. Emphasize that the victim road feels easier in the moment but leads nowhere, "
        "while the accountable road takes courage but leads to growth."
    )
    pdf.discussion_prompt(
        "Ask: 'Be honest with yourselves \u2014 have you ever caught yourself on the victim road? "
        "What happened? What would the accountable road have looked like in that situation?' "
        "Normalize this by sharing that everyone slips into victim thinking sometimes; the key is recognizing it."
    )

    pdf.slide_heading(20, "Key Reflective Question")
    pdf.body_text(
        "Big statement: 'When facing a difficult situation, accountable people ask: NOT \"how do I "
        "avoid it?\" BUT \"how fast can I get through it?\"'\n\n"
        "This reframe is powerful. Explain that avoidance is the hallmark of victim thinking, while "
        "accountable people face challenges head-on. The speed isn't about rushing \u2014 it's about "
        "not procrastinating or hiding from the problem."
    )

    # ── CHAPTER 7: WORKPLACE APPLICATION ──────────────────────────────────
    pdf.chapter_heading(7, "Workplace Application")

    pdf.slide_heading(21, "Section Divider")
    pdf.body_text("Transition: 'Now let's apply everything we've learned to real workplace situations.'")

    pdf.slide_heading(22, "Three Areas of Accountability")
    pdf.body_text(
        "Three cards show where accountability applies in daily life:\n\n"
        "AREA A \u2014 Actions & Choices: How you communicate, spend time, behave, show respect, "
        "maintain your attitude, and respond to challenges.\n\n"
        "AREA B \u2014 Responsibilities: Being on time, returning calls/emails, keeping spaces clean, "
        "living within your means, doing what you agreed to do, executing job duties well.\n\n"
        "AREA C \u2014 Goals: Career ambitions, financial targets, health goals, family objectives, "
        "personal development, education plans.\n\n"
        "Point out that accountability isn't just about big dramatic moments \u2014 it's in the everyday "
        "small choices. Being on time is accountability. Returning a phone call is accountability."
    )
    pdf.discussion_prompt(
        "Ask: 'Look at these three areas. Which area are you strongest in? Which needs the most "
        "work? Give me a specific example from your life.'"
    )

    pdf.slide_heading(23, "Workplace Scenarios Introduction")
    pdf.body_text(
        "Big statement: 'Let's look at two examples from the workplace.' This transitions to the "
        "scenario comparison activity, which is the core practice exercise of this lesson."
    )
    pdf.handout_reference(
        "Handout 3: Workplace Scenarios v2",
        "Distribute now. This handout contains both scenarios (Maria and Annette) with discussion questions. "
        "Student versions do not contain answers; the teacher version with answer keys is in your lesson plan."
    )
    pdf.teaching_tip(
        "Have students read Scenario 1A (Maria) first. After reading, ask them to list examples of "
        "strong accountability on the board. THEN distribute Scenario 1B (Annette) and repeat the "
        "process for weak accountability. Doing them separately creates a stronger contrast."
    )

    pdf.slide_heading(24, "Strong Accountability: Maria (Healthcare)")
    pdf.body_text(
        "Maria's scenario demonstrates five accountability behaviors in a healthcare setting:\n"
        "\u2022 Verified a medication discrepancy with the pharmacy\n"
        "\u2022 Documented the call in the patient chart\n"
        "\u2022 Helped an unsteady resident to safety\n"
        "\u2022 Immediately reported her own mistake (unlocked cart) to supervisor\n"
        "\u2022 Helped a newer nurse despite being busy\n\n"
        "Highlight that Maria didn't try to hide her mistake with the cart \u2014 she reported it immediately. "
        "That's the hardest form of accountability: admitting your own errors."
    )

    pdf.slide_heading(25, "Weak Accountability: Annette (Healthcare)")
    pdf.body_text(
        "Annette's scenario demonstrates victim-mindset behaviors:\n"
        "\u2022 Ignored a CNA's alert about an agitated resident\n"
        "\u2022 Did not document the situation\n"
        "\u2022 Blamed the CNA when the resident fell\n"
        "\u2022 Became defensive during the review\n"
        "\u2022 Complained about understaffing\n\n"
        "Point out how each of Annette's behaviors maps to the 'Victim Road' from Slide 19: ignoring, "
        "blaming, rationalizing, and hiding."
    )

    pdf.slide_heading(26, "Scenario Reflection Prompt")
    pdf.body_text(
        "Big statement: 'What Habits of Mind did Maria demonstrate that Annette did not?'\n\n"
        "This ties the scenario analysis back to the Habits of Mind framework from Chapter 2. "
        "Guide students to make specific connections."
    )
    pdf.discussion_prompt(
        "Facilitate a class discussion. Expected connections include:\n"
        "\u2022 Maria showed Persisting (helped despite being busy)\n"
        "\u2022 Maria showed Managing Impulsivity (responded calmly to her own mistake)\n"
        "\u2022 Maria showed Listening with Empathy (heard concerns, took action)\n"
        "\u2022 Annette lacked Thinking Flexibly (refused to consider her own role)\n"
        "\u2022 Annette lacked Striving for Accuracy (didn't document anything)\n\n"
        "Ask: 'What could Annette do differently to be a more accountable employee? "
        "What specific steps could she take?' List responses on the board."
    )

    # ── CHAPTER 8: SMART GOALS ────────────────────────────────────────────
    pdf.chapter_heading(8, "SMART Goals")

    pdf.slide_heading(27, "Section Divider")
    pdf.body_text("Transition: 'Now it's your turn. You're going to take everything we've discussed "
                  "and create a personal accountability goal using the SMART framework.'")

    pdf.slide_heading(28, "SMART Goals Framework")
    pdf.body_text(
        "The SMART acronym is displayed:\n"
        "\u2022 S \u2014 Specific: What exactly will I do?\n"
        "\u2022 M \u2014 Measurable: How will I track progress?\n"
        "\u2022 A \u2014 Achievable: Is this realistic for me now?\n"
        "\u2022 R \u2014 Relevant: Why is this important?\n"
        "\u2022 T \u2014 Time-bound: What is my deadline?\n\n"
        "Walk through each letter with a concrete example. For instance: 'I will arrive 10 minutes early "
        "to work every day for the next 30 days' is SMART. 'I'll be more punctual' is not.\n\n"
        "Give students time to complete their SMART Goal Worksheet (Handout 4). "
        "This should take 10-15 minutes. Walk around to help and offer feedback."
    )
    pdf.handout_reference(
        "Handout 4: SMART Goal Worksheet",
        "Distribute now. Students define one meaningful goal for the next 3-6 months, "
        "including action steps, a timeline, potential obstacles, and an accountability partner."
    )
    pdf.discussion_prompt(
        "After students complete their worksheets, invite 2-3 volunteers to share their SMART goal "
        "with the class. Offer constructive feedback: 'Is it specific enough? How will you measure it? "
        "What's your deadline?' Encourage peers to offer supportive suggestions."
    )

    # ── CHAPTER 9: CLOSING ────────────────────────────────────────────────
    pdf.chapter_heading(9, "Key Takeaways & Closing")

    pdf.slide_heading(29, "Key Takeaways")
    pdf.body_text(
        "Six summary takeaways reinforce the lesson:\n"
        "1. Accountability is a choice \u2014 own outcomes, not blame\n"
        "2. Habits of Mind shape behavior \u2014 think before you act\n"
        "3. The 5 Cs create the framework \u2014 clarity to consequences\n"
        "4. Move from victim to accountable \u2014 recognize, learn, act\n"
        "5. SMART goals track progress \u2014 be specific and time-bound\n"
        "6. Accountability = success \u2014 trust, credibility, opportunity\n\n"
        "Read through each takeaway. Ask students which one stands out most to them."
    )
    pdf.handout_reference(
        "Handout 5: Career Planning Worksheet",
        "Distribute as a take-home activity. This extends the SMART goal into a broader career and "
        "education planning exercise. Students identify occupations of interest, skills to develop, "
        "and create a personal action plan. Completed versions should go in their professional portfolio."
    )
    pdf.teaching_tip(
        "Consider using Handout 5 as a bridge to a future lesson or a follow-up check-in. "
        "Ask students to bring their completed worksheet to the next class session."
    )

    pdf.slide_heading(30, "Closing Slide")
    pdf.body_text(
        "Congratulatory message with a quote: 'When you're personally accountable, you take "
        "ownership of what happens as a result of your choices and actions.'\n\n"
        "End with the call to action: 'Own Your Success.' A confetti animation plays to celebrate "
        "completing the lesson.\n\n"
        "Thank students for their participation and openness. Remind them to hold onto their "
        "worksheets and revisit their SMART goal regularly."
    )
    pdf.discussion_prompt(
        "Final round: 'In one sentence, what is one thing you're going to do differently starting "
        "today because of what you learned?' Go around the room and let each student share."
    )

    # ── Assessment note ───────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_font("body", "B", 14)
    pdf.set_text_color(*pdf.DARK)
    pdf.cell(0, 10, "Assessment & Follow-Up")
    pdf.ln(12)
    pdf.body_text(
        "Use the Employee Accountability Rubric (available in the lesson resources) to evaluate "
        "student participation and worksheet completion. Key areas to assess include:"
    )
    pdf.bullet_list([
        "Self-Reflection quality (Handout 2) \u2014 Did the student engage honestly?",
        "Scenario analysis (Handout 3) \u2014 Did the student identify specific accountability behaviors?",
        "SMART Goal quality (Handout 4) \u2014 Is the goal truly specific, measurable, and time-bound?",
        "Career Planning depth (Handout 5) \u2014 Are occupations and skill plans realistic and thoughtful?",
        "Class participation \u2014 Did the student contribute to discussions and group activities?",
    ])
    pdf.ln(4)
    pdf.handout_reference(
        "Employee Accountability Rubric",
        "Use for formal assessment. Available in the lesson sidebar resources."
    )

    out = "C:/Users/Instructor/Dev/Employability Skills Curriculum/lesson-employee-accountability/resources/Employee_Accountability_Presenter_Notes.pdf"
    pdf.output(out)
    print(f"Created: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# LESSON 2: TIME MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

def build_time_management():
    pdf = PresenterNotesPDF(
        "Time Management",
        "Maximizing Productivity & Achieving Goals"
    )
    pdf.title_page()

    # ── Materials checklist ────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_font("body", "B", 14)
    pdf.set_text_color(*pdf.DARK)
    pdf.cell(0, 10, "Before You Begin: Materials Checklist")
    pdf.ln(12)
    pdf.body_text(
        "Gather and prepare these materials before class. All handouts are available "
        "as downloadable PDFs in the lesson sidebar and the Handouts folder."
    )
    pdf.bullet_list([
        "Time Management Self-Assessment Worksheet (one per student)",
        "Big Rocks of Time Worksheet (one per student)",
        "Get Your Priorities Straight Flow Chart (one per student)",
        "Daily Planner template (one per student)",
        "Weekly Planner template (one per student)",
        "Pre/Post Test (one per student \u2014 administer pre-test before lesson if possible)",
        "Time Management Rubric (for your reference and grading)",
        "Teachers Guide PDF (comprehensive instructor manual in Teacher-Resources folder)",
        "Projector or screen for lesson presentation and embedded videos",
        "Whiteboard or flip chart for listing student responses",
        "Ensure all 4 embedded videos play correctly (test before class)",
        "Optional: physical jar, rocks, pebbles, and sand for Big Rocks demonstration",
    ])
    pdf.ln(4)
    pdf.teaching_tip(
        "If you have access to a physical jar, large rocks, pebbles, and sand, consider doing the Big Rocks "
        "demonstration live instead of (or in addition to) the video. It's much more memorable when "
        "students can see and touch the materials. Fill the jar with sand first to show nothing else fits, "
        "then empty it and start with the big rocks."
    )

    # ── CHAPTER 1: WARM-UP ────────────────────────────────────────────────
    pdf.chapter_heading(1, "Warm-Up")

    pdf.slide_heading(1, "Title Slide")
    pdf.body_text(
        "Welcome students and introduce the topic: Time Management \u2014 Maximizing Productivity "
        "& Achieving Goals. Set the context: 'Everyone talks about not having enough time, but "
        "today we're going to look at how to make the most of the time we have.'"
    )
    pdf.handout_reference(
        "Lesson Plan (SPOKES_Module_Template_2026_Time_Management.pdf)",
        "Review the lesson plan before class for timing guidance and standards alignment."
    )

    pdf.slide_heading(2, "Self-Reflection: How Good Is Your Time Management?")
    pdf.body_text(
        "This warm-up gets students thinking about their current time management habits before "
        "any instruction. Two options:\n\n"
        "Option 1 (Printable): Distribute the Time Management Self-Assessment Worksheet. "
        "Give students 5-7 minutes to complete it.\n\n"
        "Option 2 (Online): Direct students to the Psychology Today time management test at "
        "psychologytoday.com. They do NOT need to log in \u2014 they can click 'no thanks' on the "
        "pop-up to see results. The five-star ratings show strengths and weaknesses."
    )
    pdf.handout_reference(
        "Time Management Self-Assessment Worksheet",
        "Distribute at the start. Students identify personal strengths and weaknesses."
    )
    pdf.discussion_prompt(
        "After completing the assessment, ask: 'What did you discover? Where do you excel? "
        "Where do you struggle? Would anyone like to share one strength and one area for growth?' "
        "Keep it light and encouraging \u2014 everyone has room to improve."
    )

    # ── CHAPTER 2: INTRODUCTION ───────────────────────────────────────────
    pdf.chapter_heading(2, "Introduction")

    pdf.slide_heading(3, "Section Divider: Module Objective")
    pdf.body_text("Transition slide. Say: 'Now that you've reflected on where you are, "
                  "let's set the purpose for today's lesson.'")

    pdf.slide_heading(4, "We All Have 24 Hours")
    pdf.body_text(
        "Four cards highlight that while time is equal, circumstances are not:\n"
        "\u2022 Responsibilities \u2014 Work, school, home, community\n"
        "\u2022 Financial Obligations \u2014 Bills, savings, goals\n"
        "\u2022 Family Sizes \u2014 Dependents, relationships, caregiving\n"
        "\u2022 Levels of Support \u2014 Resources, networks, access\n\n"
        "This is important for adult learners who often juggle multiple roles. Validate that "
        "time management looks different for a single parent working two jobs than for someone "
        "with fewer obligations. The tools we teach today can help everyone, regardless of circumstances."
    )
    pdf.discussion_prompt(
        "Ask: 'What makes time management harder for YOU specifically? What's your biggest "
        "time challenge right now?' This builds empathy in the room and helps you tailor examples."
    )

    pdf.slide_heading(5, "Big Statement: Maximize Productivity & Achieve Goals")
    pdf.body_text(
        "The core lesson goal: 'The goal of effective time management is to maximize productivity "
        "and achieve your goals.' Explain that this isn't about being busy \u2014 it's about being effective. "
        "Being busy and being productive are not the same thing."
    )

    # ── CHAPTER 3: SETTING PRIORITIES ─────────────────────────────────────
    pdf.chapter_heading(3, "Setting Priorities")

    pdf.slide_heading(6, "Section Divider")
    pdf.body_text("Transition: 'Before we can manage our time, we need to figure out what matters most.'")

    pdf.slide_heading(7, "What Are Priorities?")
    pdf.body_text(
        "Definition: Priorities are things that are more important than others and need to be dealt "
        "with first. They establish the sequence in which things should be done.\n\n"
        "This seems simple but many people never stop to actually define their priorities. "
        "They react to whatever is in front of them instead of proactively choosing."
    )
    pdf.discussion_prompt(
        "Ask: 'What are your current top 3 priorities in life? How do you decide what comes first "
        "each day?' Give students a minute to think, then have 2-3 share."
    )

    pdf.slide_heading(8, "The Big Rocks of Time")
    pdf.body_text(
        "The jar metaphor: If you fill your jar with sand (small, low-priority tasks) first, "
        "there's no room for the big rocks (your most important priorities).\n\n"
        "Put the big rocks in first, then let the smaller things fill in around them. "
        "This is one of the most memorable concepts in the lesson \u2014 take your time with it."
    )
    pdf.handout_reference(
        "Big Rocks of Time Worksheet",
        "Distribute now. Students identify their own 'big rocks, pebbles, sand, and water' in their lives."
    )
    pdf.teaching_tip(
        "If you have physical materials (jar, rocks, pebbles, sand), do the demonstration now. "
        "Otherwise, play the video on the next slide. Either way, have students complete the "
        "Big Rocks Worksheet to identify their personal priorities."
    )

    pdf.slide_heading(9, "Video: The Big Rocks of Time")
    pdf.body_text(
        "Embedded YouTube video demonstrating the Big Rocks concept. "
        "Play the video and then ask students to connect it to their own lives."
    )
    pdf.discussion_prompt(
        "After the video, ask: 'What are YOUR big rocks? What are the pebbles and sand "
        "that tend to fill up your jar first?' Have students reference their worksheets."
    )

    pdf.slide_heading(10, "Transition: 'Now What?'")
    pdf.body_text(
        "'You've identified your priorities... Now what?' This bridges from identifying priorities "
        "to learning the tools and systems to manage them. Say: 'Knowing your priorities is step one. "
        "Now we need a system to make sure you actually dedicate time to each one.'"
    )

    # ── CHAPTER 4: TOOLS & STRATEGIES ─────────────────────────────────────
    pdf.chapter_heading(4, "Tools & Strategies")

    pdf.slide_heading(11, "Section Divider")
    pdf.body_text("Transition: 'Here's the good news \u2014 there are proven tools that can help.'")

    pdf.slide_heading(12, "Set SMART Goals")
    pdf.body_text(
        "The SMART framework:\n"
        "\u2022 S \u2014 Specific: What exactly will I accomplish?\n"
        "\u2022 M \u2014 Measurable: How will I track my progress?\n"
        "\u2022 A \u2014 Achievable: Is this realistic for me right now?\n"
        "\u2022 R \u2014 Relevant: Why is this important to me?\n"
        "\u2022 T \u2014 Time-bound: What is my deadline?\n\n"
        "Emphasize that writing goals down increases your chances of achieving them. "
        "Connect SMART goals directly to time management: a vague goal wastes time "
        "because you don't know where to focus."
    )
    pdf.teaching_tip(
        "Give a non-example first: 'I want to get healthier' \u2014 not SMART. Then transform it: "
        "'I will walk for 20 minutes every morning before work for the next 4 weeks' \u2014 SMART. "
        "Have students practice transforming one vague goal into a SMART one."
    )

    pdf.slide_heading(13, "Utilize a Flow Chart")
    pdf.body_text(
        "A flow chart helps make quick daily or weekly decisions about what to tackle next, "
        "based on urgency and importance. It's a simple decision tree students can keep on "
        "their desk or refrigerator."
    )
    pdf.handout_reference(
        "Get Your Priorities Straight Flow Chart",
        "Distribute now. Walk students through the flow chart logic and suggest they customize it."
    )

    pdf.slide_heading(14, "The Eisenhower Matrix")
    pdf.body_text(
        "A 2x2 matrix that sorts tasks by urgency and importance:\n\n"
        "Quadrant 1 (Urgent + Important) \u2192 DO FIRST: Crises, deadlines, emergencies\n"
        "Quadrant 2 (Not Urgent + Important) \u2192 SCHEDULE: Goals, planning, self-care\n"
        "Quadrant 3 (Urgent + Not Important) \u2192 DELEGATE: Interruptions, some meetings\n"
        "Quadrant 4 (Not Urgent + Not Important) \u2192 ELIMINATE: Time wasters, distractions\n\n"
        "Stress that most people live in Quadrant 1 (putting out fires) and Quadrant 4 (wasting time), "
        "but the most productive people spend the majority of their time in Quadrant 2 (scheduling "
        "important things before they become urgent)."
    )
    pdf.discussion_prompt(
        "Ask: 'Think about yesterday. What quadrant did you spend most of your time in? "
        "What is one task you keep putting in Quadrant 1 that should have been scheduled in Quadrant 2?'"
    )

    pdf.slide_heading(15, "Daily & Weekly Planners")
    pdf.body_text(
        "Keeping activities in view ensures priority tasks get accomplished. "
        "Planners also help students find free time they didn't know they had."
    )
    pdf.handout_reference(
        "Daily Planner & Weekly Planner Templates",
        "Distribute both. The weekly planner links to the daily planner for comprehensive planning."
    )
    pdf.teaching_tip(
        "Have students fill in tomorrow's daily planner right now as practice. "
        "This gives them immediate, hands-on experience with the tool."
    )

    pdf.slide_heading(16, "Family To-Do Lists & Delegation")
    pdf.body_text(
        "This slide addresses delegation within the family context \u2014 highly relevant for adult learners "
        "who are parents. Three benefits of getting the whole family involved in chores:\n"
        "\u2022 Builds Self-Esteem: Children feel valued and capable\n"
        "\u2022 Teaches Life Skills: Develops responsibility and work ethic\n"
        "\u2022 Fosters Teamwork: Creates belonging and frees up quality time\n\n"
        "Frame delegation as a gift to your family, not a burden. "
        "Children who do age-appropriate chores develop confidence and life skills."
    )
    pdf.discussion_prompt(
        "Ask: 'For those with children \u2014 what chores do your kids do? For those without \u2014 "
        "how do you delegate or share responsibilities with roommates, partners, or family members? "
        "What could you start delegating this week?'"
    )

    # ── CHAPTER 5: COMMON CHALLENGES ──────────────────────────────────────
    pdf.chapter_heading(5, "Common Challenges")

    pdf.slide_heading(17, "Section Divider")
    pdf.body_text("Transition: 'We've learned the tools. Now let's talk about what gets in the way.'")

    pdf.slide_heading(18, "Time Management Dangers \u2014 Flip Cards")
    pdf.body_text(
        "Five interactive flip cards reveal common dangers:\n"
        "1. Distractions \u2014 Phones, social media, notifications pull attention away\n"
        "2. Procrastination \u2014 Putting things off creates a guilt-panic cycle\n"
        "3. Multitasking \u2014 Doing many things at once slows you down and increases mistakes\n"
        "4. Over-Commitment \u2014 Not saying 'no' leads to burnout\n"
        "5. No Structure \u2014 Without routines, days become chaotic and goals slip away\n\n"
        "Preview all five dangers, then explain you'll go deeper into each one in the following slides."
    )

    pdf.slide_heading(19, "Technology Distractions")
    pdf.body_text(
        "This slide includes a GROUP ACTIVITY: Have students count the notifications on their "
        "phones right now. On iPhone, swipe down from the top left. On Android, pull down the "
        "notification shade.\n\n"
        "This is eye-opening \u2014 most students will be surprised by the number. "
        "Use the data to discuss how each notification is a deliberate interruption of focus."
    )
    pdf.discussion_prompt(
        "After the activity, ask: 'Who had the most notifications? What apps are sending them? "
        "What strategies do you use \u2014 or plan to use \u2014 to stay focused? What could you "
        "turn off right now?'"
    )

    pdf.slide_heading(20, "Video: Technology Distractions")
    pdf.body_text(
        "Play the embedded video on how smartphones sabotage focus. "
        "After the video, allow time for reflection on practical tips students plan to implement."
    )

    pdf.slide_heading(21, "Procrastination")
    pdf.body_text(
        "Definition: Procrastination is the act of putting off something until a later time. "
        "The cycle: Procrastinate \u2192 Make excuses \u2192 Feel guilty \u2192 Panic \u2192 Repeat.\n\n"
        "Key message: Procrastination is a habit that can be broken. Normalize it \u2014 everyone "
        "procrastinates sometimes. The goal is to recognize the pattern and interrupt it."
    )
    pdf.discussion_prompt(
        "Ask: 'What is one thing you've been putting off? What's the REAL reason you haven't "
        "started it yet? Is it fear? Overwhelm? Not knowing where to begin?' "
        "Help students identify the root cause, not just the behavior."
    )

    pdf.slide_heading(22, "Video: Breaking Procrastination")
    pdf.body_text("Play the embedded video on breaking the procrastination cycle. "
                  "Connect the strategies in the video to the tools already covered (planners, SMART goals).")

    pdf.slide_heading(23, "Multitasking")
    pdf.body_text(
        "Four negative impacts of multitasking:\n"
        "\u2022 Inefficiency \u2014 Switching between tasks wastes time and mental energy\n"
        "\u2022 More Mistakes \u2014 Divided attention leads to errors and lower quality\n"
        "\u2022 Reduced Creativity \u2014 Deep thinking requires focused, uninterrupted time\n"
        "\u2022 Stress & Burnout \u2014 Chronic multitasking increases stress and drains energy\n\n"
        "Many students (and employers!) view multitasking as a positive skill. "
        "This section challenges that assumption with evidence."
    )

    pdf.slide_heading(24, "Video: Multitasking")
    pdf.body_text("Play the embedded video on what multitasking does to the brain. "
                  "This provides research-backed evidence for why single-tasking is more effective.")

    pdf.slide_heading(25, "Over-Commitment")
    pdf.body_text(
        "The inability to say 'No' leads to spreading yourself too thin. "
        "Key message: Setting boundaries is a skill, not selfishness. It protects your priorities.\n\n"
        "This is especially relevant for adult learners who often feel pressure to say yes to everything "
        "at work, at home, and in their community."
    )
    pdf.discussion_prompt(
        "Ask: 'Identify situations where you struggle with saying no. What are polite but effective "
        "ways to decline?' Practice together: 'I appreciate you thinking of me, but I can't commit "
        "to this right now.' / 'Unfortunately, now isn't a good time for me.'"
    )

    pdf.slide_heading(26, "Lack of Structure & Routine")
    pdf.body_text(
        "Without daily structure, it's easy to let time slip away on things that don't move you forward. "
        "Small, consistent habits compound into big results over time.\n\n"
        "Practical suggestions from the slide: Focus on one task at a time, learn something new for "
        "20 minutes a day, create a 'digital sunset' each evening, use a Weekly Reset Sunday routine."
    )

    pdf.slide_heading(27, "Video: Atomic Habits")
    pdf.body_text(
        "Play the video on habit formation. Connect it to the concept of building small routines "
        "that compound over time. Mention the book 'Atomic Habits' by James Clear as a recommended resource."
    )
    pdf.teaching_tip(
        "Another great resource to share: the free audiobook 'Make Your Bed' by Admiral William H. McRaven "
        "on YouTube. It reinforces how small daily disciplines create momentum."
    )

    # ── CHAPTER 6: EVALUATION ─────────────────────────────────────────────
    pdf.chapter_heading(6, "Evaluation")

    pdf.slide_heading(28, "Section Divider: Check Your Knowledge")
    pdf.body_text("Transition: 'Let's check what you've learned and reflect on how you'll apply it.'")

    pdf.slide_heading(29, "Exit Ticket")
    pdf.body_text(
        "Three reflection questions:\n"
        "1. What did you learn today?\n"
        "2. What tips do you plan to use to better manage your time?\n"
        "3. What is one thing you will change starting today?\n\n"
        "These can be completed on index cards or exit ticket slips. "
        "Collect them to inform follow-up instruction. Allow 2-3 volunteers to share aloud."
    )
    pdf.handout_reference(
        "Pre/Post Test & Rubric",
        "Administer the post-test now if you gave the pre-test at the beginning. "
        "Use the rubric for formal assessment of student participation and learning."
    )

    # ── CHAPTER 7: APPLICATION ────────────────────────────────────────────
    pdf.chapter_heading(7, "Application")

    pdf.slide_heading(30, "Section Divider: Put It Into Practice")
    pdf.body_text("Transition: 'Knowledge without action is wasted. Let's put this into practice.'")

    pdf.slide_heading(31, "Round Robin: How Will You Put Your TIME to Use?")
    pdf.body_text(
        "This is a structured peer discussion activity. Five questions:\n"
        "1. What are the most important concepts you learned?\n"
        "2. How will you use this information?\n"
        "3. What steps can you take to learn more?\n"
        "4. Who can you share what you've learned with?\n"
        "5. What is one question you still have?\n\n"
        "ACTIVITY INSTRUCTIONS:\n"
        "Each student picks one question and writes it on a blank sheet. Papers pass to the right. "
        "Each person writes their response to the question they receive. Papers keep passing until "
        "they return to the original owner. Each student reads the accumulated responses aloud. "
        "Facilitate a whole-class discussion from the summaries."
    )
    pdf.handout_reference(
        "Daily Planner & Weekly Planner",
        "Reference these again \u2014 encourage students to start using them immediately."
    )
    pdf.teaching_tip(
        "If you have more than 5 students, put them in groups. Adjust the activity to fit your class size. "
        "The key is that every student both writes and reads, creating active engagement."
    )

    pdf.slide_heading(32, "Closing Slide: 'Own Your Time'")
    pdf.body_text(
        "Quote: 'Time is what we want most, but what we use worst.'\n\n"
        "Congratulate students on completing the lesson. A confetti animation celebrates "
        "the achievement. Remind students to take their planners and worksheets home "
        "and start using them today."
    )
    pdf.discussion_prompt(
        "Final round: 'In one word, describe how you feel about managing your time now "
        "compared to when we started.' Go around the room for a quick closing check-in."
    )

    out = "C:/Users/Instructor/Dev/Employability Skills Curriculum/lesson-time-management/Teacher-Resources/Time_Management_Presenter_Notes.pdf"
    pdf.output(out)
    print(f"Created: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# LESSON 3: INTERVIEW SKILLS
# ═══════════════════════════════════════════════════════════════════════════════

def build_interview_skills():
    pdf = PresenterNotesPDF(
        "Interview Skills",
        "Mastering Key Techniques to Secure Your Dream Job"
    )
    pdf.title_page()

    # ── Materials checklist ────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_font("body", "B", 14)
    pdf.set_text_color(*pdf.DARK)
    pdf.cell(0, 10, "Before You Begin: Materials Checklist")
    pdf.ln(12)
    pdf.body_text(
        "Gather and prepare these materials before class. Handouts are available "
        "as downloadable files in the lesson sidebar and the Handouts folder."
    )
    pdf.bullet_list([
        "STAR Interview Worksheet \u2014 'Shine Bright with STAR Interviews!' (one per student)",
        "Interview Skills Rubric (one per student for mock interview peer feedback)",
        "ChatGPT Interview Practice prompts document (one per student or displayed on screen)",
        "Interview Skills Lesson Plan (for your reference \u2014 includes timing and objectives)",
        "A variety of classroom objects for the 'Sell an Object' warm-up activity",
        "Projector or screen for lesson presentation and 2 embedded videos",
        "Whiteboard or flip chart for listing class responses",
        "Devices with internet access for ChatGPT practice activity (smartphones or laptops)",
        "Thank-you note template or examples (optional, for follow-up discussion)",
        "Estimated lesson time: 2\u20132.5 hours",
    ])
    pdf.ln(4)
    pdf.teaching_tip(
        "For the 'Sell an Object' warm-up, scatter 8-10 interesting or unusual objects around the room "
        "before students arrive. Staplers, tape dispensers, coffee mugs, pens, binder clips \u2014 the more "
        "mundane the better, because the challenge is making something ordinary sound extraordinary."
    )

    # ── CHAPTER 1: INTRODUCTION ───────────────────────────────────────────
    pdf.chapter_heading(1, "Introduction & Warm-Up")

    pdf.slide_heading(1, "Title Slide")
    pdf.body_text(
        "Welcome students and introduce the lesson: Interview Skills for Employment Success. "
        "Set expectations: 'By the end of today, you'll have practiced real interview techniques, "
        "answered tough questions using a proven framework, and built the confidence to walk "
        "into any interview prepared.'"
    )

    pdf.slide_heading(2, "Warm-Up Activity: Sell an Object!")
    pdf.body_text(
        "This icebreaker is the foundation of the lesson. Students choose a classroom object and "
        "create a 60-second pitch highlighting creative uses and unique selling points.\n\n"
        "WHY THIS WORKS: The activity mirrors interview dynamics \u2014 both require quick thinking, "
        "clear communication, and persuasive reasoning. In an interview, you're essentially 'selling' "
        "yourself as the best candidate. This exercise warms up those same muscles.\n\n"
        "INSTRUCTIONS:\n"
        "\u2022 Give students 3-5 minutes to brainstorm individually or in pairs\n"
        "\u2022 Each person/group presents their 60-second pitch\n"
        "\u2022 After all pitches, discuss the connection to interviewing"
    )
    pdf.discussion_prompt(
        "After the pitches, ask: 'What made some pitches more convincing than others? "
        "What skills did you use \u2014 creativity, confidence, clear communication? "
        "How does selling an object connect to selling yourself in an interview?'"
    )
    pdf.teaching_tip(
        "Keep the energy high and positive. Applaud every pitch. If students are shy, let them "
        "work in pairs first. The goal is to get everyone talking and comfortable before the "
        "more structured content begins."
    )

    # ── CHAPTER 2: UNDERSTANDING INTERVIEWS ───────────────────────────────
    pdf.chapter_heading(2, "Understanding Interviews")

    pdf.slide_heading(3, "Section Divider")
    pdf.body_text("Transition: 'Now that we're warmed up, let's break down what an interview "
                  "actually is and why it matters.'")

    pdf.slide_heading(4, "What Is an Interview?")
    pdf.body_text(
        "Four key aspects:\n"
        "\u2022 Definition & Purpose: A structured conversation to assess mutual fit, skills, and readiness\n"
        "\u2022 Employer Perspective: Evaluating cultural fit and job requirements\n"
        "\u2022 Candidate Perspective: Showcasing qualifications and assessing the organization\n"
        "\u2022 Interview Formats: In-person, phone, video, panel\n\n"
        "Emphasize the word 'mutual' \u2014 an interview is a two-way street. The employer is "
        "evaluating the candidate, but the candidate is also evaluating whether this is the right "
        "place to work. This reframe reduces anxiety: you're not just being judged, you're also choosing."
    )
    pdf.discussion_prompt(
        "Ask: 'Has anyone here been on a job interview before? What format was it \u2014 in-person, "
        "phone, video? What was the hardest part?' Let a few students share to establish baseline experience."
    )

    pdf.slide_heading(5, "Interviewing Is a Skill")
    pdf.body_text(
        "Four cards reinforce that interviewing improves with practice:\n"
        "\u2022 Practice Enhances Skill \u2014 Mock interviews build confidence\n"
        "\u2022 Preparation Reduces Anxiety \u2014 Knowing what to expect calms nerves\n"
        "\u2022 Learning from Feedback \u2014 Rubrics and peer reviews refine your approach\n"
        "\u2022 Simulating Real Scenarios \u2014 Practice builds readiness\n\n"
        "This is a critical mindset shift. Many students believe some people are 'naturally good' "
        "at interviews. Emphasize that interviewing is a learnable skill, like riding a bike. "
        "The more you practice, the better you get."
    )

    pdf.slide_heading(6, "The Interview Process \u2014 5 Phases")
    pdf.body_text(
        "A timeline showing the interview lifecycle:\n"
        "1. Preparation Phase \u2014 Research, review job description, practice\n"
        "2. Beginning of Interview \u2014 Greetings, introductions, positive tone\n"
        "3. Core Discussion \u2014 Main conversation and Q&A\n"
        "4. Closing \u2014 Final questions, express interest\n"
        "5. Follow-Up \u2014 Thank-you note, reflection\n\n"
        "Walk through each phase briefly. Students often focus only on the 'middle' \u2014 the questions. "
        "But preparation and follow-up are just as important and often overlooked."
    )

    pdf.slide_heading(7, "Inspirational Quote")
    pdf.body_text(
        "'Every interview is a chance to grow. The more you practice, the more confident you become.'\n\n"
        "Let this sink in. Reinforce that even interviews that don't lead to a job offer are valuable "
        "practice and learning experiences."
    )

    # ── CHAPTER 3: PREPARING FOR THE INTERVIEW ────────────────────────────
    pdf.chapter_heading(3, "Preparing for the Interview")

    pdf.slide_heading(8, "Section Divider")
    pdf.body_text("Transition: 'Preparation is the foundation of a great interview. "
                  "Let's talk about what to do BEFORE you walk in the door.'")

    pdf.slide_heading(9, "Preparation Tips")
    pdf.body_text(
        "Four preparation essentials:\n"
        "1. Research the Employer \u2014 Mission, culture, recent news\n"
        "2. Review the Job Description \u2014 Study requirements carefully and align your skills\n"
        "3. Practice Interview Questions \u2014 Rehearse common questions out loud\n"
        "4. Plan Attire & Arrival \u2014 Professional clothing, arrive 10-15 minutes early\n\n"
        "Stress that MOST interview anxiety comes from lack of preparation. "
        "When you've done your homework, you walk in with confidence."
    )

    pdf.slide_heading(10, "Researching the Employer")
    pdf.body_text(
        "Three panels on research:\n"
        "\u2022 Understand Company Overview: Purpose, goals, products, culture\n"
        "\u2022 Learn Company Culture: Values, employee reviews, team structure\n"
        "\u2022 Demonstrate Initiative: Reference specific achievements, ask informed questions\n\n"
        "Show students HOW to research: visit the company website, check their 'About' page, "
        "read recent news articles, look at Glassdoor reviews. Knowing specific facts about the "
        "company lets you tailor your answers and shows genuine interest."
    )
    pdf.discussion_prompt(
        "Activity: 'Pick a company you'd like to work for. In 3 minutes, find three facts about them "
        "using your phone. What's their mission? What products or services do they offer? "
        "What's their culture like?' Have students share what they found."
    )

    pdf.slide_heading(11, "Quote: 'Walk in prepared. Walk out confident.'")
    pdf.body_text("Brief pause to reinforce the preparation message before moving to presentation skills.")

    # ── CHAPTER 4: PROFESSIONAL PRESENTATION ──────────────────────────────
    pdf.chapter_heading(4, "Professional Presentation")

    pdf.slide_heading(12, "Section Divider")
    pdf.body_text("Transition: 'Preparation is what you do before. Now let's talk about "
                  "how you present yourself during the interview.'")

    pdf.slide_heading(13, "Dress for Success")
    pdf.body_text(
        "Key points:\n"
        "\u2022 Appropriate attire shows professionalism and respect\n"
        "\u2022 Match company culture and industry expectations\n"
        "\u2022 Clean grooming and minimal accessories\n"
        "\u2022 'Dress for the job you want, not the job you have'\n\n"
        "Be sensitive here \u2014 some students may not have professional attire. "
        "Suggest thrift stores, community resources, or Dress for Success organizations. "
        "Emphasize that clean and neat matters more than expensive."
    )
    pdf.discussion_prompt(
        "Ask: 'What would you wear to an interview at a bank? At a construction company? "
        "At a restaurant? How would you find out what's appropriate?' Discuss how to research "
        "dress codes for different industries."
    )

    pdf.slide_heading(14, "Video: What Should I Wear to a Job Interview?")
    pdf.body_text("Play the embedded video. After watching, ask students what tips they'll remember.")

    pdf.slide_heading(15, "Body Language Matters")
    pdf.body_text(
        "Hero statement: 'Your body speaks before you say a word.'\n\n"
        "\u2022 Positive Signals: Smile, eye contact, open gestures, genuine enthusiasm\n"
        "\u2022 Posture & Engagement: Sit upright, lean slightly forward, nod to show listening\n"
        "\u2022 Avoid: Fidgeting, checking phone, crossing arms, slouching\n\n"
        "Non-verbal communication accounts for a huge portion of first impressions. "
        "Have students practice right now \u2014 sit up straight, make eye contact with a partner, "
        "and smile. It feels different immediately."
    )
    pdf.teaching_tip(
        "Quick activity: Have students pair up and practice introducing themselves with a firm "
        "handshake, eye contact, and a smile. Give 30 seconds each direction. "
        "This kinesthetic practice is more effective than just talking about it."
    )

    pdf.slide_heading(16, "Video: 7 Body Language Tips")
    pdf.body_text("Play the embedded video on body language tips for interviews.")

    pdf.slide_heading(17, "Basic Interview Tips")
    pdf.body_text(
        "Four practical tips:\n"
        "1. Timeliness & Politeness \u2014 Arrive early, be courteous to everyone (receptionist too!)\n"
        "2. Confident Introduction \u2014 Firm handshake, energy and warmth\n"
        "3. Come Prepared \u2014 Multiple resume copies, notepad, pen\n"
        "4. Assertive Body Language \u2014 Maintain eye contact, express enthusiasm\n\n"
        "Emphasize the 'be polite to everyone' point. Many employers ask the receptionist "
        "or other staff about how candidates behaved in the lobby."
    )

    # ── CHAPTER 5: INTERVIEW TECHNIQUES & FOLLOW-UP ───────────────────────
    pdf.chapter_heading(5, "Interview Techniques & Follow-Up")

    pdf.slide_heading(18, "Section Divider")
    pdf.body_text("Transition: 'Now for the heart of the lesson \u2014 how to actually answer "
                  "interview questions effectively using a proven method.'")

    pdf.slide_heading(19, "The STAR Method")
    pdf.body_text(
        "The STAR method is a structured approach for answering behavioral interview questions:\n\n"
        "S \u2014 SITUATION: Describe a specific event or situation (not a generalized description). "
        "Give enough detail for the interviewer to understand the context.\n\n"
        "T \u2014 TASK: Explain what you needed to accomplish and your specific role.\n\n"
        "A \u2014 ACTION: Describe what YOU did. Focus on your actions, not the team's. "
        "Use past tense \u2014 tell what you DID, not what you would do.\n\n"
        "R \u2014 RESULT: Share the outcome. What happened? What did you accomplish? "
        "What did you learn?\n\n"
        "WHY USE STAR: It gives clear, focused answers that show problem-solving, "
        "decision-making, and real impact."
    )
    pdf.teaching_tip(
        "Important coaching point: If the outcome was bad, tell students to point out what they "
        "LEARNED from the experience. Example: 'What I learned is that in the future, I will "
        "[better approach]. I now know how to respond properly.' Turning negatives into growth "
        "stories is a powerful interview technique."
    )

    pdf.slide_heading(20, "STAR Example 1: Handling Stress")
    pdf.body_text(
        "Interview question: 'Tell me about a time you faced a stressful situation.'\n\n"
        "(S-T) Worked five 12-hour shifts, asked to stay because of urgent exam requests.\n"
        "(A) Agreed to stay, worked as a team, prioritized critical exams.\n"
        "(R) Turned a stressful situation into a manageable one; patients well cared for.\n\n"
        "Walk through each STAR component. Point out how specific and concrete the answer is \u2014 "
        "no vague generalities, just a clear story with a positive outcome."
    )

    pdf.slide_heading(21, "STAR Example 2: Upset Customer")
    pdf.body_text(
        "Interview question: 'Tell me about dealing with an upset customer or coworker.'\n\n"
        "(S-T) Nursing home: family member complained room hadn't been cleaned in 2 days.\n"
        "(A) Reassured the family, reported to supervisor, housekeeper assigned immediately.\n"
        "(R) Family pleased with quick response; patient well cared for.\n\n"
        "Highlight how the candidate took initiative, communicated up the chain, and achieved "
        "a positive resolution. These are exactly the qualities employers want to see."
    )
    pdf.discussion_prompt(
        "Ask: 'Can someone give me an example of a stressful work or school situation they've faced? "
        "Let's walk through it together using STAR.' Coach one student through the framework live "
        "so the class can see how it works in real time."
    )

    pdf.slide_heading(22, "STAR Method Practice Activity")
    pdf.body_text(
        "Students practice applying STAR to four scenarios using the worksheet:\n"
        "1. Handling a challenging or upset customer\n"
        "2. Resolving a conflict with a coworker\n"
        "3. Reflecting on a decision and what you learned\n"
        "4. Responding to a colleague's mistake or policy breach\n\n"
        "Give students 15-20 minutes. Walk around to provide support and answer questions. "
        "Remind them to use specific, real examples and past tense."
    )
    pdf.handout_reference(
        "STAR Interview Worksheet: 'Shine Bright with STAR Interviews!'",
        "Distribute now. Students write STAR responses for each scenario."
    )

    pdf.slide_heading(23, "Questions to Ask the Interviewer")
    pdf.body_text(
        "Five suggested questions, with the most important one starred:\n"
        "1. Describe characteristics of the person best suited for this job?\n"
        "2. What advancement opportunities are available?\n"
        "3. What type of people do well in this position \u2014 and who doesn't?\n"
        "4. Are there reservations about my fit you'd like me to address?\n"
        "5. [MUST ASK]: When will you make a decision and how will I be notified?\n\n"
        "Explain that asking questions shows genuine interest and preparation. "
        "Question #4 is bold but powerful \u2014 it gives you a chance to address any concerns "
        "before you leave. Question #5 sets clear expectations for follow-up."
    )
    pdf.discussion_prompt(
        "Ask: 'Which of these questions would you feel most comfortable asking? Which feels "
        "scariest? Why is it important to ask about the timeline (question #5)?'"
    )

    pdf.slide_heading(24, "During & Closing the Interview")
    pdf.body_text(
        "Three panels:\n"
        "\u2022 While You're There: Good posture, organize thoughts, refer to resume, express willingness to learn\n"
        "\u2022 Wrapping Up: Ask prepared questions, thank sincerely, shake hands, express interest\n"
        "\u2022 Follow-Up Etiquette: Thank you within 24 hours, reflect on performance, follow up after 1 week\n\n"
        "Stress the importance of the 'last impression' \u2014 how you close is as memorable as how you open."
    )

    pdf.slide_heading(25, "ChatGPT Interview Practice Activity")
    pdf.body_text(
        "This innovative activity uses AI for self-directed interview practice:\n\n"
        "Step 1: Choose a job you're interested in\n"
        "Step 2: Open ChatGPT (free version works)\n"
        "Step 3: Paste the provided prompt (on the slide and in the handout)\n"
        "Step 4: Answer questions as if it were a real interview\n"
        "Step 5: Ask ChatGPT for feedback on your answers\n\n"
        "The prompt instructs ChatGPT to ask one question at a time, cover key interview areas, "
        "and provide constructive feedback. This is a tool students can use anytime on their own."
    )
    pdf.handout_reference(
        "ChatGPT Interview Practice Prompts",
        "Distribute or display on screen. Contains the full prompt and instructions."
    )
    pdf.teaching_tip(
        "If time allows, have students do this activity in class (20-30 minutes). "
        "If time is short, assign it as homework. Either way, emphasize this is a tool they can "
        "use repeatedly to practice for real interviews."
    )

    # ── CHAPTER 6: EVALUATION ─────────────────────────────────────────────
    pdf.chapter_heading(6, "Evaluation")

    pdf.slide_heading(26, "Section Divider: Check Your Knowledge")
    pdf.body_text("Transition: 'Let's reflect on what you've learned today.'")

    pdf.slide_heading(27, "Exit Ticket")
    pdf.body_text(
        "Three reflection questions:\n"
        "1. Name two things you will do before your next interview to prepare\n"
        "2. Describe how you would use the STAR method for behavioral questions\n"
        "3. What question will you ask an employer and why?\n\n"
        "These can be completed on paper or verbally. Collect written responses to assess learning."
    )
    pdf.handout_reference(
        "Interview Skills Rubric",
        "Use for evaluating exit ticket responses and mock interview performance."
    )

    # ── CHAPTER 7: APPLICATION ────────────────────────────────────────────
    pdf.chapter_heading(7, "Application")

    pdf.slide_heading(28, "Section Divider: Put It Into Practice")
    pdf.body_text("Transition: 'The best way to learn interviewing is to DO it. Let's practice.'")

    pdf.slide_heading(29, "Mock Interview Round Robin")
    pdf.body_text(
        "This is the main practice activity. Partners take turns as interviewer and candidate.\n\n"
        "Four standard interview questions:\n"
        "1. Tell me about yourself and why you're interested in this position\n"
        "2. Describe a time you solved a difficult problem\n"
        "3. What are your greatest strengths and one area you're improving?\n"
        "4. Where do you see yourself in five years?\n\n"
        "PEER FEEDBACK FORMAT: 2 positives + 1 suggestion (using the Interview Rubric).\n\n"
        "Allow 30-40 minutes total. Each partner gets 10-15 minutes to be the candidate. "
        "Rotate partners if time allows so students practice with different 'interviewers.'"
    )
    pdf.teaching_tip(
        "Set up the room to feel like a real interview: chairs facing each other, no desks between. "
        "Remind students to practice everything: handshake, eye contact, posture, STAR answers, "
        "asking a closing question. The more realistic, the more valuable."
    )
    pdf.discussion_prompt(
        "After the round robin, debrief as a class: 'What was the hardest question to answer? "
        "What feedback surprised you? What will you do differently in a real interview?'"
    )

    pdf.slide_heading(30, "Follow-Up Etiquette")
    pdf.body_text(
        "Three-step timeline:\n"
        "1. Within 24 Hours: Send a personalized thank-you note (handwritten or email)\n"
        "2. Reflect: Review the interview for strengths and improvement areas\n"
        "3. After One Week: Make a courteous follow-up call if no response\n\n"
        "Many students don't realize that a thank-you note is expected. Explain that it keeps you "
        "top of mind and demonstrates professionalism. Show an example if you have one."
    )
    pdf.discussion_prompt(
        "Ask: 'Have you ever sent a thank-you note after an interview? What would you say in one?' "
        "Practice together: draft a 2-3 sentence thank-you note as a class."
    )

    pdf.slide_heading(31, "Closing Slide")
    pdf.body_text(
        "Quote: 'The secret of getting ahead is getting started. Every interview brings you one step "
        "closer to your dream job.'\n\n"
        "Closing message: 'Go get that job \u2014 you've got this!' Confetti animation plays.\n\n"
        "Thank students for their participation and courage in practicing. Remind them to use the "
        "STAR method, the ChatGPT practice tool, and the follow-up checklist for their next real interview."
    )
    pdf.discussion_prompt(
        "Final round: 'Complete this sentence: After today, I feel more confident about interviews "
        "because ___.' Go around the room for a quick positive closing."
    )

    # ── Assessment note ───────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_font("body", "B", 14)
    pdf.set_text_color(*pdf.DARK)
    pdf.cell(0, 10, "Assessment & Follow-Up")
    pdf.ln(12)
    pdf.body_text(
        "Use the Interview Skills Rubric to evaluate student performance across these areas:"
    )
    pdf.bullet_list([
        "STAR Worksheet quality \u2014 Are responses specific, using real examples in past tense?",
        "Mock interview performance \u2014 Eye contact, handshake, posture, confidence, STAR usage",
        "Peer feedback quality \u2014 Did students provide constructive 2+1 feedback?",
        "Exit ticket responses \u2014 Can students articulate preparation steps and STAR structure?",
        "Class participation \u2014 Engagement in warm-up, discussions, and practice activities",
    ])
    pdf.ln(4)
    pdf.teaching_tip(
        "Consider scheduling a follow-up session where students report back on real interviews they've "
        "had. This creates accountability and allows the class to celebrate successes together."
    )

    out = "C:/Users/Instructor/Dev/Employability Skills Curriculum/Interview-Skills/Teacher-Resources/Interview_Skills_Presenter_Notes.pdf"
    pdf.output(out)
    print(f"Created: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    build_accountability()
    build_time_management()
    build_interview_skills()
    print("\nAll presenter notes generated successfully!")
