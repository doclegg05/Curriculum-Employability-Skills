# SPOKES Lesson Builder — Agent Theming Guidelines

**CRITICAL:** You must read these guidelines _before_ building any new SPOKES lesson.

Every SPOKES lesson must look like it belongs to the SPOKES curriculum family while having its own distinct visual identity. Identity comes from **layout variation, font pairings, and accent emphasis** — NOT from changing the brand colors.

---

## Principle 1: Strict Brand Color Palette

**There are exactly 11 approved SPOKES brand colors. No others are permitted.**

> **Canonical source:** `brand-palette.md` in this directory. If any file conflicts with `brand-palette.md`, the palette file wins.

**Core palette (used in every lesson):**

| Variable    | Hex       | Usage                               |
| ----------- | --------- | ----------------------------------- |
| `--primary` | `#007baf` | Headings, primary buttons, links    |
| `--accent`  | `#37b550` | Download buttons, positive emphasis |
| `--dark`    | `#004071` | Sidebar, dark backgrounds           |
| `--light`   | `#FFFFFF` | Text on dark, backgrounds           |
| `--muted`   | `#EDF3F7` | Card backgrounds, subtle fills      |
| `--gray`    | `#60636b` | Body text, subtitles                |
| `--gold`    | `#d3b257` | Gold accents, dividers, badges      |

**Extended palette (available for variety and emphasis):**

| Variable       | Hex       | Usage                                       |
| -------------- | --------- | ------------------------------------------- |
| `--royal`      | `#00133f` | Deep navy backgrounds, premium feel         |
| `--mauve`      | `#a7253f` | Warm accent, caution/emphasis, card borders |
| `--offwhite`   | `#d1d3d4` | Subtle backgrounds, soft borders, dividers  |
| `--muted-gold` | `#ad8806` | Darker gold for text on light, rich accents |

**NEVER introduce any of the following:**

- Bright reds (`#DC2626`, `#991b1b`, etc.)
- Orange shades (`#EA580C`, `#ff6b35`, etc.)
- Any color not listed in the tables above

You may use **opacity variations** of any brand color (e.g., `rgba(0, 123, 175, 0.1)` for a light blue tint) but never introduce new hue values.

**All 11 colors should be defined in `:root`.** Each lesson should use the full palette to ensure visual richness.

---

## Principle 2: Lesson Identity Through Combinatorial Design

Each lesson gets its own visual identity through four mechanisms:

### 2a. Template Variant Selection

There are **3-4 template variants** available. Each provides a different overall look while using the same brand colors. Select the variant that best fits the lesson topic.

Template variants differ in:

- Section divider designs (gradients, geometric patterns, split layouts)
- Card styling (border placement, shadow depth, corner radius)
- Header/title treatments (underlines, backgrounds, decorative elements)
- Spatial arrangement and whitespace patterns
- Background textures and subtle patterns on content slides

### 2b. Combinatorial Design: Backgrounds & Textures

Another high-impact way to create identity is by injecting subtle textures into the lesson background. Because you cannot change the HTML structure of the `.main` container, you achieve this using the `theme-override` CSS block.

**Rules for Background Textures:**

1. Textures must be extremely subtle (e.g., `opacity: 0.03` or `rgba` values under `0.05`).
2. They must use ONLY approved brand colors.
3. They are applied to the `.main` container.

**Example: Subtle Dot Grid (theme-override):**

```css
.main {
  background-color: var(--light);
  background-image: radial-gradient(var(--primary) 1px, transparent 1px);
  background-size: 20px 20px;
}
/* Ensure cards sit above the pattern cleanly */
.card,
.smart-content,
.matrix-cell {
  background-color: var(--light);
  border: 1px solid var(--muted);
}
```

**Example: Premium Royal Background with Diagonal Lines (theme-override):**

> **CAUTION — Dark background scope:** This example sets `.main` to a near-black background. If applied globally, you **must** override text color to `var(--light)` on **every** component type used in the lesson — not just headings and paragraphs. Commonly missed selectors include: `.takeaway-num`, `.smart-letter`, `.smart-content h4`, `.smart-content p`, `.area-header`, `.area-card ul li`, `.activity-box`, `.activity-label`, `.download-btn`, `ul.content-list li`, `.matrix-label`, `.matrix-action`, `.matrix-desc`. Consider scoping this to specific slides (e.g., `.slide-title .main-inner`) rather than the entire `.main` container.

```css
.main {
  background-color: var(--royal);
  background-image: repeating-linear-gradient(
    45deg,
    rgba(211, 178, 87, 0.03),
    /* --gold at 3% */ rgba(211, 178, 87, 0.03) 10px,
    transparent 10px,
    transparent 20px
  );
}
/* Text on dark backgrounds must be light — extend this list for every component used */
.slide h2,
.slide h3,
.slide p,
.card h4,
.card p {
  color: var(--light);
}
```

### 2c. Typography Variation

**How to apply fonts:**

1. Add Google Fonts `<link>` tags in the `<head>`, **after** the default Outfit/DM Serif Display imports.
2. Append a `<style id="theme-override">` block **AFTER** the main SPOKES `<style>` block.

**CRITICAL ordering:** The theme-override `<style>` block MUST come AFTER the main CSS block, not before it. Otherwise the main CSS will override your changes.

```html
<!-- 1. Default fonts (keep these) -->
<link
  href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
<!-- 2. Lesson-specific fonts -->
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
  rel="stylesheet"
/>

<!-- ... main SPOKES <style> block first ... -->

<!-- 3. Theme override AFTER main CSS -->
<style id="theme-override">
  body {
    font-family: "Inter", sans-serif;
  }

  .slide-title h1,
  .slide h2,
  .slide h3,
  .card h4,
  .smart-content h4,
  .matrix-action {
    font-family: "Playfair Display", serif;
  }
</style>
```

**Font selection rules:**

- Heading fonts must be legible at 4rem-5rem sizes.
- Body fonts must be highly readable at 1.5rem-2rem sizes.
- **Always propose font pairings to the user for approval before applying.**

### 2d. Accent Emphasis Variation

Within the 11 brand colors, you can shift which color is _emphasized_ per lesson:

- One lesson might lean heavily on `--primary` (blue) for cards and backgrounds
- Another might feature `--gold` more prominently in borders and highlights
- Another might use `--accent` (green) as the dominant visual accent

This creates a different "feel" without breaking brand compliance.

---

## Principle 3: Rhythm and Component Variation

The component library provides many slide layouts. **Do not use the same sequence of layouts as other lessons.**

- If lesson A used `smart-stack` + `cards-grid` + `takeaways`, lesson B should favor `dangers-grid` + `areas-grid` + `split-layout`.
- Vary the mix of big-statement slides, content slides, and activity slides.
- Each lesson should have a recognizable rhythm that differs from its neighbors.

**Before building, review existing lessons** to see what components they use, and deliberately choose a different combination.

---

## Principle 4: Video Slides

**If a video file is provided**, embed it using the `<video>` pattern from `components.md`. Videos must be downloaded to the local `videos/` folder for each project. **Do not use external iframe embeds (like YouTube)** to prevent broken links.

**If no video is provided yet**, build a styled placeholder layout.

When no video exists, create the structural slide with a branded placeholder:

**Video Placeholder HTML:**

```html
<section class="slide slide-video" data-chapter="3">
  <h2>Watch: Video Title Here</h2>
  <div class="video-container">
    <div class="video-placeholder">
      <div class="video-placeholder-icon">&#9654;</div>
      <p class="video-placeholder-title">Video Title Here</p>
      <p class="video-placeholder-note">Video will be added</p>
    </div>
  </div>
</section>
```

**Video Placeholder CSS** (add to theme-override block):

```css
.video-placeholder {
  width: 100%;
  max-width: 1200px;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, var(--muted) 0%, var(--offwhite) 100%);
  border: 2px dashed var(--gray);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0 auto;
}

.video-placeholder-icon {
  font-size: 4rem;
  color: var(--primary);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 123, 175, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--dark);
}

.video-placeholder-note {
  font-size: 1rem;
  color: var(--gray);
  font-style: italic;
}
```

When video files are later provided, place them in the `videos/` folder and replace the `.video-placeholder` div with the standard `<video>` tag:

```html
<div
  class="video-container"
  style="position:relative; width:100%; max-width:900px; margin:0 auto;"
>
  <video
    controls
    class="local-video"
    style="width:100%; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.15);"
    poster="videos/poster-image-name.jpg"
  >
    <source src="videos/video-file-name.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>
```

---

## Principle 5: Chapter Structure Flexibility

The WIPPEA framework provides 7 standard chapters (W, I, P1, P2, P3, E, A). However, lessons may use **more or fewer chapters** if the content demands it.

- The standard 7-chapter structure is the default starting point.
- If a lesson has more content areas, additional chapters are allowed.
- `data-chapter` values must be sequential starting from `"1"`.
- Every chapter must start with a `slide-section` divider.
- The sidebar builds itself from `data-chapter` attributes automatically.

---

## Principle 6: Optional Per-Lesson Effects

Each lesson may include **at most 2** of the following optional effects to create visual distinction. All effects are gated on `prefersReduced` and pause when not on the active slide. These go in `<style id="theme-override">` and an additional `<script>` block at the end of the lesson.

### 6a. Pointer Tracking Spotlight

A subtle radial gradient that follows the cursor on title and section slides. Creates an ambient glow effect.

**CSS (theme-override):**

```css
.slide-title,
.slide-section.spotlight {
  --mx: 50%;
  --my: 50%;
}
.slide-title::before,
.slide-section.spotlight::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--mx) var(--my),
    rgba(211, 178, 87, 0.12),
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}
```

**JS:**

```javascript
if (!prefersReduced) {
  document.addEventListener("pointermove", (e) => {
    const active = document.querySelector(".slide.active");
    if (
      active &&
      (active.classList.contains("slide-title") ||
        active.classList.contains("slide-section"))
    ) {
      const rect = active.getBoundingClientRect();
      active.style.setProperty(
        "--mx",
        ((e.clientX - rect.left) / rect.width) * 100 + "%",
      );
      active.style.setProperty(
        "--my",
        ((e.clientY - rect.top) / rect.height) * 100 + "%",
      );
    }
  });
}
```

**When to use:** Lessons that want a premium, interactive feel on their title and chapter dividers. Ignored on touch devices.

### 6b. Parallax Title Slide

CSS-only depth layering on the title slide using `perspective` and `translateZ`.

**CSS (theme-override):**

```css
.slide-title.parallax {
  perspective: 800px;
  transform-style: preserve-3d;
}
.slide-title.parallax .logo {
  transform: translateZ(40px);
}
.slide-title.parallax h1 {
  transform: translateZ(60px);
}
.slide-title.parallax .subtitle {
  transform: translateZ(20px);
}
```

**When to use:** Adds visual depth to the title slide without JS. Add class `parallax` to the `slide-title` section element.

### 6c. Text Scramble for Big-Statement

Character-by-character reveal animation for impactful quote slides.

**JS:**

```javascript
function scrambleReveal(el) {
  if (prefersReduced) return;
  const text = el.textContent;
  const chars = "!<>-_\\/[]{}=+*^?#________";
  let iteration = 0;
  const interval = setInterval(() => {
    el.textContent = text
      .split("")
      .map((char, i) => {
        if (i < iteration) return text[i];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");
    iteration += 1 / 3;
    if (iteration >= text.length) {
      clearInterval(interval);
      el.textContent = text;
    }
  }, 30);
}
```

**When to use:** Add `data-scramble` attribute to a `.big-statement h2`. Hook into `showSlide()` — when the active slide is a big-statement with `data-scramble`, call `scrambleReveal()` on the h2.

### 6d. Canvas Particle Background

Lightweight particle field for title or closing slides. Uses only brand colors.

**HTML:**

```html
<canvas class="particle-bg" id="particleCanvas" aria-hidden="true"></canvas>
```

**CSS (theme-override):**

```css
.particle-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
```

**JS:**

```javascript
function initParticles(canvas, slideEl) {
  if (prefersReduced) return;
  const ctx = canvas.getContext("2d");
  canvas.width = slideEl.clientWidth;
  canvas.height = slideEl.clientHeight;
  const COLORS = ["#007baf", "#37b550", "#d3b257", "#EDF3F7"];
  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 3 + 1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  let lastFrame = 0;
  const FRAME_INTERVAL = 1000 / 30;

  function draw(timestamp) {
    if (!slideEl.classList.contains("active") || document.hidden) {
      requestAnimationFrame(draw);
      return;
    }
    if (timestamp - lastFrame < FRAME_INTERVAL) {
      requestAnimationFrame(draw);
      return;
    }
    lastFrame = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
```

**When to use:** Title or closing slides that want ambient motion. Max 50 particles, 30fps target. Pauses when tab is hidden or slide is not active. Performance budget: must not cause frame drops on 768px tablet viewport.

---

## Checklist Before Building

- [ ] Confirmed which template variant to use for this lesson
- [ ] Proposed font pairing to user and received approval
- [ ] Verified all colors in CSS are from the 11-color brand palette only (see `brand-palette.md`)
- [ ] No prohibited colors anywhere (see `brand-palette.md` prohibited list)
- [ ] Theme-override `<style>` block is placed AFTER the main CSS block
- [ ] Video slides use embedded iframe (if URL provided) or placeholder (if no URL)
- [ ] Component selection differs from adjacent lessons in the curriculum
- [ ] Reviewed existing lessons to ensure visual distinction
- [ ] At most 2 optional per-lesson effects (Principle 6) selected
- [ ] All optional effects gated on `prefersReduced`
- [ ] `prefers-reduced-motion` tested (all animations disabled, no sounds, no confetti)
