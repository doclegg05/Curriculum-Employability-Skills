"""Build the draft Money Management lesson plan (Word) in the WV Adult Basic Education template.

Reuses the layout of Teacher-Resources/Part2_Save_First_Lesson_Plan.docx (fonts, banners,
activity table, footer, logo) and swaps in the whole-lesson content below. Standard library only.

    python3 lesson-Money-Management/Handouts/build_money_management_lesson_plan.py

Source of every decision here: lesson-Money-Management/lesson-structure.md, the topic map in
docs/phase-2/money-management-tanf-snap-topics-2026-09-17.md, and docs/phase-2/round-2-lesson-structure.md.
"""

import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE.parent / "Teacher-Resources" / "Part2_Save_First_Lesson_Plan.docx"
OUTPUT = HERE / "Money_Management_Lesson_Plan.docx"
FIXED_ZIP_TIME = (2026, 11, 9, 0, 0, 0)

# ---------------------------------------------------------------- content

CATEGORIES = ["Resource Management", "Critical Thinking", "Applied Academic Skills", "Information Use", "Technology Use"]
TITLE = "Money Management"
SUBTITLE = "Whole Lesson Plan: DRAFT for team review, November 9, 2026"

TOPIC = ("Money Management, one lesson in WIPPEA order. A 2-hour core of eight team-built segments follows "
         "the money from coming in to being protected. Instructors add up to one more hour of optional "
         "extensions based on class size and pace. Jess, the fictional SNAP mom of two from Part 2, opens "
         "each segment; each activity keeps its own examples.")

STANDARDS = [
    "WS.RM: Manages Money",
    "AK.CTS: Plans and Organizes",
    "AK.CTS: Makes Sound Decisions",
    "AK.CTS: Thinks Critically",
    "AK.CTS: Reasons",
    "AK.CTS: Solves Problems (confirm wording against the framework)",
    "AK.AAS: Uses Mathematical Strategies and Procedures",
    "AK.AAS: Uses Reading Skills (confirm wording against the framework)",
    "WS.TU: Understands and Uses Technology (confirm; applies when the tool is an app)",
    "WS.IU: Locates Information (confirm wording against the framework)",
]

OBJECTIVES = [
    "1. Given a sample pay stub and a list of household costs, learners will find the take-home pay and sort "
    "each cost into what cash pays for and what SNAP pays for, as scored on rubric row 1. (Part 1)",
    "2. Given a fictional family's paydays in The Cushion Challenge, learners will make a plan to save a little "
    "before spending, choosing how much, where it is kept, and how it is made automatic, as scored on rubric "
    "row 1. (Part 2)",
    "3. Given sample small costs and a sample bill, learners will find the costs that drain money and figure out "
    "what each costs in a year, as scored on rubric row 2. (Parts 4 and 6)",
    "4. Given a sample week of money in and money out, learners will track it with one tool and name two ways "
    "to stretch money at the store, as scored on rubric row 2. (Part 3 & 5, content not yet built)",
    "5. Given sample offers and messages, learners will recognize buying pressure and scam warning signs and "
    "say when to walk away, as scored on rubric row 3. (Parts 8 and 7)",
    "6. Working in a group with a real-life money scenario card, learners will choose a smart response using "
    "tools from earlier in the lesson, as scored on rubric row 4. (Part 9)",
    "7. At the end of the lesson, each learner will choose one next step for this week and one place to ask "
    "for help (PATH, DoHS, 211, or FRN), recorded privately, as scored on rubric row 5. (Application)",
]

ASSESSMENT = [
    "Lesson rubric (Handouts/Money_Management_Rubric.pdf): five rows scored Exceeding 10, Meeting 8, "
    "Approaching 5, Emerging 2, doubled to a score out of 100. Rows 2 and 3 get revised once Parts 3 & 5 "
    "and 8 deliver their activities.",
    "Two knowledge checks, one in Practice and one in Evaluation (SPOKES-STANDARD.md Section 9). Questions "
    "are not written yet.",
    "One exit ticket at the end of Evaluation. Not written yet.",
    "My Money Plan (proposed): one line per segment, amounts optional, as Application evidence. Teacher "
    "observation of class votes, group work, and the scenario discussion.",
]

HANDOUTS = [
    "Lesson rubric: Handouts/Money_Management_Rubric.pdf (draft)",
    "My Money Plan, one per learner (proposed, not built). Until the teams approve it, use Part 2's My First "
    "Step cards: Teacher-Resources/Part2_My_First_Step_Cards.pdf",
    "Part 1 pay stub and cash or SNAP sort (Helena and Hilary; the sort is not built yet)",
    "Part 4 leak math table and Smart Plug matching (Whitney)",
    "Part 6 Lower Your Bills, Sheet 2: Review a Bill (Catherine)",
    "Part 7 CFPB fraud types scenario sort (Tyler and team)",
    "Part 9 scenario cards and the exit ticket (not built)",
]

ONLINE = [
    "Money Management intro animation, narrated, with captions: lesson-Money-Management/Money Management "
    "Intro (narrated).mp4 and intro-narration/money-management-intro.vtt",
    "The Cushion Challenge with the Meet Jess video: Part-2-Save-Money-Before-You-Spend-It-Britt/"
    "cushion-challenge.html",
    "Part 2 Teacher's Guide: Teacher-Resources/Part2_Save_First_Teachers_Guide.pdf",
    "Lesson flow, a two-page view of this plan for the team: lesson-Money-Management/lesson-flow.pdf",
]

EQUIPMENT = ["Computer, projector or smart board, and speakers", "Learner devices (optional)", "Pens or pencils"]

SEGMENT_STEPS = ("Each segment runs about 12 minutes: 1 minute Jess moment (one slide), 3 to 4 minutes to teach "
                 "one idea (2 or 3 slides), 6 minutes for the core activity, and 1 minute to add a line to My "
                 "Money Plan.")

# Each row: (stage, segment, minutes, [activity paragraphs], [materials])
ACTIVITY_PLAN = [
    ("Warm-up", "", "5 minutes",
     ["Play the narrated Money Management intro animation (captions on).",
      "Ask learners to name kinds of costs a family runs into. Take the kind of cost, never an amount."],
     ["Intro animation (captioned)", "Projector, speakers"]),
    ("Introduction", "", "5 minutes",
     ["Play the one-minute Meet Jess video, moved here from Part 2. Jess and her numbers are made up; no one "
      "shares their own money today.",
      "State the seven objectives and review the rubric once.", SEGMENT_STEPS],
     ["Meet Jess video (captioned)", "Rubric"]),
    ("Presentation", "Know and Plan: Part 1, Know Your Money (Helena and Hilary)", "12 minutes",
     ["Jess moment: payday, and her pay stub shows less than she expected. The owners write the slide.",
      "Teach: take-home pay, and what cash pays for versus what SNAP pays for.",
      "Core activity: read a pay stub, then sort money into cash and SNAP. [TEAM TO FINISH: nothing yet covers "
      "keeping cash and SNAP separate, and several raw materials assume a surplus budget.]",
      "Objective 1. Rubric row 1."],
     ["Pay stub and sort handout", "Slides: set at build"]),
    ("Presentation", "Know and Plan: Part 2, Save First (Britt)", "12 minutes",
     ["Jess moment: payday, and she decides to save before she spends.",
      "Teach: pay yourself first, keep it somewhere safe, make it automatic.",
      "Core activity: The Cushion Challenge in Class mode. The full game takes about 10 minutes of votes; until "
      "a short version exists, stop after Month 3 or let this segment run long.",
      "Objective 2. Rubric row 1."],
     ["The Cushion Challenge", "Part 2 Teacher's Guide"]),
    ("Presentation", "Keep More of It: Part 4, Money Leaks (Whitney)", "12 minutes",
     ["Jess moment: small costs that add up over a month. The owner writes the slide.",
      "Teach: a small daily cost is a big yearly cost.",
      "Core activity: leak math table and Smart Plug matching. Remove bank brand names before use (cite or "
      "abstain).",
      "Objective 3. Rubric row 2."],
     ["Leak math table", "Smart Plug matching"]),
    ("Presentation", "Keep More of It: Part 6, Lower Your Bills (Catherine)", "12 minutes",
     ["Jess moment: a bill arrives. The owner writes the slide.",
      "Teach: read a bill and find what can come down.",
      "Core activity: Sheet 2, Review a Bill. The activity keeps its own five people.",
      "Objective 3. Rubric row 2."],
     ["Lower Your Bills, Sheet 2"]),
    ("Presentation", "Keep More of It: Part 3 & 5, Shop Smarter and Use Technology (Todd)", "12 minutes",
     ["[TEAM TO BUILD] In-store tactics and one tool for a week of money in and money out. This plan leaves "
      "the content to the instructor intake.",
      "Objective 4. Rubric row 2."],
     ["To come from the team"]),
    ("Practice", "Spend and Protect: Part 8, Better Buying Decisions (unassigned)", "12 minutes",
     ["[TEAM TO BUILD] The 48-hour rule and spotting a predatory offer.",
      "Objective 5. Rubric row 3."],
     ["To come from the team"]),
    ("Practice", "Spend and Protect: Part 7, Protect Your Money (Tyler and others)", "12 minutes",
     ["Jess moment: a suspicious text. The owners write the slide.",
      "Teach: common scam warning signs and when to walk away.",
      "Core activity: CFPB fraud types scenario sort.",
      "Objective 5. Rubric row 3."],
     ["Fraud types scenario sort"]),
    ("Practice", "Knowledge check", "5 minutes",
     ["[TO WRITE] A short knowledge check on Parts 1 to 8. Practice, not a pop quiz; no shame for wrong answers."],
     ["Slides: set at build"]),
    ("Evaluation", "Part 9, Real Life Money Challenges (unassigned)", "12 minutes",
     ["[TEAM TO BUILD] Groups solve a scenario card with tools from earlier segments, then share one choice "
      "and why.",
      "Objective 6. Rubric row 4."],
     ["Scenario cards (to build)", "Rubric"]),
    ("Evaluation", "Exit ticket", "5 minutes",
     ["[TO WRITE] One exit ticket covering the lesson objectives. Score the rubric from the day's work."],
     ["Exit ticket (to build)", "Rubric"]),
    ("Application", "", "5 minutes",
     ["Each learner circles one step from My Money Plan for this week and one place to ask: PATH, DoHS, 211, "
      "or FRN. Nothing personal goes on the big screen, and plans are not collected.",
      "Objective 7. Rubric row 5."],
     ["My Money Plan (or First Step card)", "Pens or pencils"]),
]

OTHER = [
    "Total core time: about 2 hours (121 minutes). Add a break if your site needs one.",
    "Third-hour extensions. Part 1: NGPF needs and wants, W-4 quiz. Part 2: the full game with How It Went. "
    "Part 4: personal leak assessment. Part 6: Sheets 3 to 8, and the Stretching Your Budget guide as a "
    "take-home. Part 8: impulse worksheet. Part 7: FPI quizzes, videos, job scam PDF, research project. "
    "Part 9: the Spent game.",
    "Dignity first. Learners never share income, benefit amounts, case numbers, or household details. No shame "
    "language and no surplus-budget examples.",
    "If a learner asks about their own benefits, point them to their caseworker. Give no legal or eligibility "
    "advice, and quote no SNAP or TANF figure the team has not supplied and checked.",
    "Name PATH, DoHS, 211, and FRN as places to ask. Do not script what they will say or promise what they "
    "will do.",
    "Draft status. Waiting on the teams: the chapter map, the segment pattern, My Money Plan, and whether every "
    "activity is rebuilt around Jess. Not built: Parts 3 & 5, 8, and 9, both knowledge checks, and the exit "
    "ticket. To confirm: four framework codes marked above. Slide ranges are set when the deck is built. "
    "Third-party Part 7 files marked All Rights Reserved need a license check before use.",
    "The original module and Previous-Lesson-Deck/slides.html are reference only, not part of this lesson.",
]

# ---------------------------------------------------------------- template plumbing


def top_level(body: str) -> list[str]:
    """Split the body XML into its top-level <w:p>, <w:tbl> and <w:sectPr> elements."""
    out, i = [], 0
    while i < len(body):
        m = re.compile(r"<w:(p|tbl|sectPr)[ >]").search(body, i)
        if not m:
            break
        tag, start = m.group(1), m.start()
        depth, j = 0, start
        pat = re.compile(r"<(/?)w:%s([ >/])" % tag)
        while True:
            t = pat.search(body, j)
            if t is None:
                raise ValueError("unbalanced <w:%s> in template" % tag)
            depth += -1 if t.group(1) else 1
            j = body.index(">", t.start()) + 1
            if depth == 0:
                break
        out.append(body[start:j])
        i = j
    return out


def fill(proto: str, *texts: str) -> str:
    """Replace the template's <w:t> contents, in order, with the given texts."""
    parts = re.split(r"(<w:t(?: [^>]*)?>)(.*?)(</w:t>)", proto, flags=re.S)
    slots = (len(parts) - 1) // 4
    if slots != len(texts):
        raise ValueError("template element has %d text runs, got %d texts" % (slots, len(texts)))
    for n, text in enumerate(texts):
        parts[4 * n + 2] = escape(text)
    return "".join(parts)


def cells_of(row: str) -> list[str]:
    return re.findall(r"<w:tc>.*?</w:tc>", row, flags=re.S)


def para_protos(cell: str) -> tuple[str, list[str]]:
    head = cell[: cell.index("<w:p>")]
    return head, re.findall(r"<w:p>.*?</w:p>", cell, flags=re.S)


def build_row(
    row_proto: str, stage: str, segment: str, minutes: str, activity: list[str], materials: list[str]
) -> str:
    c1, c2, c3 = cells_of(row_proto)
    h1, (bold, bold_last) = para_protos(c1)
    h2, (text_p, _) = para_protos(c2)
    h3, mat_ps = para_protos(c3)
    first = [fill(bold, stage)] + ([fill(bold, segment)] if segment else []) + [fill(bold_last, minutes)]
    cell1 = h1 + "".join(first) + "</w:tc>"
    cell2 = h2 + "".join(fill(text_p, t) for t in activity) + "</w:tc>"
    cell3 = h3 + "".join(fill(mat_ps[0], t) for t in materials) + "</w:tc>"
    start = row_proto[: row_proto.index("<w:tc>")]
    return start + cell1 + cell2 + cell3 + "</w:tr>"


def build_document(xml: str) -> str:
    open_body = xml.index("<w:body>") + len("<w:body>")
    close_body = xml.rindex("</w:body>")
    els = top_level(xml[open_body:close_body])
    cat, title, banner, label, text, bullet, blank, brk, table = (
        els[0], els[5], els[13], els[14], els[15], els[17], els[26], els[39], els[42])
    static_block, sect = els[6:13], els[-1]
    rows = re.findall(r"<w:tr>.*?</w:tr>", table, flags=re.S)
    table_head = table[: table.index("<w:tr>")]

    def section(name: str, items: list[tuple[str, str]]) -> list[str]:
        out = [fill(label, name)]
        for kind, value in items:
            out.append(fill(text if kind == "p" else bullet, value if kind == "p" else "- " + value))
        return out

    body = [fill(cat, c) for c in CATEGORIES] + [els[4], fill(title, TITLE, SUBTITLE)] + static_block
    body += [fill(banner, "LESSON BASICS")]
    body += section("Lesson Topic", [("p", TOPIC)])
    body += section("Standards (CCRS, GED Standard, Employability Skills Framework)", [("b", s) for s in STANDARDS])
    body += section("Objectives (Audience Behavior Condition Degree)", [("p", o) for o in OBJECTIVES])
    body += section("Assessment", [("p", a) for a in ASSESSMENT])
    body += [blank, fill(banner, "LESSON MATERIALS")]
    body += section("Handouts Needed", [("b", h) for h in HANDOUTS])
    body += section("Online Resources", [("b", o) for o in ONLINE])
    body += section("Other Materials or Equipment", [("b", e) for e in EQUIPMENT])
    body += [brk, fill(banner, "ACTIVITY PLAN"), els[41]]
    body += [table_head + rows[0] + "".join(build_row(rows[1], *r) for r in ACTIVITY_PLAN) + "</w:tbl>"]
    body += [els[43]] + section("Other Resources or Alternative Resources", [("b", o) for o in OTHER])
    body += [sect]
    return xml[:open_body] + "".join(body) + xml[close_body:]


def main() -> None:
    if not TEMPLATE.exists():
        sys.exit("template not found: %s" % TEMPLATE)
    with zipfile.ZipFile(TEMPLATE) as src, zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename == "word/document.xml":
                data = build_document(data.decode("utf-8")).encode("utf-8")
            if item.filename == "docProps/core.xml":
                data = data.replace(b"Money Management Part 2 Lesson Plan", b"Money Management Lesson Plan (draft)")
            info = zipfile.ZipInfo(item.filename, FIXED_ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            dst.writestr(info, data)
    print("wrote %s" % OUTPUT)


if __name__ == "__main__":
    main()
