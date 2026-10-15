# Curriculum content review — 2026-09-22

Scope: current six lesson HTML files at baseline d80a3f7, their learner-facing text, linked resource inventories, current generated teacher guides, and selected handouts/assessments. Used the PDF skill for read-only PDF extraction and targeted visual inspection. Extracted all 60 lesson PDFs (including source/legacy versions); extraction is an inventory, not a claim of full visual review. Read both Anger and Problem Solving teacher guides in full, sampled all four other current guides against lesson text and assessment sections; read the six rubrics and selected assessments/source notes. Visually inspected Accountability Habits handout and Anger Styles assessment page 1. Did not watch every minute of the 23 videos, audit every caption against audio, inspect every PDF page, or conduct learner trials. Runtime/a11y and BeSpoke engineering are covered by other reviewers.

## Content readiness

| Lesson | Current content assessment | Strong elements | Required before broad teaching approval |
|---|---|---|---|
| Time Management | Closest to a facilitated pilot; conditional approval | Acknowledges different life demands; practical prioritization examples, matrix matching, self-reflection, exit ticket, usable planners | Make pre/post evidence and scoring explicit; verify infographic accessibility and video claims; reconcile SMART versus SMARTER terminology; replace unsourced performance absolutes with qualified language |
| Interview Skills | Hold content sign-off for targeted corrections | Mutual-fit framing, clear STAR examples, mock interviews and peer feedback | Replace fatigue/overwork model, offer accessible body-language alternatives, make AI practice optional with an equivalent rubric path |
| Employee Accountability | Hold content sign-off | Clear objectives, real-world scenario pairs, SMART action plan, voluntary sharing in individual reflection | Repair Handout 1 instructions and count, remove blame/unsafe-compliance implications, separate accountability from responsibility for unsafe systems |
| Communicating with the Public | Facilitated pilot after source/assessment corrections | Listening/reflection, role-play scenarios, self-advocacy, binder application | Source employer statistics, map observed listening/communication performance to assessment, ensure personal ratings are optional to share |
| Controlling Anger | Hold content sign-off | Anger normalized, choice to pass/re-spin, practical support networks, four-question checkpoint | Safety boundaries, misleading third-party assessment guidance, teacher-guide parity, source review for health claims |
| Problem Solving & Decision Making | Facilitated pilot after assessment/source corrections | Useful four-step process, real-life scenarios, teamwork practice, reflection | Label riddles as icebreaker rather than cognitive test; qualify style taxonomy; repair lunar handout/deck mismatch; assess applied reasoning independently of participation |

These are content judgments, not technical release statuses. Historical registry “ready” or “qa” labels do not establish current end-to-end readiness.

## Findings

### C1 — P1 — The model interview answer rewards working through unsafe fatigue

Evidence: `lesson-interview-skills/index.html:3730-3745` presents five consecutive 12-hour shifts followed by agreeing to stay longer as a model stress-management answer and ends with recognition for commitment. This teaches students that professionalism means accepting additional work despite explicit fatigue. CDC/NIOSH identifies risks to both workers and patients from fatigue and recommends reporting inability to work safely. Replace this with a STAR example that communicates capacity, escalates coverage needs, prioritizes safely, and follows policy; have the content owner approve it. This is a safety/pedagogy finding, not a legal conclusion that the depicted schedule is always unlawful.

Source: https://www.cdc.gov/niosh/bulletin/2020/fatigue-crisis.html ; https://www.cdc.gov/niosh/work-hour-training-for-nurses/longhours/mod5/07.html

### C2 — P1 — Anger lesson needs a clear boundary between ordinary conflict and unsafe/abusive situations

Evidence: `lesson-controlling-anger/index.html:3398-3401` prescribes common ground, compromise, forgiveness; `:3489` prescribes walking away then returning; `:3509` says resolving matters more than winning. These appear as general rules for home and work, without an adjacent safety exception. `:3635` does mention removing oneself from toxic situations, so safety is not wholly absent, but it does not qualify the earlier rules. The linked Anger Styles PDF page 1 says there is no wrong style; page 3 describes the “Forceful” style using intimidation and recommends its use in emergencies, while “Indirect Control” is recommended when the relationship is unimportant. That directly conflicts with the deck's healthy-anger standard.

Retain skill-building but add: these strategies are for situations safe enough to discuss; nobody must reconcile, forgive, compromise rights, or disclose personal experiences; use approved support/escalation routes when safety is involved. Replace or human-review the third-party assessment before reuse. The current generated guide supplies generic facilitation prompts and no explicit protocol for these exceptions. SAMHSA differentiates skills/self-management from clinical treatment; The Hotline emphasizes individualized safety planning.

Sources: https://www.samhsa.gov/technical-assistance/dtac/disaster-survivors/coping ; https://www.thehotline.org/plan-for-safety/create-your-personal-safety-plan/ ; https://www.samhsa.gov/mental-health/trauma-violence/trauma-informed-approaches-programs

### C3 — P2 — Accountability asks learners to score a handout that has no scores, and misstates the framework size

Evidence: `lesson-employee-accountability/index.html:3334` says Handout 1 includes all 15 habits; `:3395-3400` asks for highest and lowest self-assessment scores on that handout. `Handouts/Handout_1_Habits_of_Mind.pdf`, visually verified page 1, contains seven selected habits with example-writing columns and no scoring scale. Costa/Kallick's current Institute lists 16 habits. Label the handout “seven selected Habits of Mind,” change the debrief to discuss examples, or supply the actual intended scored instrument. Do not treat the seven-habit subset itself as an error; the claimed completeness and scoring workflow are the errors.

Source: https://habitsofmindinstitute.org/habits/students

### C4 — P2 — Teacher-guide generation can substitute generic text for instructor-authored teaching meaning

Evidence: `generate_teachers_guides.py:2203-2222` redefines five note-override functions to use generic HTML-driven notes instead of the earlier source-PDF mappings. `:2314` falls back to generic notes. Current guide examples are instructions to “introduce” a slide title, add an example, and ask a broad prompt rather than the specific authored guidance present in source material. Anger guide pages 9-12 contains generic notes for the framework and conflict rules. Interview guide page 14 gives generic timing/facilitation for ChatGPT and no privacy/alternatives guidance.

Separately, the Anger guide table of contents ends at slide 30, while the current deck contains 33. Its pages 10-15 omit the new warning-sign debrief, split fair-fighting sequence, and four-question checkpoint, shifting every later reference. Evidence in live HTML: `lesson-controlling-anger/index.html:3453`, `:3468`, `:3496`, `:3724`. Repair guide-to-deck parity using stable slide identities and require teacher review of source meaning. Regenerating a PDF alone does not restore authored pedagogy.

### C5 — P2 — Offline curriculum assessment currently requires a specific external AI service

Evidence: `lesson-interview-skills/index.html:3893-3919` instructs learners to open ChatGPT and paste the prompt. `Handouts/Interview Skills Rubric.pdf` page 1 explicitly grades ChatGPT participation; failure to participate earns the lowest category. The later partner round-robin exists (`:4044`) but is not identified as an equivalent route for that rubric row. The ChatGPT prompt PDF has no privacy instructions or explanation that feedback may be wrong.

Make the assessed skill “mock interview response and reflection,” with either a human partner/instructor or approved AI route; give the same scoring criteria to both. Have learners use fictional/minimized details, keep instructor judgment over AI feedback, and identify school access rules. This is an assessment-design mismatch, not a claim that ChatGPT must be prohibited.

### C6 — P2 — Employer statistics lack a traceable population, date, and source

Evidence: `lesson-communicating-with-the-public/index.html:2589-2594` says over 70% of employers prioritize communication and calls it the number-one skill in job postings. The linked source lesson plan repeats the claim without resolving its provenance. NACE's 2025 findings support the importance of communication for surveyed graduate recruiters, but distinguish written (77.1%) and verbal (69.3%) communication and do not establish “number one in job postings.” Do not retrofit an unrelated source to the existing sentence. Either use a dated, scoped source with accurate wording or remove the numeric/ranking claim.

Sources: https://naceweb.org/talent-acquisition/candidate-selection/cab48580-8599-4298-b695-d2e6b1b0e8d3 ; https://www.naceweb.org/docs/default-source/default-document-library/2025/publication/research-report/2025-nace-job-outlook-jan-2025.pdf?Status=Master&sfvrsn=57d47fb0_3

### C7 — P2 — Some performance expectations confuse convention, participation, and competence

Evidence: Interview `index.html:3574-3586`, `:3632-3637` treats eye contact, posture, handshake, and avoiding fidgeting as uniform signals. The rubric penalizes assistance and grammatical mistakes without defining equivalent accommodations. Communication rubric awards substantially more for verbal classroom participation than silent active listening; its deck's evaluation (`index.html:3230-3253`) relies on self-ratings, which do not themselves demonstrate improved skill. Problem Solving rubric combines completion/participation with one useful reasoning criterion; deck evaluation `:3762-3776` is reflection rather than an independent application of the four-step process.

Recommendation: retain relevant conventions as context-sensitive options, define observable job-related outcomes, and accept equivalent spoken, written, signed, partner, or supported demonstrations. Avoid using a learner's eye contact, personal disclosure, or disability-related support needs as a proxy for skill. EEOC confirms that accommodations can apply in the application process; no diagnosis or disclosure should be required by this lesson.

Source: https://www.eeoc.gov/disability-discrimination-and-employment-decisions

The Anger rubric also grades sharing personal triggers and participation in the external Jeopardy game. This conflicts with the deck's permission to pass and its offline checkpoint fallback (`lesson-controlling-anger/index.html:3567`, `:3713`). Make both alternatives explicitly equivalent in the scoring instructions.

### C8 — P2 — Problem Solving presents informal exercises as validated assessment and contains a source inconsistency

Evidence: `lesson-problem-solving-and-decision-making/index.html:3184-3221` calls the giraffe/refrigerator riddles a critical-thinking test and asserts each question tests a cognitive ability. No validation evidence is supplied. `:3291` presents four style labels as the four main ways people solve problems without scope or validation limits. Label both as discussion/reflection tools, not ability diagnoses or fixed categories.

The Lunar Survival handout page 3 explains pistols as self-protection; current deck `:3731` says self-propulsion. The handout also omits the sunlit-location condition from its scenario while its rankings assume it. This needs a single, verified source exercise and consistent assumptions. NASA attribution was not conclusively verified against an accessible NASA original in this run; do not report a confirmed NASA factual error solely from a secondary copy. Also treat Lost at Sea's fire/alcohol examples (`:3671`, `:3680`) as historical teamwork-simulation assumptions, not real-world survival instructions.

### C9 — P2 — Accountability framing needs employer/system responsibility alongside personal agency

Evidence: `lesson-employee-accountability/index.html:3223-3225` says to own the outcome regardless of what happens and that accountability cannot be assigned; `:3552` rewards staying until work is done; `:3579`, `:3633`, `:3652-3674` discourage attributing outcomes to circumstances and label a “Victim Road.” Handout 3 page 2 frames an understaffing complaint as an excuse. The healthcare checkpoint `:3740-3746` contrasts patient care with “complaining” to a supervisor, although seeking staffing support can coexist with responsible patient care.

Human editorial recommendation: distinguish owning one's actions from owning another person's misconduct or unsafe systems; recognize reporting, accommodation, boundaries, and escalation as accountable behaviors. Preserve instructor intent and obtain approval for revised examples. This matters before the upcoming Rights, Diversity, Ethics, and Assertiveness modules establish potentially contradictory principles.

### C10 — P2 — Current PDFs are not covered by HTML accessibility checks

All six generated teacher guides lack a PDF structure tree. Several learner materials do too, including Accountability Handout 1, Interview rubric, and Time Management pre/post test. This is a structural accessibility gap requiring remediation/testing, not proof that every page is unreadable. Some PDF text extraction misses meaningful content: Anger Styles assessment page 1's instructions/scale were visible in the rendered page but absent from pypdf text; Iceberg directions and daily planner yielded virtually no text. Preserve accessible editable originals and provide tagged PDFs or equivalent accessible HTML/Word resources. Audit read order, table headers, form fields, and text alternatives with assistive technology before claiming curriculum accessibility.

### C11 — P2 — Intake previously left provenance, practice evidence, team approval, and exact wording implicit

The canonical intake had useful WIPPEA stages, resource inventory, and tone preferences, but no claim/source/date/jurisdiction table; no objective-to-assessment mapping; and no team approval/revision identity. P1-P3 all said Presentation, so teachers could omit guided practice while filling every field. The brief `docs/briefs/instructor-to-html-intake-2026-09-17.md:18-29` required KEEP VERBATIM but the delivered intake did not carry the rule. The PDF-only instruction discouraged retaining editable collaboration sources.

Foundational correction completed this turn in the existing `SPOKES Builder/content-intake-template.md`: preserved its layout/content, added team lead/revision/design identity, Teams/OneDrive working rules, KEEP VERBATIM, source/reuse register, observed learning evidence, guided-practice and alternative-mode checklist, final human review, and editable-source retention. No new lesson content was created. This is a procedural control, not proof the application enforces every checkbox.

### C12 — P3 — The standard misidentified the WCAG target-size threshold

`SPOKES-STANDARD.md` MOB-02/03 previously called 44px an AA requirement under SC 2.5.8. W3C specifies 24px or applicable exceptions there; 44px is SC 2.5.5 AAA. Corrected attribution and linked official sources while preserving SPOKES' stricter 44px project requirement. This avoids false compliance claims without weakening brand/usability controls.

Sources: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum ; https://www.w3.org/WAI/WCAG21/Understanding/target-size

### C13 — P2 — Accountability rubric total silently differs from the other five

`lesson-employee-accountability/Handouts/Employee_Accountability_Rubric.pdf` page 1 has six categories, each worth up to 10 points, but retains the instruction to multiply the sum by two. Its maximum is therefore 120; the other five rubrics have five rows and a maximum of 100. No explicit “out of 120” or cross-module normalization is printed. This is a verified scoring inconsistency, though a 120-point rubric could be intentional. State the denominator and grade policy, or normalize consistently; do not silently treat 120 as a percentage. The row for Engagement also scores punctuality, requiring a conscious decision about whether attendance is part of assessed competence.

## Positive evidence and improvement opportunities

- All six decks contain a coherent warm-up/introduction/presentation/evaluation/application flow; meaningful practice exists inside chapters even when the navigation calls those chapters Presentation. Do not claim all lack practice because a label is absent.
- Time Management recognizes unequal care/support demands (`index.html:2715-2746`), and its guide offers specific teaching notes and realistic next actions. This is a useful model for the new phase.
- All lessons have at least one practical transfer activity. Employee Accountability's SMART goal and barrier/check-in work is especially useful once the framing is corrected.
- Anger's explicit permission to pass/re-spin and limited disclosure in pair work are good precedents, though they need consistent application across warm-ups and rubrics.
- Source and release records need claim-level ownership, not just a generic bibliography. Specific phrases such as Accountability's research claim that saying goals aloud increases success (`index.html:3879`) and Time Management's high-performer morning ritual claim (`:3311`) should be sourced, qualified, or removed. These are unsupported claims, not proven false statements in this review.
- Preserve supplied third-party copyright notices and document permission before redistributing. No legal finding of infringement is made; a full media-rights review was not performed.

## Foundation requirements for the next six lessons (no lesson construction)

| Upcoming lesson | Team intake/review needs |
|---|---|
| Goal Setting | Preserve learner-chosen goals; define observable progress and barrier/support checks; reconcile SMART vocabulary with existing lessons; source goal-achievement claims; private participation options |
| Money Management - Budget | Follow the existing approved topic map; use fictional budgets; distinguish cash from SNAP/EBT; date/jurisdiction for benefits and reporting information; current authoritative review for every numeric/rule claim; no invented household surplus or service promise |
| Professionalism & Diversity | Define role-relevant behavior without cultural/appearance conformity; accommodations and religious/cultural context; scenario review for stereotypes; an inclusive participation rubric |
| Knowing Your Rights in the Workplace | Specify federal and West Virginia scope, coverage exceptions, source/check dates and reviewer; use agency links and safe next-step scenarios; separate education from individualized advice |
| Communicating Assertively | Align with existing listening, self-advocacy, and anger modules; make safe boundaries/retaliation concerns visible; scaffold practice with fictional scenarios and written alternatives |
| Workplace Ethics | Distinguish employer policy, ethical judgment, and law; accept reasoned alternatives where appropriate; include safe escalation/reporting and competing-duty cases; avoid grading conformity as ethics |

Use March 2027 as a soft phase target with readiness gates, not a fixed teaching-release date: team intake approved → sources/assessment reviewed → BeSpoke choice package accepted → build preview → teacher review of exact wording, resources, and design fidelity → learner/accessibility pilot → approved teaching release. Teams should be able to begin research and collaboration before the build gate is open.

## Changes and validation

Changed only `SPOKES-STANDARD.md` and `SPOKES Builder/content-intake-template.md` under the lead's explicit delegation. `git diff --check` passed for these two files. No existing lesson HTML, teacher guide, rubric, source PDF, or new lesson was modified. Parent/pipeline agent owns generated-template propagation and runtime verification.
