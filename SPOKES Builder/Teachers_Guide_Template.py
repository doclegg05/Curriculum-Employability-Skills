"""
=============================================================================
SPOKES TEACHER'S GUIDE TEMPLATE
=============================================================================

Use this template to create a Teacher's Guide PDF for any new SPOKES lesson.
Copy this file, rename it, and fill in the sections below.

PREREQUISITES:
  - Python 3.x with fpdf2 installed (pip install fpdf2)
  - The TeachersGuidePDF class from generate_teachers_guides.py
  - SPOKES-Logo.png in the curriculum root folder

QUICK START:
  1. Copy this file to the lesson folder
  2. Fill in the LESSON CONFIG section
  3. Define your THEME (or use THEME_SPOKES_DEFAULT)
  4. Write your chapters using the builder methods
  5. Run: python Your_Lesson_Teachers_Guide.py

=============================================================================
DOCUMENT STRUCTURE
=============================================================================

Every Teacher's Guide follows this structure:

  PAGE 1      Cover Page (auto-generated)
              - SPOKES logo centered
              - Lesson title and subtitle
              - "Teacher's Guide" heading
              - Description paragraph
              - Copyright footer

  PAGE 2      Table of Contents (auto-generated from chapter list)
              - WIPPEA badge | Chapter title | Slide range
              - Checklist reminder at bottom

  PAGES 3+    Chapter Pages (you write these)
              - Chapter heading with WIPPEA banner
              - Slide entries with speaking notes
              - Discussion prompts, teaching tips, handout callouts

  LAST PAGE   Materials Checklist (auto-generated from item list)
              - Checkbox table: Resource name | Location

=============================================================================
WIPPEA FRAMEWORK
=============================================================================

Every SPOKES lesson follows the WIPPEA instructional sequence.
Each chapter heading uses a WIPPEA badge letter:

  W = Warm-Up          Opening activity to engage learners
  I = Introduction      Lesson objectives and context
  P = Presentation      Core content (can repeat for multiple sections)
  E = Evaluation        Knowledge checks, exit tickets, assessments
  A = Application       Practice activities, real-world application

=============================================================================
BUILDER METHODS REFERENCE
=============================================================================

All methods are called on the `pdf` object (a TeachersGuidePDF instance):

--- STRUCTURE ---

  pdf.cover_page()
      Auto-generates the cover page. Call once at the start.

  pdf.toc(chapters)
      Auto-generates the table of contents.
      chapters = list of tuples: (badge, title, slide_range)
      Example:
        pdf.toc([
            ("W", "Chapter 1: Warm-Up",           "Slides 1-3"),
            ("I", "Chapter 2: Introduction",       "Slides 4-6"),
            ("P", "Chapter 3: Core Content",       "Slides 7-15"),
            ("E", "Chapter 4: Evaluation",         "Slides 16-18"),
            ("A", "Chapter 5: Application",        "Slides 19-22"),
        ])

  pdf.chapter_head(badge, title, wippea_label)
      Starts a new page with a colored banner.
      badge       = "W", "I", "P", "E", or "A"
      title       = "CHAPTER 1: YOUR TITLE" (uppercase convention)
      wippea_label = "WARM-UP", "INTRODUCTION", "PRESENTATION",
                     "EVALUATION", or "APPLICATION"
      Example:
        pdf.chapter_head("W", "CHAPTER 1: WARM-UP", "WARM-UP")

--- SLIDE CONTENT ---

  pdf.slide_entry(num, title, slide_type="")
      Renders a slide heading with number and title.
      num        = slide number (int or string like "12-13")
      title      = slide title as shown in the presentation
      slide_type = optional label: "Section Title", "Big Statement",
                   "Video Slide", "Interactive Tabs", "Round Robin", etc.
      Example:
        pdf.slide_entry(1, "Title Slide")
        pdf.slide_entry(5, "Goal Statement", "Big Statement")
        pdf.slide_entry("12-13", "Key Habits (Two Slides)")

  pdf.speaking_notes(text)
      Instructor speaking notes for the current slide.
      Use \\n for line breaks within the text.
      Example:
        pdf.speaking_notes(
            "Welcome students and introduce the topic. "
            "Set the tone by explaining the importance of this skill."
        )

  pdf.discussion(text)
      Green-bordered discussion prompt box.
      Use for questions that instructors should ask the class.
      Example:
        pdf.discussion(
            "Ask: 'What does accountability mean to you?' "
            "Accept a few quick responses to gauge where the class is."
        )

  pdf.tip(text)
      Gold-bordered teaching tip box.
      Use for facilitation advice, activity variations, timing notes.
      Example:
        pdf.tip(
            "If the class is large, split into groups of 4-5 "
            "for the discussion before sharing with the whole class."
        )

  pdf.materials(text)
      Blue-bordered handout reference box.
      Use to indicate when to distribute a specific handout.
      Reference handouts by their friendly title, NOT the filename.
      Example:
        pdf.materials("Self-Assessment Worksheet -- distribute now.")
        pdf.materials("Daily Planner and Weekly Planner templates")

  pdf.video(title)
      Inline video callout (single line, no box).
      Use on video slides to name the video being played.
      Example:
        pdf.video("How Smartphones Sabotage Your Brain's Ability to Focus")

--- CLOSING ---

  pdf.checklist(items)
      Auto-generates the Materials Checklist page.
      items = list of tuples: (resource_name, location)
      Use friendly names, not filenames. Location is typically
      "Handouts folder" or a brief instruction.
      Example:
        pdf.checklist([
            ("Self-Assessment Worksheet",  "Handouts folder"),
            ("Daily Planner",              "Handouts folder"),
            ("Rubric",                     "Handouts folder"),
            ("Classroom supplies",         "Gather markers and flip chart"),
        ])

=============================================================================
THEME CONFIGURATION
=============================================================================

Each theme is a dictionary with these required keys:

  COLORS (all RGB tuples):
    primary        Main brand color (headings, links, slide titles)
    accent         Secondary color (discussion prompt borders)
    dark           Dark background color (banners, sidebar)
    gold           Gold accent color (WIPPEA labels, tip boxes)
    gray           Neutral text color (secondary text, subtitles)
    light          Light background (alternating table rows, muted areas)
    mauve          Deep accent (used for Evaluation badges in some themes)
    text           Body text color
    white          White (usually 255, 255, 255)

  COVER PAGE:
    cover_grad_top Top half of cover background
    cover_grad_bot Bottom half of cover background
    accent_line    Color of accent stripe on cover and chapter banners

  WIPPEA BADGE COLORS:
    badge_w        Warm-Up badge background
    badge_i        Introduction badge background
    badge_p        Presentation badge background
    badge_e        Evaluation badge background
    badge_a        Application badge background

=============================================================================
"""

import sys
import os

# Add parent directory to path so we can import the PDF class
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from generate_teachers_guides import TeachersGuidePDF

LOGO = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "SPOKES-Logo.png")


# ═══════════════════════════════════════════════════════════════════════
# LESSON CONFIG — Edit these values for your lesson
# ═══════════════════════════════════════════════════════════════════════

LESSON_TITLE    = "Your Lesson Title"
LESSON_SUBTITLE = "Your Lesson Subtitle"
OUTPUT_PATH     = ""  # Set to the full path where the PDF should be saved


# ═══════════════════════════════════════════════════════════════════════
# THEME — Choose a preset or define a custom theme
# ═══════════════════════════════════════════════════════════════════════

# Default SPOKES theme (blue/green) — works for any lesson
THEME_SPOKES_DEFAULT = dict(
    primary=(0, 123, 175),       # #007baf  Professional Blue
    accent=(55, 181, 80),        # #37b550  Fresh Green
    dark=(0, 64, 113),           # #004071  Deep Navy
    gold=(211, 178, 87),         # #d3b257  Warm Gold
    gray=(96, 99, 107),          # #60636b  Neutral Gray
    light=(237, 243, 247),       # #edf3f7  Light Blue-Gray
    mauve=(167, 37, 63),         # #a7253f  Deep Mauve
    text=(51, 51, 51),           #          Body text
    white=(255, 255, 255),       #          White
    cover_grad_top=(0, 64, 113), #          Cover top half
    cover_grad_bot=(0, 19, 63),  #          Cover bottom half
    accent_line=(55, 181, 80),   #          Accent stripe color
    badge_w=(55, 181, 80),       #          Warm-Up = green
    badge_i=(0, 123, 175),       #          Introduction = blue
    badge_p=(0, 64, 113),        #          Presentation = dark
    badge_e=(167, 37, 63),       #          Evaluation = mauve
    badge_a=(211, 178, 87),      #          Application = gold
)

# Use the default, or replace with your custom theme dict
THEME = THEME_SPOKES_DEFAULT


# ═══════════════════════════════════════════════════════════════════════
# BUILD FUNCTION — Write your lesson content here
# ═══════════════════════════════════════════════════════════════════════

def build_guide():
    pdf = TeachersGuidePDF(LESSON_TITLE, LESSON_SUBTITLE, THEME)
    pdf.cover_page()

    # ── TABLE OF CONTENTS ──
    # List every chapter with its WIPPEA badge and slide range
    pdf.toc([
        ("W", "Chapter 1: Warm-Up",       "Slides 1-3"),
        ("I", "Chapter 2: Introduction",   "Slides 4-6"),
        ("P", "Chapter 3: Core Content",   "Slides 7-15"),
        ("E", "Chapter 4: Evaluation",     "Slides 16-18"),
        ("A", "Chapter 5: Application",    "Slides 19-22"),
    ])

    # ══════════════════════════════════════════════════════════════════
    # CHAPTER 1: WARM-UP
    # ══════════════════════════════════════════════════════════════════
    pdf.chapter_head("W", "CHAPTER 1: WARM-UP", "WARM-UP")

    pdf.slide_entry(1, "Title Slide")
    pdf.speaking_notes(
        "Welcome students and introduce the lesson topic. "
        "Set expectations for what they will learn today."
    )

    pdf.slide_entry(2, "Opening Activity")
    pdf.speaking_notes(
        "Describe the warm-up activity and how to facilitate it. "
        "Include timing guidance (e.g., 5-10 minutes)."
    )
    pdf.discussion(
        "Ask: 'Opening question that connects to the lesson topic?' "
        "Let 2-3 students share before moving on."
    )
    pdf.tip(
        "If the class is quiet, share your own answer first to "
        "model vulnerability and get the conversation started."
    )

    # ══════════════════════════════════════════════════════════════════
    # CHAPTER 2: INTRODUCTION
    # ══════════════════════════════════════════════════════════════════
    pdf.chapter_head("I", "CHAPTER 2: INTRODUCTION", "INTRODUCTION")

    pdf.slide_entry(3, "Section Divider", "Section Title")
    pdf.speaking_notes("Transition slide. Use it to bridge from warm-up to content.")

    pdf.slide_entry(4, "Learning Objectives")
    pdf.speaking_notes(
        "Walk through the objectives so students know what to expect:\n"
        "1. First objective\n"
        "2. Second objective\n"
        "3. Third objective"
    )

    # ══════════════════════════════════════════════════════════════════
    # CHAPTER 3: CORE CONTENT (PRESENTATION)
    # ══════════════════════════════════════════════════════════════════
    pdf.chapter_head("P", "CHAPTER 3: CORE CONTENT", "PRESENTATION")

    pdf.slide_entry(5, "Key Concept")
    pdf.speaking_notes("Explain the key concept. Provide context and examples.")
    pdf.materials("Worksheet Name -- distribute now for students to follow along.")

    pdf.slide_entry(6, "Watch: Video Title", "Video Slide")
    pdf.speaking_notes("Play the embedded video. Discuss afterward.")
    pdf.video("Full Video Title Here")

    pdf.slide_entry(7, "Interactive Activity", "Interactive Tabs")
    pdf.speaking_notes("Guide students through the interactive element on screen.")
    pdf.discussion(
        "After the activity, ask: 'What did you learn? "
        "How does this connect to the main concept?'"
    )

    # ══════════════════════════════════════════════════════════════════
    # CHAPTER 4: EVALUATION
    # ══════════════════════════════════════════════════════════════════
    pdf.chapter_head("E", "CHAPTER 4: EVALUATION", "EVALUATION")

    pdf.slide_entry(8, "Check Your Knowledge", "Section Title")
    pdf.speaking_notes("Transition into the evaluation section.")

    pdf.slide_entry(9, "Exit Ticket")
    pdf.speaking_notes(
        "Reflection questions:\n"
        "1. What did you learn today?\n"
        "2. What will you apply starting this week?\n"
        "3. What question do you still have?"
    )
    pdf.materials("Pre/Post Test and Rubric")
    pdf.tip("Collect exit tickets to inform follow-up instruction.")

    # ══════════════════════════════════════════════════════════════════
    # CHAPTER 5: APPLICATION
    # ══════════════════════════════════════════════════════════════════
    pdf.chapter_head("A", "CHAPTER 5: APPLICATION", "APPLICATION")

    pdf.slide_entry(10, "Put It Into Practice", "Section Title")
    pdf.speaking_notes("Transition into the application section.")

    pdf.slide_entry(11, "Group Activity", "Round Robin")
    pdf.speaking_notes("Describe the activity, instructions, and timing.")
    pdf.discussion(
        "Final round: 'In one sentence, what is the most important "
        "thing you learned today?' Go around the room."
    )

    pdf.slide_entry(12, "Closing Slide")
    pdf.speaking_notes(
        "Congratulate learners on completing the lesson. "
        "End with the motivational quote and encourage continued practice."
    )

    # ══════════════════════════════════════════════════════════════════
    # MATERIALS CHECKLIST
    # ══════════════════════════════════════════════════════════════════
    pdf.checklist([
        ("Worksheet Name",        "Handouts folder"),
        ("Rubric",                "Handouts folder"),
        ("Pre/Post Test",         "Handouts folder"),
        ("Lesson Plan",           "Handouts folder"),
        ("Classroom supplies",    "Gather markers and flip chart"),
    ])

    # ── Output ──
    pdf.output(OUTPUT_PATH)
    print(f"Created: {OUTPUT_PATH}")


# ═══════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    if not OUTPUT_PATH:
        print("ERROR: Set OUTPUT_PATH before running.")
        print("Example: OUTPUT_PATH = 'C:/path/to/lesson/Teacher-Resources/Your_Teachers_Guide.pdf'")
        sys.exit(1)
    build_guide()
