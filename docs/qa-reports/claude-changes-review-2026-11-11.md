# Review of Claude's lesson and handout changes

Reviewed November 11, 2026, at `5a9d268`.

The changes substantially improve the six released lessons. The individual handouts have consistent branding, useful writing space, intact content, and clean pagination. Widescreen slide layouts and presenter keys work in the checks described below. This is **not a clean sign-off for a large showing yet**: three new defects affect the combined packet, a repeated graphic, and the alignment between one activity's handout and slide. Several existing content and display issues also remain.

This was a read-only review of lesson assets. No lesson, handout, PowerPoint, or test baseline was changed. This report is the only repository addition.

## Scope and method

The change set is `806f922..5a9d268`: Claude's recent showcase pass, beginning after the preceding Money Management work. It contains 368 changed files: six released HTML lesson decks, 49 PDFs, one PowerPoint, print pictures, seven re-encoded videos, and supporting styles/scripts/documentation. No DOCX files changed in this set. Earlier Money Management work and Round 2 drafts are outside this review.

- Navigated all 202 slides in Chromium. Ran the repository's fit check at 1280×720 and 1920×1080, with the sidebar open/closed and with the checked controls pressed. Also checked resting layouts at 1440×900, 1366×768, 1024×768, and 390×844.
- Visually inspected all 218 saved slide pictures in contact sheets, with full-size inspection of suspicious layouts and targeted live screenshots. Video slides do not all have saved print pictures; they were included in the navigation/fit checks.
- Read all 48 individual handout sources. Rendered and visually inspected every page of all 49 committed PDFs: 107 pages in the individual handouts plus the 49-page combined packet, 156 pages total.
- Checked PDF page counts, text outside page boundaries, missing source words, source-page overflow, writing areas/footer intersections, and image loading. Compared changed PDFs with earlier versions where available, including the former combined packet.
- Checked local references and presenter keys in every lesson. Ran text-contrast checks on the resting state of every slide, beyond the repository's cover-only accessibility gate.
- Compared the PowerPoint ZIP/XML parts with the baseline and checked video codecs, audio tracks, and durations.

## Findings to address

### 1. P2 — The combined communication handout packet loses the intended fonts

**New defect.** The separate handouts use Crimson Pro headings and Work Sans body text. The combined packet uses Times-Roman/Times-Bold instead. This changes wrapping, density, and visual consistency throughout the 49-page packet. All words are present and the inspected pages still fit, but the combined document does not match the individual handouts.

The packet declares `@font-face` rules but omits `--font-heading` and `--font-body`. The individual pages declare those variables on `:root`; after `packet.js` imports their styles into shadow roots, those `:root` declarations do not supply the variables to the imported content. The shared stylesheet's variable-based font declarations therefore fall back. The committed packet's first page explicitly embeds Times fonts; its body visibly differs from the standalone version.

Sources: [packet font declarations](../../handout-src/communicating-with-the-public/all-handouts.html#L5), [shadow-root import](../../handout-src/packet.js#L37), [shared font use](../../handout-src/spokes-handout.css#L30).

**Smallest fix:** declare the lesson's font variables on the outer packet document, or set them on each packet host. Rebuild the combined PDF, verify computed font families inside a packet part, and inspect pagination again. Loading declared font files alone does not prove those fonts are actually used.

### 2. P2 — Speech bubbles overlap the new communication-cycle labels

**New defect, slides 1 and 33 of Communicating with the Public.** The central speech-bubble artwork crosses the “Original sender decodes” and “Receiver decodes” labels. This is visible in the committed print pictures and in a live 1920×1080 screenshot. The diagram fits the slide boundary, so the fit probe correctly does not identify this internal collision.

Sources: [cover SVG](../../lesson-communicating-with-the-public/index.html#L2681), [closing SVG](../../lesson-communicating-with-the-public/index.html#L3502).

**Smallest fix:** move or shrink the central bubbles, or reposition the two side labels so neither intersects the artwork. Check both copies and refresh their print pictures afterward. The teaching-slide version uses numbered nodes with explanatory text alongside and does not have this same label collision.

### 3. P2 — Problem Solving's new scenario handout does not match slide 17

**New alignment defect.** The PDF linked from the activity now has ten new scenarios, but slide 17 retains the old numbered scenarios. For example, handout scenario 1 concerns a car that will not start before a new job; slide scenario 1 concerns forgetting an acquaintance's name at the library. Scenario 2 is also different: ideas taken by a coworker in the handout, a consignment-shop payment dispute on the slide. An instructor assigning “scenario 1” can therefore give students two different tasks.

Sources: [new handout scenarios](../../handout-src/problem-solving/group-scenarios.html#L34), [activity PDF link](../../lesson-problem-solving-and-decision-making/index.html#L3827), [slide 17 scenarios](../../lesson-problem-solving-and-decision-making/index.html#L3835).

**Smallest fix:** use the approved new handout scenarios on slide 17 as well, preserving the activity link's location. Then refresh slide 17's print picture and lesson fingerprint.

### 4. P2 — Eight teaching slides still have insufficient text contrast

The cover-only accessibility ratchet passes, but a resting-state axe color-contrast check at 1280×720 identifies 18 affected text elements across eight teaching slides. These are measured failures, not a claim that every interactive state has been audited. Several color combinations predate this change set; the recent polish does not resolve them.

| Lesson | Slide | Affected text | Measured ratio |
|---|---:|---|---:|
| Communicating with the Public | 27 | Six resource-list bullets on blue cards | 3.84:1 |
| Controlling Anger | 12 | White “Professional Resources” heading on gold | 2.04:1 |
| Interview Skills | 19, 31 | Blue checkpoint labels on pale blue | 4.21:1 |
| Problem Solving | 13 | Gold “Scenario:” label on pale blue | 4.04:1 |
| Time Management | 15 | Delegate/Eliminate labels and Eliminate description | 2.82–4.03:1 |
| Time Management | 18 | Two pale descriptions on blue cards | 4.11:1 |
| Time Management | 25 | Three numbered marks on colored blocks | 1.70–3.57:1 |

At the measured sizes and weights, these elements require 4.5:1. A particularly clear example is the white-on-gold heading in Controlling Anger. The low-contrast numbered marks in Time Management are less consequential than teaching text, but remain visible accessibility defects.

Sources: [Time Management matrix](../../lesson-time-management/index.html#L3100), [numbered marks](../../lesson-time-management/index.html#L3396), [Problem Solving scenario label](../../lesson-problem-solving-and-decision-making/index.html#L3738). The exact per-node computed colors, sizes, and targets were recorded during the local audit.

**Smallest fix:** adjust the affected text colors against their actual backgrounds, then rerun checks on the affected slides and their expanded/revealed states. Keep the cover baseline strict; expanding it would hide the wrong problem.

### 5. P2 — Five slides remain unsuitable for a 1024×768 projector with the sidebar open

**Existing problems, improved but not eliminated by this pass.** Every tested widescreen resting layout passes. At 1024×768, the following remain:

| Lesson | Slide | Observed defect |
|---|---:|---|
| Time Management | 14 | Slide content extends 44px beyond its frame; the heading is cropped at the top in the live screenshot |
| Employee Accountability | 17 | 7px of card-heading text is clipped; several two-line headings lose their lower line |
| Employee Accountability | 33 | 11px of carousel text is clipped inside the panel |
| Communicating with the Public | 19 | 7px overflow plus collision with bottom overlays |
| Communicating with the Public | 20 | 22px overflow; the resource button reaches the navigation hint |

The same probe against the baseline HTML, using shared local assets, found 15 affected resting slides in Time Management, 15 in Employee Accountability, and 11 in Communicating with the Public at this size. The current counts are 1, 2, and 2 respectively. Claude's changes are a clear improvement; these five are remaining exceptions rather than new regressions.

**Smallest fix:** accommodate 4:3 dimensions for these slides, remove fixed-height clipping from cards/carousel content, and check the exact classroom display. Do not equate “fits at 720p and 1080p” with “fits every projector.”

Phone-size inspection also found vertical overflow in many slides, genuine horizontal overflow in Time Management slides 10, 14, 23, and 27, and some clipped content. Normal vertical scrolling is not itself a defect. This review does not certify a complete phone presentation experience.

### 6. P2 — The Lunar Survival key retains an incorrect explanation

**Carried over from the original handout and slide, not introduced by the rewrite.** Rank 11 describes the pistols as possible “self-protection.” NASA's published educational answer key identifies their purpose as possible self-propulsion. The numerical ranking is correct; the explanation is not. The PDF and slide 21 agree with each other but share the same error.

Sources: [handout answer key](../../handout-src/problem-solving/lunar-survival.html#L137), [NASA StarChild expert solution](https://starchild.gsfc.nasa.gov/docs/StarChild/space_level2/problems_space_solution.html).

The scenario also never states that the journey is on the sunlit side, although the heating-unit answer relies on that assumption. That omission already existed in the original. Add the daylight assumption so students have the information needed to reason about the ranking.

**Smallest fix:** correct the explanation in the handout source and slide, add the scenario assumption, cite the exercise source, and rebuild the PDF/slide picture. Present the historical activity as a reasoning exercise; its ranking is not operational lunar-survival guidance.

### 7. P2 — The rewritten anger assessment needs a clearer distinction between urgency and aggression

**Content revision needed; an ambiguity from the former resource remains.** Page 1 now says no style is always wrong. Page 3 defines “Forceful” as intimidation, overpowering, and expressing emotions without a filter, then recommends it when someone's safety is at risk. Read literally, this endorses intimidation or loss of control in an emergency. That conflicts with the lesson's useful distinction between assertiveness and aggression.

Sources: [assessment introduction](../../handout-src/controlling-anger/styles-of-anger.html#L61), [Forceful description and recommendation](../../handout-src/controlling-anger/styles-of-anger.html#L137). [SAMHSA's workbook, sessions 7–8](https://library.samhsa.gov/sites/default/files/anger_management_workbook_508_compliant.pdf) distinguishes respectful assertiveness from aggression, threats, and verbal abuse.

**Smallest fix:** distinguish a firm, direct safety instruction from aggression. Describe the unhelpful behavior without recommending intimidation, and revise the “no style is always wrong” sentence accordingly. This is an editorial teaching recommendation; the informal rewritten questionnaire has not been established as a validated assessment.

### 8. P3 — The Daily Planner retains an ambiguous noon label

**Copied from the original planner.** The schedule says “11–12 AM” followed by “12–1 PM.” The first interval ends at noon, not midnight, so the notation is misleading.

Source: [Daily Planner row](../../handout-src/time-management/daily-planner.html#L71).

**Smallest fix:** use “11 AM–noon” and “noon–1 PM,” then rebuild the planner PDF.

## Verification that passed

| Check | Observed result |
|---|---|
| Six lesson validators | No critical failures; five existing convention warnings total in Interview Skills and Employee Accountability |
| Repository slide-fit check | Pass at 1280×720 and 1920×1080, sidebar open/closed, with checked controls pressed |
| Additional widescreen resting checks | All 202 slides pass at 1440×900 and 1366×768 |
| Print-picture freshness | All six lessons current |
| Print dialog and lesson print tests | 59 tests passed, including student/teacher versions in notes, two-slide, and full-slide layouts |
| Handout PDFs | All 49 open; all 156 pages match manifest counts; no text outside paper boundaries |
| Source-to-PDF content | Every source word preserved in committed PDFs; extraction-order and generated-number differences checked separately |
| Handout source display | No measured sheet overflow, text/footer intersection, or missing image in any of the 49 sources, including packet shadow roots |
| Presenter controls | Home, End, Page Down, and Page Up produce the expected slide in all six lessons |
| Local references | No missing local href/src/poster targets in the six decks |
| Cover accessibility ratchet | Pass; five lessons still retain seven list-structure violations each, Time Management clean in that limited check |
| Pixel-to-rem converter | 18 unit tests passed |
| Shared browser proxy helper | Six unit tests passed |
| Seven converted videos | H.264 video and AAC audio present in every file; durations identical to baseline metadata |
| Interview Skills PowerPoint | ZIP valid; all XML parses; 280 entries with identical order; only five notes XML parts differ. All 28 slide parts, images, and other parts are byte-identical to the baseline |

The PowerPoint edit removes private citation prefixes from notes parts 19, 20, 21, 22, and 24 while retaining the teaching prose. There is no evidence of a new visible-slide change in that file. It was not opened in PowerPoint, so this is structural/content comparison rather than a claim of a native PowerPoint rendering pass.

## Limits and recommended next step

This review verifies the local checkout, not the current hosted site or classroom hardware. Safari, Edge, physical clickers, VoiceOver, every expanded contrast state, every video/caption sentence, legacy unmodified teacher documents, and the full BeSpoke service workflow were not exhaustively tested. Raw `file://` caption behavior remains browser-dependent; a working website/offline-package presentation path needs its own rehearsal.

Before the large showing, fix the three new defects first, correct the two teaching-content ambiguities, and resolve the contrast failures. Resolve the five 4:3 exceptions if that display format will be used. Rebuild only affected PDFs/print pictures, refresh fingerprints after lesson edits, rerun the targeted checks, and rehearse on the actual presentation setup. The Daily Planner label is a small correction that can be included in the same pass.
