"""Generate updated Handout #3 with all 5 scenario sets + comparison questions."""
import os
from fpdf import FPDF

BASE_DIR = os.path.dirname(__file__)
RESOURCES = os.path.join(BASE_DIR, "Handouts")
os.makedirs(RESOURCES, exist_ok=True)

BLUE = (45, 109, 181)
GREEN = (76, 184, 72)
DARK = (30, 74, 125)
GRAY = (90, 106, 122)
MUTED_BG = (238, 244, 250)
WHITE = (255, 255, 255)
LIGHT_GRAY = (200, 200, 200)
RED_BG = (254, 242, 242)
GREEN_BG = (236, 253, 245)


class ScenarioPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)

    def header_block(self):
        self.set_fill_color(*BLUE)
        self.rect(0, 0, 210, 22, "F")
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*WHITE)
        self.set_xy(10, 4)
        self.cell(0, 7, "Employee Accountability", align="L")
        self.set_font("Helvetica", "", 9)
        self.set_xy(10, 12)
        self.cell(0, 6, "Handout #3: Workplace Scenarios", align="L")
        self.set_xy(-50, 8)
        self.set_font("Helvetica", "B", 11)
        self.cell(40, 7, "Scenarios", align="R")
        self.set_y(26)

    def name_date_row(self):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.cell(95, 8, "Name: _________________________________________")
        self.cell(95, 8, "Date: ______________________", align="R")
        self.ln(10)

    def set_heading(self, text, set_num):
        self.set_fill_color(*BLUE)
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 13)
        self.cell(0, 10, f"  SCENARIO SET {set_num}: {text}", fill=True)
        self.ln(12)

    def scenario_title(self, title, strong=True):
        if strong:
            self.set_fill_color(*GREEN_BG)
            label = "(Strong Accountability)"
        else:
            self.set_fill_color(*RED_BG)
            label = "(Weak Accountability)"
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*DARK)
        self.cell(0, 9, f"  {title}", fill=True, border=0)
        self.ln(9)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*GRAY)
        self.cell(0, 5, f"  {label}")
        self.ln(7)

    def scenario_text(self, text):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*DARK)
        self.multi_cell(0, 5, text)
        self.ln(4)

    def guiding_questions_header(self, scenario_label):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*BLUE)
        self.cell(0, 7, f"Guiding Questions for {scenario_label}:")
        self.ln(8)

    def question_with_lines(self, q_text, num_lines=3):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(0, 4.5, q_text)
        self.set_draw_color(*LIGHT_GRAY)
        for _ in range(num_lines):
            self.ln(5.5)
            self.line(self.get_x(), self.get_y(), self.get_x() + 190, self.get_y())
        self.ln(5)

    def comparison_header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*BLUE)
        self.set_fill_color(*MUTED_BG)
        self.cell(0, 8, "  Comparison Questions:", fill=True)
        self.ln(10)


def generate_handout_3():
    pdf = ScenarioPDF()

    # ===== PAGE 1: Cover + Directions =====
    pdf.add_page()
    pdf.header_block()
    pdf.name_date_row()

    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 5,
        "Directions: Read each scenario pair carefully. Scenario A shows STRONG "
        "accountability (positive example). Scenario B shows WEAK accountability "
        "(negative example). Answer the guiding questions after each scenario."
    )
    pdf.ln(4)

    # ===== SET 1: Healthcare =====
    pdf.set_heading("Healthcare Setting", 1)

    pdf.scenario_title("Scenario 1A: A Busy Day at Vandela Care Home", strong=True)
    pdf.scenario_text(
        "Maria Taylor, a Licensed Practical Nurse (LPN) at Vandela Care Home with two years of "
        "experience, is working on the long-term care unit. The unit is short-staffed, and Maria's "
        "shift has been chaotic.\n\n"
        "While preparing medications, Maria notices that a metformin pill for Mr. Henderson looks "
        "different than usual. Maria calls the pharmacy to confirm the medication is correct. The "
        "pharmacy confirms the supplier changed. Maria documents the call in Mr. Henderson's chart.\n\n"
        "Later, Maria notices a resident, Ms. Rodriguez, looks unsteady getting out of bed. Maria "
        "leaves the medication cart to help Ms. Rodriguez safely back to bed and calls a nursing "
        "assistant to stay with her. When Maria returns, she realizes she forgot to lock the cart. "
        "Maria calls her supervisor, Beth Daniels, and explains what happened. Together they check "
        "all medications -- nothing is missing.\n\n"
        "That afternoon, a newer LPN, Derick Garner, asks Maria for help with a wound dressing "
        "change. Even though Maria is busy, she takes time to guide Derick through the proper procedure."
    )

    pdf.guiding_questions_header("Scenario 1A")
    pdf.question_with_lines("1. List THREE specific actions Maria took that demonstrate accountability:")
    pdf.question_with_lines("2. Maria made a mistake by leaving the cart unlocked. How did she handle it? What does this tell you about accountability?")
    pdf.question_with_lines("3. How did Maria demonstrate 'team collaboration'?")
    pdf.question_with_lines("4. Which Habits of Mind does Maria demonstrate? Give examples.")

    pdf.add_page()
    pdf.header_block()

    pdf.scenario_title("Scenario 1B: A Busy Day at Hawk's Nest Care Haven", strong=False)
    pdf.scenario_text(
        "Annette Akins, an LPN with six years of experience, is working on a dementia unit at "
        "Hawk's Nest Care Haven. The unit is hectic.\n\n"
        "A CNA, Isabella Porter, tells Annette that Mr. McCord is agitated and trying to get out "
        "of bed. Instead of checking on him, Annette says, \"I don't have time. Turn his TV on and "
        "leave him be.\" Annette does not document this in Mr. McCord's chart.\n\n"
        "An hour later, Mr. McCord falls while trying to get out of bed. During the investigation, "
        "Annette says, \"The CNA should have told me he was still agitated.\"\n\n"
        "When the charge nurse reviews the incident with Annette, she becomes defensive. She "
        "complains about being understaffed and says it's impossible to manage every resident."
    )

    pdf.guiding_questions_header("Scenario 1B")
    pdf.question_with_lines("1. List THREE actions (or failures to act) that show Annette lacked accountability:")
    pdf.question_with_lines("2. When confronted, Annette blamed the CNA. What should she have said instead?")
    pdf.question_with_lines("3. Annette complained about being understaffed. Is this a valid excuse? Why or why not?")

    pdf.comparison_header()
    pdf.question_with_lines("4. Compare Annette to Maria. What Habits of Mind does Maria have that Annette lacks?")

    # ===== SET 2: Warehouse =====
    pdf.add_page()
    pdf.header_block()
    pdf.set_heading("Warehouse / Distribution Setting", 2)

    pdf.scenario_title("Scenario 2A: Crazy Eddie's Distribution Center", strong=True)
    pdf.scenario_text(
        "Mark Downs, a warehouse worker for five years, is loading a delivery truck. The warehouse "
        "is understaffed and under pressure to complete orders before the weekend.\n\n"
        "While pulling an order, Mark notices a barcode doesn't match -- it's the wrong gaming "
        "console model. Mark stops, alerts his supervisor Jessica, pulls the correct product, "
        "updates inventory, and notes the error in his end-of-shift report.\n\n"
        "Later, Mark sees a coworker trying to lift a heavy pallet with a hand truck instead of "
        "a pallet jack. Mark stops to show the new worker the correct, safe procedure.\n\n"
        "Near shift end, coworker Lisa asks for help completing a rush order. Mark checks with "
        "his supervisor, who agrees, and Mark stays an hour late to help Lisa finish."
    )

    pdf.guiding_questions_header("Scenario 2A")
    pdf.question_with_lines("1. Mark could have shipped the wrong console to save time. Why is catching this error an example of 'ownership'?")
    pdf.question_with_lines("2. How did Mark demonstrate accountability for his coworkers' safety and success?")
    pdf.question_with_lines("3. Which of the 5 Cs of Accountability (Clarity, Commitment, Communication, Collaboration, Consequences) does Mark demonstrate?")

    pdf.add_page()
    pdf.header_block()

    pdf.scenario_title("Scenario 2B: Dollar World Distribution Center", strong=False)
    pdf.scenario_text(
        "Kevin Nadir, a warehouse worker for less than a year, is rushing to finish an order and "
        "leave for the weekend.\n\n"
        "Instead of using a step ladder, Kevin stands on a shelf. Climbing down, he knocks dishes "
        "onto the floor, breaking several. Rather than reporting it, he pushes the carton to the "
        "back of the shelf.\n\n"
        "Kevin's scanner shows an item is available at another location across the warehouse. He "
        "ignores this and marks the item \"out of stock.\"\n\n"
        "Kevin leaves a pallet jack in the middle of an aisle. Later, a forklift driver must "
        "move it.\n\n"
        "Kevin tells his supervisor the order is \"almost complete\" so he can leave for childcare "
        "pickup. His replacement discovers only half the items were pulled, and two are wrong."
    )

    pdf.guiding_questions_header("Scenario 2B")
    pdf.question_with_lines("1. List FOUR examples of Kevin failing to be accountable:")
    pdf.question_with_lines("2. Kevin hid the broken dishes. What are the consequences for: (a) Kevin, (b) coworkers, (c) the company?")
    pdf.question_with_lines("3. Kevin lied about how much work was done. How does dishonesty relate to accountability?")
    pdf.question_with_lines("4. Kevin had a legitimate reason to leave (childcare). How could he have handled this accountably?")

    pdf.comparison_header()
    pdf.question_with_lines("5. Compare Mark and Kevin. What specific Habits of Mind does Mark demonstrate that Kevin does not?")

    # ===== SET 3: Environmental Services =====
    pdf.add_page()
    pdf.header_block()
    pdf.set_heading("Environmental Services (Hospital)", 3)

    pdf.scenario_title("Scenario 3A: Valley General Hospital -- Day Shift", strong=True)
    pdf.scenario_text(
        "Rosa Gutierrez has worked as an environmental services (EVS) technician at Valley General "
        "Hospital for three years. Today she is assigned to clean and disinfect patient rooms on "
        "the surgical recovery floor.\n\n"
        "While cleaning Room 312, Rosa notices a small crack in the wall-mounted sharps container. "
        "It still functions, but she reports it to her supervisor, James, and fills out a "
        "maintenance request form. She places a temporary warning label on the container.\n\n"
        "Her next assignment is a terminal clean for a patient who was in isolation for a "
        "drug-resistant infection. Rosa carefully follows the facility's enhanced disinfection "
        "protocol -- using the correct chemicals, contact times, and PPE. A newer coworker, "
        "Anthony, asks if he can skip wiping down the bed frame rails since the patient has "
        "already been discharged. Rosa explains why every surface matters and walks him through "
        "the full checklist.\n\n"
        "At the end of her shift, Rosa realizes she forgot to restock the hand sanitizer in "
        "Room 308. Instead of leaving it for the next shift, she goes back and completes the task "
        "before clocking out. She notes it in her shift log."
    )

    pdf.guiding_questions_header("Scenario 3A")
    pdf.question_with_lines("1. List THREE specific actions Rosa took that demonstrate accountability:")
    pdf.question_with_lines("2. Rosa caught her own mistake with the hand sanitizer. How does catching and fixing your own errors show accountability?")
    pdf.question_with_lines("3. How did Rosa support Anthony without doing his work for him?")

    pdf.add_page()
    pdf.header_block()

    pdf.scenario_title("Scenario 3B: Mountainview Medical Center -- Evening Shift", strong=False)
    pdf.scenario_text(
        "Derek Sloan has been an EVS technician at Mountainview Medical Center for eight months. "
        "He is assigned to clean the emergency department tonight, which is always busy.\n\n"
        "Derek's supervisor reminds him that the ER waiting area needs extra attention because of "
        "flu season. Derek wipes down the chairs but skips the door handles, light switches, and "
        "check-in counter. He tells himself, \"Nobody notices those anyway.\"\n\n"
        "A nurse asks Derek to do an urgent room turnover for an incoming trauma patient. Derek "
        "says he'll get to it after his break. The nurse has to clean the room herself to prepare "
        "for the patient.\n\n"
        "Later, Derek's coworker Mia asks him to help mop a spill in the hallway. Derek says, "
        "\"That's not my zone.\" A visitor slips on the spill twenty minutes later.\n\n"
        "When Derek's supervisor asks about the incomplete ER cleaning, Derek says, \"I was "
        "pulled in too many directions. They need to hire more people.\""
    )

    pdf.guiding_questions_header("Scenario 3B")
    pdf.question_with_lines("1. List THREE actions (or failures to act) that show Derek lacked accountability:")
    pdf.question_with_lines("2. Derek said door handles don't matter. Why is cutting corners in a hospital setting especially dangerous?")
    pdf.question_with_lines("3. A visitor slipped because Derek refused to help. What are the consequences for Derek, the hospital, and the visitor?")

    pdf.comparison_header()
    pdf.question_with_lines("4. Compare Rosa and Derek. Which Habits of Mind does Rosa practice that Derek does not? Give specific examples.")

    # ===== SET 4: Welding / Fabrication =====
    pdf.add_page()
    pdf.header_block()
    pdf.set_heading("Welding / Fabrication", 4)

    pdf.scenario_title("Scenario 4A: Appalachian Steel Fabricators", strong=True)
    pdf.scenario_text(
        "Carlos Rivera is a certified welder at Appalachian Steel Fabricators. He has four years "
        "of experience and is working on structural beams for a highway bridge project. Quality "
        "standards are strict -- every weld must pass X-ray inspection.\n\n"
        "While welding a critical joint, Carlos notices porosity (tiny gas pockets) forming in "
        "his bead. He could continue and hope it passes inspection, but instead he stops, grinds "
        "out the defective section, adjusts his shielding gas flow, and rewelds the joint. He "
        "logs the issue and the corrective action in his quality report.\n\n"
        "A first-year apprentice, Tyler, is struggling with vertical-up welding technique. "
        "Carlos takes fifteen minutes during lunch to demonstrate proper rod angle and travel "
        "speed. He encourages Tyler to practice on scrap metal before attempting the real work.\n\n"
        "Near the end of the day, Carlos realizes the welding rod lot number on his work order "
        "doesn't match the rod he's been using. The specifications are identical, but Carlos "
        "reports the discrepancy to his foreman and documents it rather than hoping no one checks."
    )

    pdf.guiding_questions_header("Scenario 4A")
    pdf.question_with_lines("1. Carlos could have ignored the porosity and hoped it passed inspection. Why did he stop and redo the weld?")
    pdf.question_with_lines("2. How did Carlos demonstrate accountability toward Tyler, the apprentice?")
    pdf.question_with_lines("3. The rod lot number difference was minor. Why did Carlos report it anyway? What does this say about integrity?")

    pdf.add_page()
    pdf.header_block()

    pdf.scenario_title("Scenario 4B: Summit Metalworks", strong=False)
    pdf.scenario_text(
        "Jason Pratt is a welder at Summit Metalworks with two years of experience. He is "
        "fabricating handrails for a commercial building. The shop is behind schedule and the "
        "foreman is pressuring everyone to move faster.\n\n"
        "Jason notices his welding helmet's auto-darkening lens flickers intermittently. Rather "
        "than stopping to get it replaced, he continues working. \"It's probably fine,\" he "
        "thinks. A coworker, Luis, mentions he saw the flicker too. Jason tells Luis, \"Mind "
        "your own business.\"\n\n"
        "While grinding a weld, Jason skips putting on his safety glasses because they fog up "
        "and slow him down. He also doesn't set up the grinding shield, sending sparks toward "
        "a nearby work area.\n\n"
        "At the end of the day, Jason's supervisor finds two handrail joints that don't meet "
        "spec -- the welds are undersized. Jason says, \"The drawings are confusing. Someone "
        "should have caught that in the check.\""
    )

    pdf.guiding_questions_header("Scenario 4B")
    pdf.question_with_lines("1. List THREE examples of Jason failing to be accountable for safety:")
    pdf.question_with_lines("2. Jason dismissed Luis's concern about the helmet. How does rejecting feedback undermine accountability?")
    pdf.question_with_lines("3. Jason blamed confusing drawings for his undersized welds. What should he have done instead?")

    pdf.comparison_header()
    pdf.question_with_lines("4. Compare Carlos and Jason. How does Carlos's approach to quality and safety differ from Jason's? Which Habits of Mind explain the difference?")

    # ===== SET 5: Medical Assistant =====
    pdf.add_page()
    pdf.header_block()
    pdf.set_heading("Medical Assistant (Pediatric Clinic)", 5)

    pdf.scenario_title("Scenario 5A: Bright Futures Pediatric Clinic", strong=True)
    pdf.scenario_text(
        "Keisha Williams is a certified medical assistant (CMA) at Bright Futures Pediatric "
        "Clinic. She has been in the role for two years. Today the clinic is overbooked and "
        "the waiting room is full of anxious parents and restless children.\n\n"
        "While rooming a patient, Keisha takes vitals and notices the 4-year-old's temperature "
        "is 103.2F. The mother says she gave ibuprofen an hour ago. Keisha documents the temp, "
        "the medication time, and immediately alerts the physician rather than waiting for the "
        "doctor to review the chart later.\n\n"
        "Between patients, the front desk asks Keisha to help with a billing question from a "
        "frustrated parent. Even though it's not her job, Keisha listens to the parent, "
        "apologizes for the confusion, and walks the issue to the billing coordinator personally.\n\n"
        "At the end of the day, Keisha realizes she charted a patient's weight in pounds when "
        "the system uses kilograms. She immediately corrects the entry, notes the correction, "
        "and tells the physician about the error so the medication dosage can be double-checked."
    )

    pdf.guiding_questions_header("Scenario 5A")
    pdf.question_with_lines("1. List THREE specific actions Keisha took that demonstrate accountability:")
    pdf.question_with_lines("2. Keisha caught her own charting error. Why is self-correction important in healthcare? How does it show accountability?")
    pdf.question_with_lines("3. The billing question wasn't Keisha's responsibility. Why did she help anyway? How does this relate to the 5 Cs?")

    pdf.add_page()
    pdf.header_block()

    pdf.scenario_title("Scenario 5B: Little Steps Family Practice", strong=False)
    pdf.scenario_text(
        "Brandon Cole is a medical assistant at Little Steps Family Practice. He has been in "
        "the role for about six months. The afternoon schedule is packed and Brandon is feeling "
        "overwhelmed.\n\n"
        "While rooming patients, Brandon skips hand sanitizing between two exam rooms because "
        "\"they're just well-child visits anyway.\" He also forgets to ask about allergies when "
        "rooming a new patient but doesn't go back to collect the information.\n\n"
        "The physician asks Brandon to call a parent about abnormal lab results and schedule a "
        "follow-up. Brandon writes the task on a sticky note. By the end of the day, the sticky "
        "note is lost and the call is never made.\n\n"
        "A coworker, Priya, asks Brandon if he stocked the vaccine refrigerator. Brandon says "
        "yes, but he actually forgot. Priya discovers the shortage the next morning when a "
        "patient is scheduled for immunizations.\n\n"
        "When the office manager asks Brandon about the missed callback and the vaccine shortage, "
        "he says, \"I had too many patients. Nobody told me those things were priorities.\""
    )

    pdf.guiding_questions_header("Scenario 5B")
    pdf.question_with_lines("1. List FOUR examples of Brandon failing to be accountable:")
    pdf.question_with_lines("2. Brandon lied to Priya about stocking the vaccines. How does dishonesty with coworkers damage a team?")
    pdf.question_with_lines("3. The missed callback could have serious consequences for a child's health. How does Brandon's carelessness affect patient safety?")

    pdf.comparison_header()
    pdf.question_with_lines("4. Compare Keisha and Brandon. What Habits of Mind does Keisha practice that Brandon lacks? Give specific examples.")

    # ===== FINAL REFLECTION PAGE =====
    pdf.add_page()
    pdf.header_block()

    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 10, "  FINAL REFLECTION: Connecting the Scenarios", fill=True)
    pdf.ln(14)

    pdf.question_with_lines("1. What are the TOP 3 behaviors that accountable employees consistently demonstrate?", 4)
    pdf.question_with_lines("2. What are the most common EXCUSES that unaccountable employees make?", 4)
    pdf.question_with_lines("3. Think about your own life. Describe a time you acted accountably AND a time you didn't. What did you learn?", 5)
    pdf.question_with_lines("4. Write your own definition of \"employee accountability\" in your own words:", 5)

    path = os.path.join(RESOURCES, "Handout_3_Workplace_Scenarios_Fillable.v2.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


if __name__ == "__main__":
    generate_handout_3()
