---
target: all six released SPOKES lessons
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-11-10T00-30-25Z
slug: lesson-index-html
---
Method: dual-agent (A: a52f3061f0635bc92, a25b5a618d0af23e3, ada1c056af4ad82ea · B: a8362f8cacf488e76)

# Six released lessons, reviewed ahead of a showing to instructors and students

Scope. The six released decks (`lesson-*/index.html`). Dashboard.html got the technical pass only. The Round 2 draft decks and Money Management Part 2 were not reviewed.

Evidence and limits. Reviewers read the source and the 215 saved slide pictures in each lesson's `print/` folder (captured at 1600x901, current per `capture-print-slides.mjs --check`). Nobody opened a live browser, because Chromium cannot launch in the sandbox. Motion, the sidebar, video slides and every 1280x720 figure come from the code, not from a screen.

## Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Progress bar, active tabs and quiz feedback are clear. Slide count shows only in the sidebar. |
| 2 | Match with the real world | 3 | Plain workplace language and adult scenarios. Comic Sans labels in Communicating with the Public talk down. |
| 3 | User control and freedom | 3 | Back, sidebar jump, Reset and Try Again. Problem Solving swallows arrow keys after a tab click (L4218-4222). |
| 4 | Consistency and standards | 2 | Fonts leak between lessons, pasted graphics clash with native slides, card systems change by chapter. |
| 5 | Error prevention | 2 | Slides that run past the screen, clicker keys ignored, hover flips cards in Problem Solving (L4290). |
| 6 | Recognition over recall | 3 | Every activity has an instruction line. |
| 7 | Flexibility and efficiency | 2 | Right, Left and Space only. No Page Down, Page Up, Home or End. |
| 8 | Aesthetic and minimalist design | 2 | Small text over empty lower thirds. Strong cores undercut by weak slides. |
| 9 | Error recovery | 3 | Wrong quiz answers get an explanation and a retry. |
| 10 | Help and documentation | 3 | Teacher's Guide and Lesson Plan on each cover. |
| **Total** | | **26/40** | **Acceptable, one point under Good** |

Per lesson: Time Management 26/40, Interview Skills 27/40, Employee Accountability 27/40, Controlling Anger 27/40, Communicating with the Public 24/36, Problem Solving 23/36 (heuristic 9 marked n/a in the last two).

Technical audit: 12/20 (Accessibility 3, Performance 2, Responsive 2, Theming 3, Implementation integrity 2).

## Design specificity verdict

LLM assessment. Three lessons are authored for their topic. Time Management has the 24-hour dial (s4) and the four-colour Eisenhower matrix (s15). Controlling Anger has navy, gold and Vollkorn with still-life medallions. Problem Solving has the Decision Lab dividers. Interview Skills and Communicating with the Public are half authored. Employee Accountability could front any SPOKES topic unchanged: its registered green lead appears as one tab keyline (s19) and one card border (s24).

Deterministic scan. `detect.mjs` reported 81 findings across the six lessons and none on the Dashboard: side-tab 31, layout-transition 22, bounce-easing 8, dark-glow 6, overused-font 5, em-dash 4, grid-bg 3, radial-halo 1, broken-image 1. Real but low impact: the sidebar animates `margin-left` and reflows the slide on each toggle (TM L59, IS L69, CA L71); Interview Skills hard-codes Inter in five places (L1418, L2958, L3018, L3074); four lessons carry 34 to 54 em dashes in slide text. False positives: broken-image (a JS comment, CwP L3675), radial-halo (a CSS-drawn head, IS L2095), dark-glow (hover-only shadow), grid-bg (slide texture at 3.5 to 8 percent alpha).

Validator: 0 FAIL in all six. WARN only on Interview Skills (CMP-01, CMP-02, NAV-11, NAV-12) and Employee Accountability (NAV-11), both already expected.

## Overall impression

The lessons work and nothing blocks a showing. All 666 local references resolve, all 23 videos carry captions, readability sits at grade 4.4 to 7.8. In a full room they would read as competent, not as impressive. The biggest single opportunity is type size: the decks are laid out like web pages, so the text people need to read is caption-sized on a projector while a third of the slide sits empty.

## What is working

- Sound foundations. No missing files, no network loads except one Jeopardy link, captions and posters on every video, reduced motion honoured in all six.
- Three real identities. TM s4 and s15, CA s7 and s26, PS dividers s5, s9, s14, s18, s23, s25.
- Interactive moments that teach. TM matching game (s16), PS reveal quiz (s3), EA nurse and CNA scenario (s27), CA wheel with legend (s23), CwP role-play cards (s20).

## Priority issues

**[P1] Text is too small for a room, and gets relatively smaller on bigger screens.**
Root font is 16px, rising to 19px only at 1600x920 and up (TM L2514, IS L3130, EA L3040, CA L2952, CwP L2367, PS L3019). The screen grows 50 percent from 720p to 1080p while type grows 19 percent. At 1080p full screen, headings are 66px (6.2 percent of height) and main bullets 28px (2.6 percent), which is fine. Text inside cards, tabs, accordions and quiz options is 19 to 23px (1.8 to 2.1 percent), under the common 2.4 percent floor for projected slides. Labels are 13 to 15px. Flip-card backs in CA (L1057) and PS (L956) are 13.6px at 1280x720.
Fix: add a taller step to the same media query in each lesson (22px at min-height 1000px), set a 1.2 to 1.3rem floor for content text, retake the pictures, then check the slides that are already full (TM s30, IS s31, PS s17, s20, s21, CwP s20).
Suggested command: /impeccable typeset

**[P1] About a dozen slides have a visible defect, and a dozen more look unfinished.**
- PS s22: "think differently." is `--primary` on a blue gradient over ghosted words (L2885-2889). Unreadable.
- PS s3: quiz is 985px tall in a 901px frame before any answer, 1,417px with four open.
- PS s1, s7, s11, s19: kickers lose to `.slide p` (L657 beats L2354-2363) and render 2rem gray.
- CA s29: `.slide p` (L744) outranks `.quiz-q` (L2038) and `.quiz-feedback` (L2071). "Correct" is twice the size of the answers and question 4 falls off the screen.
- CA s28: the Jeopardy art carries a redrawn SPOKES mark (LOGO-01), runs past the screen, and depends on jeopardylabs.com.
- EA s8: `.area-card h3` is navy on blue, about 2.3:1, because `.slide h3` (L772) overrides the card's white. EA s17 backs are gray on gold, about 2.9:1.
- EA s33: status line renders 2rem (`.slide p` L778 beats `.carousel-status` L1524).
- TM s20: flip-card titles sit on top of words inside the images (L2147-2151), five cards leave a hole in a three-column grid.
- TM s13, s18, s27: pasted raster graphics carry the teaching, with blog credits showing and a typo in s27. TM s18 headings are navy on blue (L1014).
- TM s14: flowchart image has no height cap (L2882) and overflows.
- IS s1: a hard colour seam at 40 percent runs through the headline (L1504-1510). IS s5, s35: tiles 70 to 80 percent empty. IS s16: placeholder-looking pictogram (L2092). IS s32: the question is the smallest text on the slide (L4020).
- CwP s13: 44 to 64px thumbnails beside four one-line bars. CwP s25: accordion headers shrink-wrap with a default border (L2044-2057). CwP s24: the fourth cell uses `.matrix-cell.eliminate` (L805) and looks disabled. CwP s5, s12: tape clipped by `.card{overflow:hidden}` (L1819).
Fix: per-slide repairs, mostly a few lines of CSS each. The TM raster slides need rebuilding as native slides.
Suggested command: /impeccable polish, with /impeccable layout for CwP s13 and IS s5

**[P1] Things that could fail live.**
- Clicker keys. All six handlers accept Right, Left and Space only (TM L3707, IS L4404, EA L4310, CA L4221, CwP L3650, PS L4223). A remote that sends Page Down does nothing. Untested with a real remote. The fix sits in the locked navigation engine.
- Seven of 23 videos are AV1 (CA 2, CwP 2, PS 3; confirmed with ffprobe). Old Edge and Safari on older hardware may not play them. Not tested on a school machine. Fix: re-encode to H.264, same filenames.
- Captions do not load when a lesson is opened from a local file in Chrome or Edge (`build-offline-package.py` L14-15 embeds them for that reason). Present from the website or the offline package.
- CwP names system fonts first: `'Bookman Old Style'` (L1421) and `'Ink Free', 'Comic Sans MS'` (L1427, L1487). The cover changes by computer.
- A lesson reopens where it was left (sessionStorage; TM L3601 and L3935). Rehearse, then start in a new window.
- Slides that overflow scroll only with a mouse wheel, because focus is blurred on each slide (TM L3612) and Arrow Down is unhandled. Live overflows: TM s14, CA s28, CA s29, IS s31 with all panels open, PS s3, CwP s19 by about 50px at 1080p. CwP s25 and CA s24 overflow only in the print capture.
- A maximized 1080p browser that is not full screen gets the larger type with no fit rules (the guard applies at 900px high or less, TM L2527).
Suggested command: /impeccable harden

**[P2] Covers and closings undersell the lessons.**
IS s1 has the colour seam and no image. EA s1 has a floating copyright bar (L2261), PDF buttons and no image. CwP s1 is a stationery photo with a handwriting subtitle. PS s1 breaks "Decision-/Making" at `max-width:640px` (L2367). Closings end on a Rubric button (TM s37, IS) or make "Congratulations" the largest line and the take-home the smallest (CA s33).
Fix: one topic image per cover, PDFs moved to the sidebar Resources, the take-home line largest on the close.
Suggested command: /impeccable bolder

**[P2] Three lessons lack a look of their own, and imagery is uneven everywhere.**
EA is interchangeable. IS and CwP are half authored. Seven image styles in CwP, a Powtoon screenshot with a Play button and watermark (CwP s8, s10), dated 3D clip art in PS (s1, s8, s28), blog graphics in TM. The central idea of two lessons is never drawn large: the Anger Iceberg (CA s9 shows papers and lightning) and EA's two roads (s24, shown 34px tall).
Fix: one owned visual per lesson, repeated on cover, dividers and close. One image treatment per lesson.
Suggested command: /impeccable bolder, then /impeccable delight

## Persona red flags

Instructor presenting with a clicker. Page Down does nothing. Tabs, accordions, flip cards, quizzes and video all need the mouse. The sidebar opens by default above 768px and takes about 22 percent of a 1280 projector. Six slides need a mouse wheel. In Problem Solving a pointer crossing s8 flips all four cards, and clicking a tab kills the arrow keys.

Adult learner in the back row. Cannot read card captions on roughly a third of each deck. EA s8 headings and the PS s22 highlight vanish. Vollkorn's old-style figures make "12 Ways" read as "I2" in CA (s15, s20, s21, s24). CA wheel slices are unreadable (340px canvas, L3571).

## Minor observations

- CA uses `backdrop-filter` in 8 places (L1877 on cards). The house rule bans frosted glass, the blur does nothing visible on flat navy, and it is the costliest paint on old machines.
- Reviewers report TM and PS use teal, coral and amber outside the 11 house colors (TM L1710-1724, PS L2251-2266). Not checked against the standard by the parent.
- Four lessons set theme fonts by selector list, so Outfit and DM Serif Display leak in (EA L1470, L1891; PS L1988, L2099; CwP L815, L2022). CA reassigns the tokens (L1822) and has no leak.
- Problem Solving uses three mantras: "Think / Choose / Act" (s1), "Stop, Options, Choose, Do It" (s11), "Think. Decide. Act." (s28).
- CwP title background is a 10.3 MB PNG (L1462). PS loads 18.9 MB of PNG without lazy loading.
- Gold focus ring is 2.04:1 on white slides. EA removes the outline on four controls (L275, L353, L479, L1516).
- Dashboard at 1920 leaves rows of 4 and 2 (L584) with 0.84rem card text.

## Questions to consider

- What should someone remember from each lesson an hour later? Controlling Anger has the iceberg and never draws it.
- Is the cover for learners or for instructors? Four covers carry PDF download buttons.
- Does the showing need six full decks, or a ten-minute tour of the three to five best slides from each?
