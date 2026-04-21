# Canonical SPOKES Navigation Patterns — 2026-04-21

> Source of truth for Wave-1 Fixer agents on `feat/design-system-strengthening`.
> Patterns derived from `SPOKES-STANDARD.md` §5 and verified in the two reference lessons.
> **Copy-paste these directly into target lessons. Do not re-invent.**

## Reference-Lesson Caveats (read first)

The two "reference" lessons are not both clean. Actual canonical source per pattern:

| Pattern | Canonical source | Why |
|---|---|---|
| P1 — prev/next nav buttons | IS | EA also correct; IS markup slightly tidier (`type="button"` explicit) |
| P2 — accordion button | EA | EA uses native `<button>` for accordion header |
| P3 — slide announcer | **IS only** | EA announces title alone (bug — violates A11Y-05); IS uses `"Slide X of Y: title"` |
| P4 — keyboard handler | **IS only** | IS distinguishes arrow-on-tab from space-on-interactive; EA's guards are coarser |
| P5 — scoped swipe | **IS only** | EA still binds `touchstart` to `document` (violates NAV-10) |
| P6 — skip link | Either (both identical shape) | EA href `#main-content`, IS href `#mainContent` — use `#main-content` for consistency going forward |
| P7 — confettiTriggered | **EA only** | IS uses `triggerGoldStars` pattern instead; EA has the canonical confetti guard |
| P8 — CC toggle sizing | **Neither** | IS has `min-height: 32px` — this is a bug. Canonical comes from SPOKES-STANDARD MOB-03. |

**Wave-1 impact:** Fixer-IS is implied in scope (was not listed). The CC toggle bug in IS (line 970) should be fixed by whichever Fixer passes through videos' CSS. Proposed: add a Fixer-IS task targeting only the CC toggle height.

---

## P1 — Prev/Next Nav Buttons

**SPOKES rule:** A11Y-09 — Navigation Buttons Not Spans
**Source:** `lesson-interview-skills/index.html:2920-2922` ; also `lesson-employee-accountability/index.html:2908-2910`

```html
<button type="button" class="key-icon" id="prevBtn" aria-label="Previous slide">&#8592;</button>
<span class="key-icon" tabindex="0" aria-hidden="true">SPACE</span>
<button type="button" class="key-icon" id="nextBtn" aria-label="Next slide">&#8594;</button>
```

The `<span>SPACE</span>` in the middle is a display-only affordance, not a control — `aria-hidden="true"` keeps it out of the AT tree.

**Wiring:** Add event handlers in JS (not inline) — e.g.,
```js
document.getElementById('prevBtn').addEventListener('click', prevSlide);
document.getElementById('nextBtn').addEventListener('click', nextSlide);
```

**Why:** `<span>` is not in tab order and does not fire on Enter/Space without scaffolding. Native `<button>` is keyboard-operable out of the box.

---

## P2 — Accordion Headers

**SPOKES rule:** A11Y-02 — Accordion ARIA Pattern (CRITICAL)
**Source pattern:** EA uses native `<button>` for accordion headers; spec-compliant.

```html
<div class="accordion-item">
  <button type="button" class="accordion-header" aria-expanded="false" aria-controls="acc-panel-1" onclick="toggleAccordion(this)">
    <span class="accordion-title">Heading text</span>
    <span class="accordion-icon" aria-hidden="true">+</span>
  </button>
  <div id="acc-panel-1" class="accordion-content" hidden>
    <p>Panel body.</p>
  </div>
</div>
```

**Toggle function** (signature per NAV-12 `toggleAccordion(btn)`):
```js
function toggleAccordion(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (panel) panel.hidden = expanded; // hide if was open, show if was closed
  btn.classList.toggle('open', !expanded);
}
```

**Why:** `<button>` elements are natively focusable, fire on Enter/Space, and are announced as buttons by screen readers. `aria-expanded` communicates open/closed state. `aria-controls` links header to panel so AT users can follow the relationship.

---

## P3 — Slide Announcer (CANONICAL: IS only)

**SPOKES rule:** A11Y-05 — announcer must produce `"Slide X of Y: [title]"`.
**Source:** `lesson-interview-skills/index.html:3137-3141`

```js
// Announce slide change to screen readers
const slideTitle = slides[index].querySelector('h1, h2');
const announcer = document.getElementById('slideAnnouncer');
if (announcer && slideTitle) {
  announcer.textContent = 'Slide ' + (index + 1) + ' of ' + slides.length + ': ' + slideTitle.textContent.replace(/\s+/g, ' ').trim();
}
```

**Insert into:** the `doTransition()` inner function within `showSlide(index)`, after focus-clear/session-save, before the transition return.

**Why:** A title-only announcement leaves screen-reader users without position context ("which slide am I on?"). The standardized format restores orientation.

---

## P4 — Keyboard Handler Early-Return Guards (CANONICAL: IS only)

**SPOKES rule:** NAV-09 — guard against textarea, input, `[role="tablist"]` before consuming Space/Arrow.
**Source:** `lesson-interview-skills/index.html:3183-3197`

```js
document.addEventListener('keydown', (e) => {
  const target = e.target;
  const isFormField = target && target.closest('input, textarea, select, [contenteditable="true"]');
  if (isFormField) return;
  if (e.defaultPrevented) return;
  // Only suppress arrow keys for elements that use them internally (tabs)
  const usesArrowKeys = target && target.closest('[role="tab"]');
  if (usesArrowKeys && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) return;
  // Suppress space only on focusable interactive elements (buttons, links, etc.)
  const isInteractive = target && target.closest('button, a, [role="button"], [role="tab"]');
  if (isInteractive && e.key === ' ') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
  else if (e.key === ' ') { e.preventDefault(); nextSlide(); }
});
```

**Why:** Without these guards, Space pressed to activate a tab button *also* advances the slide; arrow keys used to traverse a tab list *also* navigate slides. This pattern:
- Lets `<input>`/`<textarea>`/`[contenteditable]` handle all keys themselves
- Allows a tab component to use arrow keys for its own roving tabindex
- Suppresses Space only when focus is on an interactive element (a button, link, or role=tab) so the element's own activation wins

---

## P5 — Scoped Swipe Handler (CANONICAL: IS only)

**SPOKES rule:** NAV-10 — swipe must be bound to `.main` with `{ passive: true }`.
**Source:** `lesson-interview-skills/index.html:3199-3206`

```js
// Touch/swipe support
let touchStartX = 0;
const mainEl = document.querySelector('.main');
mainEl.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
mainEl.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].screenX;
  if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
}, { passive: true });
```

**Why:** Document-level handlers intercept sidebar swipes and conflict with in-component gesture handling. Scoping to `.main` limits swipe navigation to the slide area. `{ passive: true }` promises the handler won't call `preventDefault()`, enabling browser scroll optimizations.

---

## P6 — Skip Link

**SPOKES rule:** A11Y-04 — skip link must be the first focusable element in `<body>`.
**Source:** `lesson-interview-skills/index.html:1296-1310` (CSS) + `lesson-interview-skills/index.html:1977` (markup)

**Markup** (first child of `<body>`):
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

**CSS:**
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--dark);
  color: var(--light);
  padding: 8px 16px;
  z-index: 10000;
  font-size: 14px;
  transition: top 0.2s;
}
.skip-link:focus { top: 0; }
```

**Target:** the `<main>` or `.main` element needs `id="main-content"` (or the Dashboard grid needs `id="dashboardGrid"` matching the link's href).

**Dashboard variant:** use `href="#dashboardGrid"` and `id="dashboardGrid"` on the module grid container.

**Why:** WCAG 2.4.1 (Level A) — bypass repeated navigation blocks. Hiding it off-screen until focused keeps the visual design clean while preserving the keyboard affordance.

---

## P7 — confettiTriggered Guard (CANONICAL: EA only)

**SPOKES rule:** NAV-08 — confetti must use a boolean guard to prevent re-fire.
**Source:** `lesson-employee-accountability/index.html:2939, 3126-3134`

**Module-scope declaration** (near top of `<script>`, alongside other state):
```js
let confettiTriggered = false;
```

**Inside `showSlide()`'s `doTransition()` inner function**, after the announcer block:
```js
// Reset guard when leaving the closing slide
if (!slides[index].classList.contains('slide-closing')) {
  confettiTriggered = false;
}

// Fire confetti exactly once per visit to the closing slide
if (slides[index].classList.contains('slide-closing') && !confettiTriggered) {
  confettiTriggered = true;
  triggerConfetti();
  playSuccessSound();
}
```

**Why:** Without this guard, navigating off the closing slide and back fires 100 new confetti particles again (and plays the success sound again). The guard fires once per visit; reset happens when focus moves to a non-closing slide, so a legit return visit re-arms correctly.

---

## P8 — CC Toggle Minimum Size (CANONICAL: neither — use spec)

**SPOKES rule:** MOB-03 — 44×44px minimum touch target for sidebar toggle and CC toggle.
**Source:** SPOKES-STANDARD §5 MOB-03 (IS is incorrect at line 970 — `min-height: 32px`).

```css
.cc-toggle {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  padding: 6px 12px;        /* bumped from 4px 10px to preserve visual weight at new height */
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;         /* canonical — was 32px in IS */
  display: flex;
  align-items: center;
  justify-content: center;
}

.cc-toggle:hover {
  color: var(--light);
  border-color: var(--light);
  background: rgba(255, 255, 255, 0.1);
}

.cc-toggle.cc-active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--light);
}

.cc-toggle:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
```

**Why:** WCAG 2.5.8 (Level AA) — `min-height: 32px` fails the 44px touch-target minimum. Adult-ed students often use touch devices; a 32px hit area leads to missed taps and frustration.

**Scope note for Fixers:** If your target lesson has `.cc-toggle` defined (any lesson with a video toolbar), update `min-height` to `44px` and bump padding to `6px 12px` to preserve visual proportions.

---

## Fixer Checklist

When applying these patterns to your target lesson:

1. **Read** SPOKES-STANDARD.md §5 before editing (per project CLAUDE.md).
2. **Use only the patterns above** — do not peek at other lesson implementations; they may contain bugs (see caveat table at top).
3. **After editing, run**: `python scripts/validate-lesson.py <your-lesson>/index.html --caption-grace`. Must be 0 FAIL.
4. **Preserve existing behavior**. These patterns replace buggy code; don't delete adjacent working features (video-pause handlers, session-storage, view-transitions, etc.).
5. **Do not modify shared/global CSS.** Each lesson is self-contained — edit only the CSS inside your target lesson's `<style>` block.

---

## Amendment to Plan

Original Wave 1 did not include a Fixer-IS task. Add it:

- **Fixer-IS (new)** — `lesson-interview-skills/index.html` CC toggle fix only: `min-height: 32px` → `44px` on `.cc-toggle`. Exit: validator 0 FAIL with `--caption-grace`. Runs in parallel with other Wave-1 Fixers.

The other CRITICAL findings in IS (announcer, swipe, keyboard, nav buttons) are already correct — IS is the canonical source for those patterns.
