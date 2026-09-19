(() => {
  "use strict";

  const STORAGE_KEY = "bespoke-draft-v1";
  const REPO = "doclegg05/Curriculum-Employability-Skills";
  const LIBRARY_URL = "../SPOKES%20Builder/bespoke-library-catalog.json";
  const THEME_OPTIONS_URL = "../SPOKES%20Builder/theme-options.json";
  const META_URL = "./catalog.json";

  /** `view` = the preview the step lands on; a manual tab pick sticks until the step changes. */
  const STEPS = [
    { id: "team", label: "Lesson & team", view: "title" },
    { id: "preset", label: "Theme preset", view: "title" },
    { id: "color", label: "Color lead", view: "title" },
    { id: "surface", label: "Sidebar & background", view: "title" },
    { id: "layouts", label: "Title & dividers", view: "title" },
    { id: "cards", label: "Cards", view: "cards" },
    { id: "fonts", label: "Fonts", view: "cards" },
    { id: "content", label: "Your content", view: "cards" },
    { id: "review", label: "Review & submit", view: "title" }
  ];

  const VIEW_NAMES = { title: "Title slide", divider: "Section divider", cards: "Content slide" };

  const state = {
    step: 0,
    meta: null,
    library: null,
    lessonId: "money-management",
    teamName: "",
    spokespersonName: "",
    spokespersonEmail: "",
    presetId: "professional",
    colorLead: "blue",
    sidebarColor: "dark",
    backgroundTexture: "dot-grid",
    titleSlide: "centered-gradient",
    dividerStyle: "gradient-sweep",
    cardStyle: "left-border",
    varyCardsByChapter: false,
    chapterCards: {},
    fontPairing: "dm-serif-display-outfit",
    lessonTitle: "",
    lessonSubtitle: "",
    sampleBullets: "1. Name one money goal for this month\n2. List your fixed costs\n3. Find one place to trim spending",
    sampleMyth: "Myth: Budgets are only for people in debt.\nReality: A budget is a plan that works for any income.",
    unspoken: "",
    previewView: "title"
  };

  /** Transient UI state — never saved to the draft. */
  const ui = {
    renderedStep: null,
    previewPinned: false,
    lastChange: null,
    pulseTimer: null
  };

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function byId(id) {
    return document.getElementById(id);
  }

  function familyOptions(family) {
    return state.library?.families?.[family]?.options || [];
  }

  function findOption(family, slug) {
    return familyOptions(family).find((o) => o.slug === slug);
  }

  function findMeta(list, id) {
    return (list || []).find((item) => item.id === id);
  }

  function uiKey(family, slug) {
    return `${family}.${slug}`;
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      Object.assign(state, saved, { meta: state.meta, library: state.library });
    } catch {
      /* ignore */
    }
  }

  function saveDraft() {
    const { meta, library, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }

  function applyPreset(presetId) {
    const preset = findMeta(state.meta.presets, presetId);
    if (!preset) return;
    const changed = Object.entries(preset.defaults).filter(([k, v]) => state[k] !== v).length;
    state.presetId = presetId;
    Object.assign(state, preset.defaults);
    if (!state.varyCardsByChapter) state.chapterCards = {};
    noteChange(
      `Applied ${preset.label} preset`,
      `${changed} setting${changed === 1 ? "" : "s"} changed — everything stays editable.`,
      true
    );
  }

  /**
   * Record what just changed so the preview caption and live region can say it
   * (e.g. "Updated · Card style → Shadow Float"). `plain` skips the arrow format.
   */
  function noteChange(dimension, label, plain = false) {
    ui.lastChange = { dimension, label, plain };
  }

  /** THM-04: adjacent WIPPEA chapters must not share the same card slug. */
  function enforceAdjacentCardUniqueness(changedKey) {
    const keys = state.meta.chapterKeys;
    const idx = keys.indexOf(changedKey);
    if (idx < 0) return;
    const current = state.chapterCards[changedKey];
    const neighbors = [keys[idx - 1], keys[idx + 1]].filter(Boolean);
    const conflict = neighbors.find((n) => state.chapterCards[n] === current);
    if (!conflict) return;
    const alt = familyOptions("cards").find(
      (o) => o.slug !== current && o.slug !== state.chapterCards[neighbors[0]] && o.slug !== state.chapterCards[neighbors[1]]
    );
    if (alt) {
      state.chapterCards[changedKey] = alt.slug;
      return alt.slug;
    }
    return null;
  }

  function neighborKeys(key) {
    const keys = state.meta.chapterKeys;
    const idx = keys.indexOf(key);
    return [keys[idx - 1], keys[idx + 1]].filter(Boolean);
  }

  function seedChapterCards() {
    const cards = familyOptions("cards");
    const keys = state.meta.chapterKeys;
    keys.forEach((key, i) => {
      if (state.chapterCards[key]) return;
      // Rotate so adjacent chapters differ (THM-04)
      const slug = cards[i % cards.length]?.slug || state.cardStyle;
      const prev = keys[i - 1];
      if (prev && state.chapterCards[prev] === slug && cards.length > 1) {
        state.chapterCards[key] = cards[(i + 1) % cards.length].slug;
      } else {
        state.chapterCards[key] = slug;
      }
    });
  }

  function buildStepper() {
    const list = byId("stepList");
    list.innerHTML = "";
    STEPS.forEach((step, index) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<span class="step-num" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></span><span>${step.label}</span>`;
      btn.setAttribute("aria-label", `Step ${index + 1} of ${STEPS.length}: ${step.label}`);
      if (index === state.step) btn.setAttribute("aria-current", "step");
      if (index < state.step) btn.classList.add("is-done");
      btn.addEventListener("click", () => {
        state.step = index;
        render();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  /**
   * Selected state is never colour-only (A11Y-16): a check badge plus
   * visually-hidden "Selected" text accompany the border/ring styling.
   */
  function selectionMark(pressed) {
    const frag = document.createDocumentFragment();
    const check = document.createElement("span");
    check.className = "option-check";
    check.setAttribute("aria-hidden", "true");
    frag.appendChild(check);
    if (pressed) {
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = "Selected";
      frag.appendChild(sr);
    }
    return frag;
  }

  function optionButton({ id, label, detail, usedBy, swatch, swatchClass, pressed, badge, onSelect, blocked, reason }) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option" + (blocked ? " is-blocked" : "");
    btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    btn.dataset.id = id;
    if (blocked) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      if (reason) btn.title = reason;
    }
    btn.appendChild(selectionMark(pressed));
    if (swatch || swatchClass) {
      const sw = document.createElement("div");
      sw.className = swatchClass ? `swatch ${swatchClass}` : "swatch";
      if (swatch) sw.style.background = swatch;
      btn.appendChild(sw);
    }
    const strong = document.createElement("strong");
    strong.textContent = label;
    btn.appendChild(strong);
    if (detail) {
      const small = document.createElement("small");
      small.textContent = detail;
      btn.appendChild(small);
    }
    if (badge) {
      const tag = document.createElement("span");
      tag.className = "new-tag";
      tag.textContent = badge;
      btn.appendChild(tag);
    }
    if (usedBy && usedBy.length) {
      const tag = document.createElement("span");
      tag.className = "used-tag";
      tag.textContent = `Used by ${usedBy.join(", ")}`;
      btn.appendChild(tag);
    }
    if (blocked && reason) {
      const tag = document.createElement("span");
      tag.className = "blocked-tag";
      tag.textContent = reason;
      btn.appendChild(tag);
    }
    if (!blocked) btn.addEventListener("click", onSelect);
    return btn;
  }

  function renderLibraryOptions(grid, family, selectedSlug, onPick, { swatchFor, swatchClassFor, showNew } = {}) {
    familyOptions(family).forEach((opt) => {
      grid.appendChild(
        optionButton({
          id: opt.id,
          label: opt.label,
          detail: opt.description || null,
          swatch: swatchFor ? swatchFor(opt) : null,
          swatchClass: swatchClassFor ? swatchClassFor(opt) : null,
          pressed: selectedSlug === opt.slug,
          badge: showNew && opt.legacy === false ? "New" : null,
          blocked: Boolean(opt.blocked),
          reason: opt.reason || "",
          onSelect: () => onPick(opt)
        })
      );
    });
  }

  /** Three-band strip (lead gradient · sidebar tone · gold hairline) from the preset's defaults. */
  function presetSwatch(preset) {
    const cue = (state.meta.colorLeadPreview || {})[preset.defaults.colorLead] || {};
    const side = (state.meta.sidebarPreview || {})[preset.defaults.sidebarColor] || "var(--dark)";
    const strip = document.createElement("div");
    strip.className = "preset-swatch";
    strip.setAttribute("aria-hidden", "true");
    const lead = document.createElement("span");
    lead.style.background = `linear-gradient(135deg, ${cue.gradientFrom || "var(--primary)"}, ${cue.gradientTo || "var(--dark)"})`;
    const sidebar = document.createElement("span");
    sidebar.style.background = side;
    const gold = document.createElement("span");
    gold.className = "preset-swatch-gold";
    strip.append(lead, sidebar, gold);
    return strip;
  }

  function renderTeam(panel) {
    panel.innerHTML = `
      <h1>Lesson &amp; spokesperson</h1>
      <p class="panel-lead">One submission per Round 2 team. The spokesperson speaks for the team and sends the Spoke Signal.</p>
      <div class="field-grid two">
        <label class="field">Lesson
          <select id="lessonSelect"></select>
        </label>
        <label class="field">Team name
          <input id="teamName" type="text" autocomplete="organization" placeholder="e.g. Money Management Team">
        </label>
        <label class="field">Spokesperson name
          <input id="spokespersonName" type="text" autocomplete="name" required placeholder="Your name">
        </label>
        <label class="field">Spokesperson email
          <input id="spokespersonEmail" type="email" autocomplete="email" placeholder="you@example.org">
        </label>
      </div>
    `;
    const select = byId("lessonSelect");
    state.meta.lessons.forEach((lesson) => {
      const opt = document.createElement("option");
      opt.value = lesson.id;
      opt.textContent = lesson.note ? `${lesson.title} (${lesson.note})` : lesson.title;
      if (lesson.id === state.lessonId) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      state.lessonId = select.value;
      saveDraft();
      updatePreview();
    });
    const bind = (id, key) => {
      const input = byId(id);
      if (!input) return;
      input.value = state[key] || "";
      const sync = () => {
        state[key] = input.value;
        saveDraft();
        updatePreview();
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    };
    bind("teamName", "teamName");
    bind("spokespersonName", "spokespersonName");
    bind("spokespersonEmail", "spokespersonEmail");
  }

  function renderPreset(panel) {
    panel.innerHTML = `
      <h1>Theme preset</h1>
      <p class="panel-lead">Pick the closest starting point. Every choice stays editable on the next steps — most teams stop here.</p>
      <div class="preset-grid" id="presetGrid" role="group" aria-label="Theme presets"></div>
    `;
    const grid = byId("presetGrid");
    state.meta.presets.forEach((preset) => {
      const pressed = preset.id === state.presetId;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset";
      btn.dataset.id = preset.id;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      btn.appendChild(selectionMark(pressed));
      btn.appendChild(presetSwatch(preset));
      const strong = document.createElement("strong");
      strong.textContent = preset.label;
      const small = document.createElement("small");
      small.textContent = preset.blurb;
      btn.append(strong, small);
      btn.addEventListener("click", () => {
        applyPreset(preset.id);
        saveDraft();
        render();
      });
      grid.appendChild(btn);
    });
  }

  function renderColor(panel) {
    panel.innerHTML = `
      <h1>Color lead</h1>
      <p class="panel-lead">The main color for headings and buttons. Every option is already on-brand; leads used by earlier lessons are marked.</p>
      <div class="option-grid" id="colorGrid" role="group" aria-label="Color leads"></div>
    `;
    const grid = byId("colorGrid");
    const cues = state.meta.colorLeadPreview || {};
    familyOptions("colorLeads").forEach((opt) => {
      const cue = cues[opt.slug] || {};
      grid.appendChild(
        optionButton({
          id: opt.id,
          label: opt.label,
          usedBy: cue.usedBy,
          swatch: `linear-gradient(135deg, ${cue.gradientFrom || "var(--primary)"}, ${cue.gradientTo || "var(--dark)"})`,
          pressed: state.colorLead === opt.slug,
          blocked: Boolean(opt.blocked),
          reason: opt.reason || "",
          onSelect: () => {
            state.colorLead = opt.slug;
            noteChange("Color lead", opt.label);
            saveDraft();
            render();
          }
        })
      );
    });
  }

  function renderSurface(panel) {
    panel.innerHTML = `
      <h1>Sidebar &amp; background</h1>
      <p class="panel-lead">The chapter sidebar tone and the slide background. Dark Royal flips the whole lesson to a dark theme.</p>
      <p class="group-label" id="sidebarLabel">Sidebar</p>
      <div class="option-grid" id="sidebarGrid" role="group" aria-labelledby="sidebarLabel"></div>
      <p class="group-label" id="textureLabel">Background</p>
      <div class="option-grid" id="textureGrid" role="group" aria-labelledby="textureLabel"></div>
    `;
    const sidePreview = state.meta.sidebarPreview || {};
    renderLibraryOptions(byId("sidebarGrid"), "sidebarColors", state.sidebarColor, (opt) => {
      state.sidebarColor = opt.slug;
      noteChange("Sidebar", opt.label);
      saveDraft();
      render();
    }, { swatchFor: (opt) => sidePreview[opt.slug] || "var(--dark)" });
    renderLibraryOptions(byId("textureGrid"), "backgroundTextures", state.backgroundTexture, (opt) => {
      state.backgroundTexture = opt.slug;
      noteChange("Background", opt.label);
      saveDraft();
      render();
    }, { swatchClassFor: (opt) => `swatch-texture is-texture-${opt.slug}` });
  }

  function renderLayouts(panel) {
    panel.innerHTML = `
      <h1>Title &amp; dividers</h1>
      <p class="panel-lead">How the opening slide and each chapter's divider look. Watch the preview switch as you pick.</p>
      <p class="group-label" id="titleLabel">Title slide</p>
      <div class="option-grid" id="titleGrid" role="group" aria-labelledby="titleLabel"></div>
      <p class="group-label" id="dividerLabel">Section divider</p>
      <div class="option-grid" id="dividerGrid" role="group" aria-labelledby="dividerLabel"></div>
    `;
    renderLibraryOptions(byId("titleGrid"), "titleSlides", state.titleSlide, (opt) => {
      state.titleSlide = opt.slug;
      showView("title");
      noteChange("Title slide", opt.label);
      saveDraft();
      render();
    }, { showNew: true });
    renderLibraryOptions(byId("dividerGrid"), "dividers", state.dividerStyle, (opt) => {
      state.dividerStyle = opt.slug;
      showView("divider");
      noteChange("Divider", opt.label);
      saveDraft();
      render();
    }, { showNew: true });
  }

  function renderCards(panel) {
    panel.innerHTML = `
      <h1>Cards</h1>
      <p class="panel-lead">The card style for content slides. Turn on <em>Vary by chapter</em> to give each WIPPEA stage its own look — neighbouring chapters always differ.</p>
      <div class="option-grid" id="cardGrid" role="group" aria-label="Card styles"></div>
      <div class="toggle-row">
        <input type="checkbox" id="varyCards" ${state.varyCardsByChapter ? "checked" : ""}>
        <label for="varyCards">
          <strong>Vary by chapter</strong><br>
          <span style="font-weight:400;color:var(--gray)">A different card style for each WIPPEA stage.</span>
        </label>
      </div>
      <p id="thmNote" class="panel-lead" style="margin-top:0"></p>
      <div class="chapter-vary ${state.varyCardsByChapter ? "is-open" : ""}" id="chapterVary"></div>
    `;
    renderLibraryOptions(byId("cardGrid"), "cards", state.cardStyle, (opt) => {
      state.cardStyle = opt.slug;
      showView("cards");
      noteChange("Card style", opt.label);
      saveDraft();
      render();
    }, { showNew: true });

    byId("varyCards").addEventListener("change", (e) => {
      state.varyCardsByChapter = e.target.checked;
      if (state.varyCardsByChapter) seedChapterCards();
      showView("cards");
      noteChange("Vary by chapter", state.varyCardsByChapter ? "On" : "Off");
      saveDraft();
      render();
    });

    const chapterVary = byId("chapterVary");
    const thmNote = byId("thmNote");
    if (state.varyCardsByChapter) {
      thmNote.textContent = "Neighbouring chapters always get different card styles — if two would match, the second is switched for you.";
      state.meta.chapterKeys.forEach((key) => {
        const label = document.createElement("label");
        label.textContent = key;
        const select = document.createElement("select");
        select.setAttribute("aria-label", `Card style for chapter ${key}`);
        familyOptions("cards").forEach((style) => {
          const opt = document.createElement("option");
          opt.value = style.slug;
          opt.textContent = style.legacy === false ? `${style.label} (new)` : style.label;
          if ((state.chapterCards[key] || state.cardStyle) === style.slug) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => {
          state.chapterCards[key] = select.value;
          const adjusted = enforceAdjacentCardUniqueness(key);
          if (adjusted && adjusted !== select.value) {
            select.value = adjusted;
            const neighbors = neighborKeys(key).join(" and ");
            thmNote.textContent = `Changed ${key} to ${findOption("cards", adjusted)?.label || adjusted} so it differs from ${neighbors}.`;
          }
          noteChange(`Chapter ${key} cards`, findOption("cards", state.chapterCards[key])?.label || state.chapterCards[key]);
          saveDraft();
          updatePreview();
        });
        label.appendChild(select);
        chapterVary.appendChild(label);
      });
    }
  }

  function renderFonts(panel) {
    panel.innerHTML = `
      <h1>Fonts</h1>
      <p class="panel-lead">Heading and body typefaces, self-hosted so they work offline and behind school filters.</p>
      <div class="option-grid" id="fontGrid" role="group" aria-label="Font pairings"></div>
    `;
    const grid = byId("fontGrid");
    state.meta.fontPairings.forEach((item) => {
      grid.appendChild(
        optionButton({
          id: item.id,
          label: item.label,
          detail: item.mood,
          pressed: state.fontPairing === item.id,
          onSelect: () => {
            state.fontPairing = item.id;
            noteChange("Fonts", item.label);
            saveDraft();
            render();
          }
        })
      );
    });
  }

  function renderContent(panel) {
    const lesson = findMeta(state.meta.lessons, state.lessonId);
    panel.innerHTML = `
      <h1>Your content</h1>
      <p class="panel-lead">Paste a little real text so the preview looks like your lesson. This is a sample — the full lesson is built later.</p>
      <div class="field-grid">
        <label class="field">Lesson title
          <input id="lessonTitle" type="text" placeholder="${lesson ? lesson.title : "Lesson title"}">
        </label>
        <label class="field">Subtitle
          <input id="lessonSubtitle" type="text" placeholder="Short phrase under the title">
        </label>
        <label class="field">Key points (one per line — become cards)
          <textarea id="sampleBullets"></textarea>
        </label>
        <label class="field">Myth / reality pair (card detail and takeaway)
          <textarea id="sampleMyth"></textarea>
        </label>
      </div>
    `;
    const bind = (id, key) => {
      const input = byId(id);
      if (!input) return;
      input.value = state[key] || "";
      const sync = () => {
        state[key] = input.value;
        saveDraft();
        updatePreview();
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    };
    bind("lessonTitle", "lessonTitle");
    bind("lessonSubtitle", "lessonSubtitle");
    bind("sampleBullets", "sampleBullets");
    bind("sampleMyth", "sampleMyth");
  }

  function renderReview(panel) {
    const labels = selectionLabels();
    panel.innerHTML = `
      <h1>Review &amp; submit</h1>
      <p class="panel-lead">Check your choices, then send the Spoke Signal. Britt reviews the request; approval is the go-ahead to build.</p>
      <ul class="summary-list" id="summaryList"></ul>
      <label class="field" style="margin-top:1.25rem">Unspoken — something we wish existed in the library
        <textarea id="unspoken" placeholder="Optional wish-list for future library pieces"></textarea>
      </label>
      <div id="submitStatus"></div>
      <details class="builder-note">
        <summary>For builders</summary>
        <dl id="builderDetails"></dl>
        <p>Options load from <code>SPOKES Builder/bespoke-library-catalog.json</code> (UI key <code>{family}.{slug}</code>); the selection payload and intake markdown store <strong>slugs only</strong>, matching <code>theme-registry.json</code>. Card styles may vary by WIPPEA chapter (D12); adjacent chapters never share a style (THM-04). Submit opens a labelled GitHub issue — no token in this browser — and the Spoke Signals Action opens the lesson-tagged PR; merge is the greenlight (D10). Visual reference: <a href="../SPOKES%20Builder/library-preview.html" target="_blank" rel="noopener">library preview</a>.</p>
      </details>
    `;
    const list = byId("summaryList");
    Object.entries(labels).forEach(([k, v]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${k}</span><strong>${escapeHtml(v)}</strong>`;
      list.appendChild(li);
    });
    const details = byId("builderDetails");
    Object.entries(builderIds()).forEach(([k, v]) => {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.innerHTML = `<code>${escapeHtml(v)}</code>`;
      details.append(dt, dd);
    });
    const unspoken = byId("unspoken");
    unspoken.value = state.unspoken || "";
    unspoken.addEventListener("input", () => {
      state.unspoken = unspoken.value;
      saveDraft();
    });
  }

  function selectionLabels() {
    const lesson = findMeta(state.meta.lessons, state.lessonId);
    const preset = findMeta(state.meta.presets, state.presetId);
    const cardLabel = (slug) => findOption("cards", slug)?.label || slug;
    return {
      Lesson: lesson ? lesson.title : state.lessonId,
      Team: state.teamName || "—",
      Spokesperson: state.spokespersonName || "—",
      "Theme preset": preset ? preset.label : state.presetId,
      "Color lead": findOption("colorLeads", state.colorLead)?.label || state.colorLead,
      Sidebar: findOption("sidebarColors", state.sidebarColor)?.label || state.sidebarColor,
      Background: findOption("backgroundTextures", state.backgroundTexture)?.label || state.backgroundTexture,
      "Title slide": findOption("titleSlides", state.titleSlide)?.label || state.titleSlide,
      Divider: findOption("dividers", state.dividerStyle)?.label || state.dividerStyle,
      Cards: state.varyCardsByChapter
        ? `Vary by chapter — ${state.meta.chapterKeys
            .map((k) => `${k}: ${cardLabel(state.chapterCards[k] || state.cardStyle)}`)
            .join(", ")}`
        : cardLabel(state.cardStyle),
      Fonts: findMeta(state.meta.fontPairings, state.fontPairing)?.label || state.fontPairing
    };
  }

  /** Catalog ids for the collapsed "For builders" footnote on Review. */
  function builderIds() {
    return {
      Preset: state.presetId,
      "Color lead": uiKey("colorLeads", state.colorLead),
      Sidebar: uiKey("sidebarColors", state.sidebarColor),
      Background: uiKey("backgroundTextures", state.backgroundTexture),
      "Title slide": uiKey("titleSlides", state.titleSlide),
      Divider: uiKey("dividers", state.dividerStyle),
      Cards: state.varyCardsByChapter
        ? state.meta.chapterKeys.map((k) => `${k}=${uiKey("cards", state.chapterCards[k] || state.cardStyle)}`).join(" ")
        : uiKey("cards", state.cardStyle),
      Fonts: state.fontPairing
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPanel() {
    const panel = byId("stepPanel");
    const id = STEPS[state.step].id;
    const renderers = {
      team: renderTeam,
      preset: renderPreset,
      color: renderColor,
      surface: renderSurface,
      layouts: renderLayouts,
      cards: renderCards,
      fonts: renderFonts,
      content: renderContent,
      review: renderReview
    };
    renderers[id](panel);

    const nav = document.createElement("div");
    nav.className = "panel-nav";
    nav.innerHTML = `
      <button type="button" class="btn btn-secondary" id="btnBack"${state.step === 0 ? " disabled" : ""}>Back</button>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        ${
          id === "review"
            ? `<button type="button" class="btn btn-accent" id="btnSubmit">Submit Spoke Signal</button>`
            : `<button type="button" class="btn btn-primary" id="btnNext">Next</button>`
        }
      </div>
    `;
    panel.appendChild(nav);
    byId("btnBack")?.addEventListener("click", () => {
      state.step = Math.max(0, state.step - 1);
      render();
    });
    byId("btnNext")?.addEventListener("click", () => {
      if (!validateCurrentStep()) return;
      state.step = Math.min(STEPS.length - 1, state.step + 1);
      render();
    });
    byId("btnSubmit")?.addEventListener("click", onSubmit);
  }

  function syncTeamFieldsFromDom() {
    const map = [
      ["teamName", "teamName"],
      ["spokespersonName", "spokespersonName"],
      ["spokespersonEmail", "spokespersonEmail"],
      ["lessonSelect", "lessonId"]
    ];
    map.forEach(([domId, key]) => {
      const el = byId(domId);
      if (el) state[key] = el.value;
    });
  }

  function validateCurrentStep() {
    const id = STEPS[state.step].id;
    if (id === "team") {
      syncTeamFieldsFromDom();
      if (!state.spokespersonName.trim()) {
        alert("Spoke Too Soon — add the spokesperson’s name before continuing.");
        return false;
      }
      if (!state.lessonId) {
        alert("Spoke Too Soon — pick a lesson.");
        return false;
      }
    }
    if (id === "content") {
      ["lessonTitle", "lessonSubtitle", "sampleBullets", "sampleMyth"].forEach((fieldId) => {
        const el = byId(fieldId);
        if (el) state[fieldId] = el.value;
      });
    }
    return true;
  }

  function applyLeadVars() {
    const cue = (state.meta.colorLeadPreview || {})[state.colorLead] || {};
    const root = document.documentElement;
    root.style.setProperty("--lead-heading", cue.heading || "var(--primary)");
    root.style.setProperty("--lead-button", cue.button || "var(--primary)");
    root.style.setProperty("--lead-from", cue.gradientFrom || "var(--primary)");
    root.style.setProperty("--lead-to", cue.gradientTo || "var(--dark)");
    const side = (state.meta.sidebarPreview || {})[state.sidebarColor] || "var(--dark)";
    root.style.setProperty("--sidebar-tone", side);
    const fonts = findMeta(state.meta.fontPairings, state.fontPairing);
    if (fonts) {
      root.style.setProperty("--model-heading", `"${fonts.heading}", Georgia, serif`);
      root.style.setProperty("--model-body", `"${fonts.body}", system-ui, sans-serif`);
    }
  }

  function lessonDisplayTitle() {
    if (state.lessonTitle.trim()) return state.lessonTitle.trim();
    const lesson = findMeta(state.meta.lessons, state.lessonId);
    return lesson ? lesson.title : "Lesson title";
  }

  function parseBullets(text) {
    return String(text || "")
      .split(/\n+/)
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  /** Lesson chrome shown on every view: chapter list, current chapter, slide counter. */
  const CHAPTERS = [
    ["W", "Warm-Up"],
    ["I", "Introduction"],
    ["P1", "Presentation 1"],
    ["P2", "Presentation 2"],
    ["P3", "Presentation 3"],
    ["E", "Evaluation"],
    ["A", "Application"]
  ];
  const VIEW_CHROME = {
    title: { chapter: "W", slide: 1 },
    divider: { chapter: "P1", slide: 9 },
    cards: { chapter: "P1", slide: 10 }
  };
  function renderModelSidebar(title) {
    const chrome = VIEW_CHROME[state.previewView] || VIEW_CHROME.title;
    const rows = CHAPTERS.map(
      ([key, name]) =>
        `<li${key === chrome.chapter ? ' class="is-current"' : ""}><span class="ms-letter">${key}</span><span class="ms-name">${name}</span></li>`
    ).join("");
    return `<div class="ms-title">${escapeHtml(title)}</div><ol class="ms-chapters">${rows}</ol><div class="ms-counter">Slide ${chrome.slide} of 30</div>`;
  }

  function lessonChipText() {
    const team = state.teamName.trim();
    return team || "Round 2 · SPOKES lesson";
  }

  const PREVIEW_CHAPTER = "3";
  const PREVIEW_CHAPTER_NUM = "P1";

  function themeOption(family, slug) {
    const sections = state.themeOptions?.sections || [];
    for (const section of sections) {
      if ((section.family || section.id) !== family) continue;
      const hit = (section.options || []).find((o) => o.slug === slug);
      if (hit) return hit;
    }
    return null;
  }

  function scopeCss(css, scopePrefix) {
    return String(css || "")
      .replace(/\bSCOPE\b/g, scopePrefix)
      .replace(/\bDIVIDER_SCOPE\b/g, scopePrefix);
  }

  function prefixSelectors(css, prefix) {
    const trimmed = String(css || "").trim();
    if (!trimmed) return "";
    return trimmed.replace(/(^|})\s*([^@}/][^{]*)\{/g, (match, brace, selectors) => {
      const scoped = selectors
        .split(",")
        .map((sel) => {
          const s = sel.trim();
          if (!s) return s;
          if (s.startsWith(prefix.trim())) return s;
          return `${prefix}${s}`;
        })
        .join(", ");
      return `${brace}\n${scoped} {`;
    });
  }

  function ensureInjectStyle() {
    let el = document.getElementById("bespoke-theme-inject");
    if (!el) {
      el = document.createElement("style");
      el.id = "bespoke-theme-inject";
      document.head.appendChild(el);
    }
    return el;
  }

  function buildInjectedThemeCss() {
    const main = ".spokes-model .model-main";
    const chapterScope = `${main} [data-chapter="${PREVIEW_CHAPTER}"]`;
    const dividerScope = `${main} .slide-section[data-chapter="${PREVIEW_CHAPTER}"]`;
    const chunks = [];

    const texture = themeOption("backgroundTextures", state.backgroundTexture);
    if (texture && texture.css) {
      chunks.push(String(texture.css).replace(/\.main\b/g, main));
    }

    const lead = themeOption("colorLeads", state.colorLead);
    if (lead && lead.css) {
      chunks.push(prefixSelectors(lead.css, main + " "));
    }

    const titleOpt = themeOption("titleSlides", state.titleSlide);
    if (titleOpt && titleOpt.css) {
      chunks.push(prefixSelectors(titleOpt.css, main + " "));
    }

    const divider = themeOption("dividers", state.dividerStyle);
    if (divider && divider.css) {
      chunks.push(scopeCss(divider.css, dividerScope));
    }

    const cardSlug = state.varyCardsByChapter
      ? state.chapterCards.P1 || state.cardStyle
      : state.cardStyle;
    const card = themeOption("cards", cardSlug);
    if (card && card.css) {
      chunks.push(scopeCss(card.css, chapterScope));
    }

    if (state.backgroundTexture === "dark-royal") {
      const darkSection = (state.themeOptions && state.themeOptions.sections || []).find((s) => s.id === "darkTheme");
      for (const opt of (darkSection && darkSection.options) || []) {
        if (!opt.css) continue;
        chunks.push(String(opt.css).replace(/\.theme-dark\b/g, main + ".theme-dark"));
      }
    }

    return chunks.filter(Boolean).join("\n\n");
  }

  function injectPreviewTheme() {
    ensureInjectStyle().textContent = buildInjectedThemeCss();
  }

  function updatePreview() {
    applyLeadVars();
    injectPreviewTheme();
    const main = byId("modelMain");
    const sidebar = byId("modelSidebar");
    const stage = byId("modelStage");

    main.className = "model-main";
    if (state.backgroundTexture === "dark-royal") {
      main.classList.add("is-dark");
      main.classList.add("theme-dark");
    }

    const title = lessonDisplayTitle();
    const subtitle = state.lessonSubtitle.trim() || "Skills for Life — sample preview";
    const bullets = parseBullets(state.sampleBullets);
    const mythLines = String(state.sampleMyth || "")
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    sidebar.innerHTML = renderModelSidebar(title);

    if (state.previewView === "title") {
      stage.innerHTML = renderTitleSlide(title, subtitle);
    } else if (state.previewView === "divider") {
      stage.innerHTML = renderDividerSlide(title);
    } else {
      stage.innerHTML = renderContentSlide(bullets, mythLines, subtitle);
    }

    document.querySelectorAll('#previewTabs [role="tab"]').forEach((tab) => {
      const selected = tab.dataset.view === state.previewView;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    });

    announcePreview(title);
  }

  /** Pin a view chosen by an option/tab click until the next step change. */
  function showView(view) {
    state.previewView = view;
    ui.previewPinned = true;
  }

  /** Caption under the frame + live region text; gold ring pulse on option changes. */
  function announcePreview(title) {
    const caption = byId("stageCaption");
    const live = byId("liveRegion");
    const viewName = VIEW_NAMES[state.previewView] || "Preview";
    const change = ui.lastChange;
    ui.lastChange = null;
    if (change) {
      const text = change.plain
        ? `${change.dimension} · ${change.label}`
        : `Updated · ${change.dimension} → ${change.label}`;
      caption.innerHTML = change.plain
        ? `<strong>${escapeHtml(change.dimension)}</strong> · ${escapeHtml(change.label)}`
        : `Updated · ${escapeHtml(change.dimension)} → <strong>${escapeHtml(change.label)}</strong>`;
      live.textContent = `${text}. Spokes Model showing ${viewName.toLowerCase()} for ${title}.`;
      pulseFrame();
    } else {
      caption.innerHTML = `<strong>${escapeHtml(viewName)}</strong> · ${escapeHtml(title)}`;
      live.textContent = `Spokes Model showing ${viewName.toLowerCase()} for ${title}`;
    }
  }

  function pulseFrame() {
    if (prefersReduced) return;
    const frame = byId("spokesModel");
    frame.classList.remove("is-updated");
    void frame.offsetWidth;
    frame.classList.add("is-updated");
    clearTimeout(ui.pulseTimer);
    ui.pulseTimer = setTimeout(() => frame.classList.remove("is-updated"), 260);
  }

  function renderTitleSlide(title, subtitle) {
    const chip = `<span class="slide-chip">${escapeHtml(lessonChipText())}</span>`;
    return `
      <div class="slide-title" data-preview="title">
        ${chip}
        <h1>${escapeHtml(title)}</h1>
        <div class="divider" aria-hidden="true"></div>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        <span class="copyright" aria-hidden="true">SPOKES · Skills for Life</span>
      </div>`;
  }

  function renderDividerSlide(title) {
    return `
      <div class="slide-section" data-chapter="${PREVIEW_CHAPTER}" data-chapter-num="${PREVIEW_CHAPTER_NUM}">
        <span class="section-circle" aria-hidden="true"></span>
        <span class="chapter-label">Presentation 1</span>
        <h2>${escapeHtml(title)}</h2>
        <div class="divider" aria-hidden="true"></div>
      </div>`;
  }

  function renderContentSlide(bullets, mythLines, subtitle) {
    const previewCard = state.varyCardsByChapter ? state.chapterCards.P1 || state.cardStyle : state.cardStyle;
    const cards = (bullets.length ? bullets : ["Sample point one", "Sample point two", "Sample point three"])
      .slice(0, 3)
      .map((b, i) => {
        const myth = mythLines[i] || "";
        return `<div class="card"><h4>${escapeHtml(b)}</h4><p>${escapeHtml(myth || "Sample card from your content.")}</p></div>`;
      })
      .join("");
    const chip = state.varyCardsByChapter
      ? `<span class="slide-chip">Chapter P1 · ${escapeHtml(findOption("cards", previewCard)?.label || previewCard)}</span>`
      : "";
    const reality = mythLines.find((l) => /^reality/i.test(l)) || subtitle;
    return `
      <div class="model-content" data-chapter="${PREVIEW_CHAPTER}">
        <div class="slide-head"><h3>Key points</h3>${chip}</div>
        <div class="cards-grid">${cards}</div>
        <p class="takeaway"><strong>Takeaway:</strong> ${escapeHtml(String(reality).replace(/^reality:\s*/i, ""))}</p>
      </div>`;
  }

  function buildSelectionPayload() {
    const lesson = findMeta(state.meta.lessons, state.lessonId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      schema: "bespoke-selection/v1",
      submittedAt: new Date().toISOString(),
      date: today,
      libraryCatalogVersion: state.library?.version || null,
      lesson: {
        id: state.lessonId,
        title: lesson ? lesson.title : state.lessonId,
        displayTitle: lessonDisplayTitle(),
        subtitle: state.lessonSubtitle.trim()
      },
      team: {
        name: state.teamName.trim(),
        spokesperson: {
          name: state.spokespersonName.trim(),
          email: state.spokespersonEmail.trim()
        }
      },
      presetId: state.presetId,
      theme: {
        // Slugs only — matches theme-registry.json field values
        colorLead: state.colorLead,
        sidebarColor: state.sidebarColor,
        backgroundTexture: state.backgroundTexture,
        titleSlide: state.titleSlide,
        dividerStyle: state.dividerStyle,
        fontPairing: state.fontPairing,
        cards: {
          lessonWide: state.cardStyle,
          varyByChapter: state.varyCardsByChapter,
          chapterStyles: state.varyCardsByChapter ? { ...state.chapterCards } : null
        },
        catalogIds: {
          colorLead: uiKey("colorLeads", state.colorLead),
          sidebarColor: uiKey("sidebarColors", state.sidebarColor),
          backgroundTexture: uiKey("backgroundTextures", state.backgroundTexture),
          titleSlide: uiKey("titleSlides", state.titleSlide),
          dividerStyle: uiKey("dividers", state.dividerStyle),
          cards: state.varyCardsByChapter
            ? Object.fromEntries(
                Object.entries(state.chapterCards).map(([k, slug]) => [k, uiKey("cards", slug)])
              )
            : uiKey("cards", state.cardStyle)
        }
      },
      sampleContent: {
        bullets: state.sampleBullets,
        mythReality: state.sampleMyth
      },
      unspoken: state.unspoken.trim()
    };
  }

  function buildIntakeMarkdown(payload) {
    const d = payload.date;
    const title = payload.lesson.displayTitle || payload.lesson.title;
    const bullets = parseBullets(payload.sampleContent.bullets)
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n");
    const myth = payload.sampleContent.mythReality || "";
    const theme = payload.theme;
    return `# SPOKES Lesson Content Intake Template

**Filled by Bespoke** (prototype). Template remains canonical (D11).
Library catalog: \`SPOKES Builder/bespoke-library-catalog.json\` — UI keys \`{family}.{slug}\`; fields below store **slugs only**.

---

## Section 1: Lesson Overview

| Field | Your Entry |
|-------|------------|
| **Lesson Title** | ${title} |
| **Lesson Subtitle** | ${payload.lesson.subtitle || "_TBD_"} |
| **Module Number** | _TBD_ |
| **Content Team / Author** | ${payload.team.name || payload.team.spokesperson.name} |
| **Spokesperson** | ${payload.team.spokesperson.name} &lt;${payload.team.spokesperson.email || "n/a"}&gt; |
| **Date Submitted** | ${d} |
| **Lesson Description** | Prototype submission via Bespoke Spoke Signals. Full WIPPEA content follows in OneDrive; this file captures look choices and sample content. |

### Design choices (from Bespoke)

| Dimension | Slug (registry) | Catalog id |
|-----------|-----------------|------------|
| Preset | ${payload.presetId} | — |
| Color lead | ${theme.colorLead} | ${theme.catalogIds.colorLead} |
| Sidebar | ${theme.sidebarColor} | ${theme.catalogIds.sidebarColor} |
| Texture | ${theme.backgroundTexture} | ${theme.catalogIds.backgroundTexture} |
| Title slide | ${theme.titleSlide} | ${theme.catalogIds.titleSlide} |
| Divider | ${theme.dividerStyle} | ${theme.catalogIds.dividerStyle} |
| Font pairing | ${theme.fontPairing} | — |
| Cards | ${
      theme.cards.varyByChapter
        ? `vary by chapter: ${JSON.stringify(theme.cards.chapterStyles)}`
        : theme.cards.lessonWide
    } | ${
      typeof theme.catalogIds.cards === "string"
        ? theme.catalogIds.cards
        : JSON.stringify(theme.catalogIds.cards)
    } |
| Unspoken | ${payload.unspoken || "_none_"} | — |

---

## Section 2: Content by WIPPEA Stage

### Stage W -- Warm-Up (Chapter 1)

**Opening Activity or Reflection Prompt:**

\`\`\`
${bullets || "[Write here]"}
\`\`\`

**Key Question(s) to Pose:**

\`\`\`
What is one goal this lesson should help learners reach?
\`\`\`

---

### Stage I -- Introduction (Chapter 2)

**Module Objective / Learning Goal:**

\`\`\`
Learners will apply the skills in this lesson to a workplace or daily-life scenario.
\`\`\`

**Framing Statement:**

\`\`\`
${myth || "[Write here]"}
\`\`\`

---

### Stage P1 -- Presentation 1 (Chapter 3)

**Topic / Section Title:**
\`\`\`
${title} — Core ideas
\`\`\`

**Main Content Points:**

\`\`\`
${bullets || "1.\\n2.\\n3."}
\`\`\`

---

### Remaining stages

_Full P2–A content delivered via the team OneDrive folder. This prototype intake seeds look + sample content only._

---

## Section 3: Media &amp; Resources

| Item | Notes |
|------|-------|
| OneDrive folder | Linked from Bespoke confirmation (per-lesson) |
| PowerPoint / PDFs | Delivered outside the wizard (D1) |

---

## Section 4: Submission metadata

- Pipeline: Spoke Signals
- Schema: bespoke-selection/v1
- Gate: Britt reviews PR; merge = greenlight to build (D10)
`;
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function buildIssueBody(payload, intakeMd) {
    const json = JSON.stringify(payload, null, 2);
    return [
      `## Spoke Signal — ${payload.lesson.title}`,
      "",
      `| Field | Value |`,
      `| --- | --- |`,
      `| Lesson | \`${payload.lesson.id}\` |`,
      `| Team | ${payload.team.name || "—"} |`,
      `| Spokesperson | ${payload.team.spokesperson.name} |`,
      `| Preset | ${payload.presetId} |`,
      `| Date | ${payload.date} |`,
      "",
      "An Action will open a lesson-tagged PR with `selection.json` and a filled content-intake markdown.",
      "",
      "<!-- bespoke-payload:begin -->",
      "```json",
      json,
      "```",
      "<!-- bespoke-payload:end -->",
      "",
      "<details><summary>Preview of content-intake.md</summary>",
      "",
      "```markdown",
      intakeMd.slice(0, 3500),
      intakeMd.length > 3500 ? "\n…(truncated in issue body; full file in PR)" : "",
      "```",
      "",
      "</details>"
    ].join("\n");
  }

  function onSubmit() {
    syncTeamFieldsFromDom();
    ["lessonTitle", "lessonSubtitle", "sampleBullets", "sampleMyth", "unspoken"].forEach((fieldId) => {
      const el = byId(fieldId);
      if (el) state[fieldId] = el.value;
    });
    if (!state.spokespersonName.trim() || !state.lessonId) {
      const box = byId("submitStatus");
      box.className = "status-box error";
      box.innerHTML = `<h3>Spoke Too Soon</h3><p>Pick a lesson and name a spokesperson before submitting.</p>`;
      return;
    }

    const payload = buildSelectionPayload();
    const intakeMd = buildIntakeMarkdown(payload);
    const stamp = payload.date;
    const base = `${payload.lesson.id}-${stamp}`;

    downloadText(`${base}-selection.json`, JSON.stringify(payload, null, 2), "application/json");
    downloadText(`${base}-content-intake.md`, intakeMd, "text/markdown");

    const issueBody = buildIssueBody(payload, intakeMd);
    const title = `[Spoke Signal] ${payload.lesson.id} — ${stamp}`;
    const issueUrl =
      `https://github.com/${REPO}/issues/new` +
      `?title=${encodeURIComponent(title)}` +
      `&labels=${encodeURIComponent("spoke-signal,bespoke")}` +
      `&body=${encodeURIComponent(issueBody)}`;

    const box = byId("submitStatus");
    box.className = "status-box success";
    const urlTooLong = issueUrl.length > 7000;
    box.innerHTML = `
      <h3>Spoke Signal ready</h3>
      <p>Downloads started for <code>selection.json</code> and the filled <code>content-intake</code> markdown.
      ${
        urlTooLong
          ? "The payload is large — open a blank Spoke Signal issue and paste the JSON from your download between the payload markers (or ask Britt to run the workflow_dispatch Action)."
          : "Open the pre-filled GitHub issue. When it is created, the Spoke Signals Action opens a lesson-tagged PR. No token stays in this browser."
      }</p>
      <div class="status-actions">
        <a class="btn btn-primary" id="openIssue" href="${urlTooLong ? `https://github.com/${REPO}/issues/new?labels=spoke-signal,bespoke&title=${encodeURIComponent(title)}` : issueUrl}" target="_blank" rel="noopener">Open Spoke Signal issue</a>
        <button type="button" class="btn btn-secondary" id="copyPayload">Copy JSON payload</button>
      </div>
    `;
    byId("copyPayload").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        byId("copyPayload").textContent = "Copied";
      } catch {
        byId("copyPayload").textContent = "Copy failed — use the download";
      }
    });

    saveDraft();
  }

  function render() {
    const active = document.activeElement;
    const keepFocusId =
      active && active.id && byId("stepPanel")?.contains(active) ? active.id : null;
    const keepSelection =
      keepFocusId && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
        ? { start: active.selectionStart, end: active.selectionEnd }
        : null;

    if (ui.renderedStep !== state.step) {
      ui.renderedStep = state.step;
      state.previewView = STEPS[state.step].view;
      ui.previewPinned = false;
    }

    buildStepper();
    renderPanel();
    updatePreview();
    saveDraft();

    if (keepFocusId) {
      const el = byId(keepFocusId);
      if (el) {
        el.focus({ preventScroll: true });
        if (keepSelection && typeof el.setSelectionRange === "function") {
          try {
            el.setSelectionRange(keepSelection.start, keepSelection.end);
          } catch {
            /* ignore non-text inputs */
          }
        }
        return;
      }
    }
    byId("stepPanel").focus({ preventScroll: true });
  }

  async function init() {
    const [metaRes, libRes, themeRes] = await Promise.all([
      fetch(META_URL),
      fetch(LIBRARY_URL),
      fetch(THEME_OPTIONS_URL)
    ]);
    if (!metaRes.ok) throw new Error(`Failed to load ${META_URL}`);
    if (!libRes.ok) throw new Error(`Failed to load library catalog (${libRes.status}). Is SPOKES Builder/bespoke-library-catalog.json present?`);
    if (!themeRes.ok) throw new Error(`Failed to load theme-options.json (${themeRes.status}).`);
    state.meta = await metaRes.json();
    state.library = await libRes.json();
    state.themeOptions = await themeRes.json();
    loadDraft();
    if (!state.chapterCards || typeof state.chapterCards !== "object") state.chapterCards = {};

    byId("btnClear").addEventListener("click", () => {
      if (confirm("Clear the saved Bespoke draft in this browser?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });

    document.querySelectorAll('#previewTabs [role="tab"]').forEach((tab) => {
      tab.addEventListener("click", () => {
        showView(tab.dataset.view);
        updatePreview();
      });
    });
    bindTablistKeys(byId("previewTabs"));

    const workspace = byId("workspace");
    document.querySelectorAll('#surfaceSwitcher [role="tab"]').forEach((tab) => {
      tab.addEventListener("click", () => {
        const surface = tab.dataset.surface;
        workspace.dataset.activeSurface = surface;
        document.querySelectorAll('#surfaceSwitcher [role="tab"]').forEach((t) => {
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        const live = byId("liveRegion");
        if (live) live.textContent = surface === "preview" ? "Showing Spokes Model preview" : "Showing design options";
      });
    });
    bindTablistKeys(byId("surfaceSwitcher"));

    render();
  }

  /** A11Y-01 keyboard support: Enter/Space activate, Left/Right/Home/End move between tabs. */
  function bindTablistKeys(tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab, i) => {
      tab.addEventListener("keydown", (e) => {
        let target = null;
        if (e.key === "Enter" || e.key === " ") target = tab;
        else if (e.key === "ArrowRight") target = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") target = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") target = tabs[0];
        else if (e.key === "End") target = tabs[tabs.length - 1];
        if (!target) return;
        e.preventDefault();
        target.focus();
        target.click();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      const panel = byId("stepPanel");
      panel.innerHTML = `<h1>Catalog load failed</h1><p class="panel-lead">${escapeHtml(err.message)}</p>`;
      console.error(err);
    });
  });
})();
