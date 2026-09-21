(() => {
  "use strict";

  const STORAGE_KEY = "bespoke-draft-v1";
  /**
   * Max length of a team view URL (origin + path + hash).
   * View link: `#v=` + base64url(deflate-raw(selection plus editCodeHash)).
   * editCodeHash is SHA-256 of the lead's edit code. The raw code is never in the link.
   * Anyone with the code can unlock editing on any computer. No accounts.
   * Legacy `#s=` / `#c=` open read-only. Old `#e=` links do not grant edit.
   * 8000 stays inside common email, Teams, and Slack paste limits.
   * A normal design view link is about 1,000 characters.
   */
  const SHARE_URL_MAX = 8000;
  const EDIT_CODE_MIN = 4;
  const EDIT_CODE_MAX = 40;
  const UNLOCK_HASH_KEY = "bespoke-lead-ok";
  const UNLOCK_CODE_KEY = "bespoke-lead-code";
  const REPO = "doclegg05/Curriculum-Employability-Skills";
  const LIBRARY_URL = "../SPOKES%20Builder/bespoke-library-catalog.json";
  const THEME_OPTIONS_URL = "../SPOKES%20Builder/theme-options.json";
  const META_URL = "./catalog.json";

  /** `view` = the preview the step lands on; a manual tab pick sticks until the step changes. */
  const STEPS = [
    { id: "welcome", label: "How to use Bespoke", view: "title" },
    { id: "team", label: "Lesson & team", view: "title" },
    { id: "preset", label: "Theme preset", view: "title" },
    { id: "color", label: "Color lead", view: "title" },
    { id: "surface", label: "Sidebar & background", view: "title" },
    { id: "layouts", label: "Title & dividers", view: "title" },
    { id: "cards", label: "Cards", view: "cards" },
    { id: "fonts", label: "Fonts", view: "cards" },
    { id: "content", label: "Your content", view: "cards" },
    { id: "review", label: "Review & submit", view: "title" },
    { id: "return", label: "Save and come back", view: "title" }
  ];
  /** Step ids from before the instruction steps, so an older saved draft still opens the right screen. */
  const LEGACY_STEP_IDS = ["team", "preset", "color", "surface", "layouts", "cards", "fonts", "content", "review"];

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
    /** Raw edit code. Saved on this computer only. Never copied into the view link. */
    editCode: "",
    previewView: "title"
  };

  /** Transient UI state — never saved to the draft. */
  const ui = {
    renderedStep: null,
    previewPinned: false,
    lastChange: null,
    pulseTimer: null,
    restoredFromLink: false,
    restoreNote: "",
    builderNote: "",
    /** SHA-256 of the edit code, from a view link. Not the raw code. */
    editCodeHash: "",
    /** "view" until init grants a lead session, or the lead unlocks a view link. */
    mode: "view"
  };

  let saveAnnounceTimer = null;
  let saveAnnounceReady = false;

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

  function stepIndex(id) {
    const index = STEPS.findIndex((step) => step.id === id);
    return index < 0 ? 0 : index;
  }

  function restoreStep(saved) {
    if (saved.stepId && STEPS.some((step) => step.id === saved.stepId)) {
      state.step = stepIndex(saved.stepId);
      return;
    }
    if (Number.isInteger(saved.step) && LEGACY_STEP_IDS[saved.step]) {
      state.step = stepIndex(LEGACY_STEP_IDS[saved.step]);
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      Object.assign(state, saved, { meta: state.meta, library: state.library, themeOptions: state.themeOptions });
      restoreStep(saved);
    } catch {
      /* ignore */
    }
  }

  function setSaveStatus(text) {
    const el = byId("saveStatus");
    if (el) el.textContent = text;
  }

  function queueSaveAnnouncement() {
    if (!saveAnnounceReady) return;
    clearTimeout(saveAnnounceTimer);
    saveAnnounceTimer = setTimeout(() => {
      const live = byId("saveLive");
      if (!live) return;
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = "Saved";
      }, 30);
    }, 600);
  }

  function isLeadSession() {
    return ui.mode === "edit";
  }

  function peekDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return saved && typeof saved === "object" ? saved : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    if (!isLeadSession()) return false;
    state.stepId = STEPS[state.step] ? STEPS[state.step].id : "welcome";
    const { meta, library, themeOptions, ...rest } = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      setSaveStatus("Saved on this computer");
      queueSaveAnnouncement();
      return true;
    } catch {
      setSaveStatus("Could not save on this computer");
      return false;
    }
  }

  function syncAccessChrome() {
    const locked = !isLeadSession();
    document.body.classList.toggle("is-view-only", locked);
    document.body.dataset.access = locked ? "view" : "edit";
    const banner = byId("accessBanner");
    if (banner) {
      if (locked && banner.hidden) {
        banner.textContent = "Only the team lead can change this.";
        banner.hidden = false;
      } else if (!locked) {
        banner.hidden = true;
      }
    }
    const notice = byId("restoreNotice");
    if (notice) {
      notice.hidden = !ui.restoreNote;
      notice.textContent = ui.restoreNote || "";
    }
    const unlock = byId("leadUnlock");
    if (unlock) unlock.hidden = !locked;
    if (!locked) {
      const form = byId("leadCodeForm");
      const leadBtn = byId("btnLeadUnlock");
      if (form) form.hidden = true;
      if (leadBtn) leadBtn.setAttribute("aria-expanded", "false");
      const leadErr = byId("leadCodeError");
      if (leadErr) leadErr.textContent = "";
    }
    const clearBtn = byId("btnClear");
    if (clearBtn) {
      clearBtn.disabled = locked;
      if (locked) clearBtn.setAttribute("aria-describedby", "accessBanner");
      else clearBtn.removeAttribute("aria-describedby");
    }
    if (locked) setSaveStatus("");
  }

  function lockViewControls() {
    if (isLeadSession()) return;
    const panel = byId("stepPanel");
    if (!panel) return;
    panel.querySelectorAll("input, select, textarea, button").forEach((el) => {
      if (el.id === "btnBack" || el.id === "btnNext" || el.id === "btnDownloadDesign" || el.id === "btnCopySelection") return;
      el.disabled = true;
      el.setAttribute("aria-disabled", "true");
    });
  }

  function applyPreset(presetId) {
    if (!isLeadSession()) return;
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
      const label = step.id === "review" && !isLeadSession() ? "Review" : step.label;
      btn.innerHTML = `<span class="step-num" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></span><span>${label}</span>`;
      btn.setAttribute("aria-label", `Step ${index + 1} of ${STEPS.length}: ${label}`);
      if (index === state.step) btn.setAttribute("aria-current", "step");
      if (index < state.step) btn.classList.add("is-done");
      btn.addEventListener("click", () => {
        if (isLeadSession() && index > state.step && STEPS[state.step].id === "welcome") {
          const input = byId("editCode");
          if (input) state.editCode = input.value.trim();
          if ((state.editCode || "").length < EDIT_CODE_MIN) {
            const err = byId("editCodeError");
            if (err) err.textContent = `Enter an edit code of at least ${EDIT_CODE_MIN} characters.`;
            input?.focus();
            return;
          }
        }
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
      <p class="panel-lead">${isLeadSession()
        ? "Pick the closest starting point. Every choice stays editable on the next steps — most teams stop here."
        : "This is the starting point in the shared design."}</p>
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
    const lead = isLeadSession();
    panel.innerHTML = `
      <h1>${lead ? "Review &amp; submit" : "Review"}</h1>
      <p class="panel-lead">${lead
        ? "Check your choices, then send the Spoke Signal. Britt reviews the request; approval is the go-ahead to build."
        : "This is the shared design. You can look through every step. Only the team lead can change it."}</p>
      ${lead ? `
      <section class="share-card" aria-labelledby="shareTitle">
        <h2 id="shareTitle">Share this design</h2>
        <p id="shareHelp">Send the view link to your team. They can look, but not change anything. To edit later, open that same link and enter your edit code.</p>
        <div class="share-actions">
          <button type="button" class="btn btn-primary btn-lg" id="btnCopyView" aria-describedby="shareHelp">Copy view link for your team</button>
        </div>
        <p id="shareStatus" class="share-status" role="status" aria-live="polite"></p>
        <label class="field share-link-fallback" id="shareLinkFallback" hidden>
          Link
          <input id="shareLinkField" type="text" readonly>
        </label>
      </section>` : ""}
      <ul class="summary-list" id="summaryList"></ul>
      ${lead ? `
      <section class="next-hops" aria-labelledby="nextHopsTitle">
        <h2 id="nextHopsTitle">What happens next</h2>
        <ol>
          <li>You send a <strong>Spoke Signal</strong> with this design.</li>
          <li>An Action opens a <strong>draft</strong> for Britt to review.</li>
          <li><strong>Britt merges</strong> — that merge is the go-ahead to build.</li>
          <li>A builder makes the lesson from the approved design.</li>
        </ol>
        <p class="next-hops-note">The builder chooses slide pieces for the content. Your card style applies wherever cards appear.</p>
      </section>` : ""}
      <label class="field unspoken-field">Unspoken — something we wish existed in the library
        <textarea id="unspoken" placeholder="Optional wish-list for future library pieces"></textarea>
      </label>
      <div id="submitStatus" role="status" aria-live="polite"></div>
      <details class="builder-note"${ui.builderNote ? " open" : ""}>
        <summary>For builders</summary>
        <p class="builder-instructor-note">Instructors don't need this.</p>
        <div class="builder-files">
          <button type="button" class="btn btn-secondary" id="btnDownloadDesign">Download design file</button>
          <button type="button" class="btn btn-secondary" id="btnOpenDesign">Open a design file</button>
          <input id="importSelection" class="builder-file-input" type="file" accept="application/json,.json" tabindex="-1" aria-hidden="true">
          <button type="button" class="btn btn-secondary" id="btnCopySelection">Copy selection.json</button>
        </div>
        <p id="builderFileStatus" class="share-status" role="status" aria-live="polite">${escapeHtml(ui.builderNote || "")}</p>
        <dl id="builderDetails"></dl>
        <p>Options load from <code>SPOKES Builder/bespoke-library-catalog.json</code> (UI key <code>{family}.{slug}</code>); the selection payload stores <strong>slugs only</strong>. <code>bespoke-apply-selection.py</code> (not yet wired to the Action) upserts <code>theme-registry.json</code> with derived Layer 2 fields below. Card styles may vary by WIPPEA chapter (D12); adjacent chapters never share a style (THM-04). Submit opens a labelled GitHub issue — no token in this browser — and the Spoke Signals Action opens the lesson-tagged PR; merge is the greenlight (D10). A view link (<code>#v=</code>) is compressed <code>selection.json</code> plus <code>editCodeHash</code> (SHA-256 of the edit code, never the raw code). It opens read-only until that code is entered. View URLs longer than ${SHARE_URL_MAX} characters are not copied. Visual reference: <a href="../SPOKES%20Builder/library-preview.html" target="_blank" rel="noopener">library preview</a>.</p>
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
    if (unspoken) {
      unspoken.value = state.unspoken || "";
      unspoken.addEventListener("input", () => {
        if (!isLeadSession()) return;
        state.unspoken = unspoken.value;
        saveDraft();
      });
    }
    byId("btnCopyView")?.addEventListener("click", () => copyLink());
    byId("btnDownloadDesign")?.addEventListener("click", () => {
      if (!isLeadSession()) return;
      const payload = buildSelectionPayload();
      const stamp = payload.date;
      downloadText(
        `${payload.lesson.id}-${stamp}-selection.json`,
        JSON.stringify(payload, null, 2),
        "application/json"
      );
      const status = byId("builderFileStatus");
      if (status) status.textContent = "Downloaded the design file (selection.json).";
    });
    byId("btnOpenDesign")?.addEventListener("click", () => {
      if (!isLeadSession()) return;
      byId("importSelection")?.click();
    });
    byId("importSelection")?.addEventListener("change", async (e) => {
      if (!isLeadSession()) return;
      const file = e.target.files && e.target.files[0];
      const status = byId("builderFileStatus");
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        applySelectionPayload(payload);
        ui.builderNote = "Opened the design file.";
        saveDraft();
        render();
      } catch (err) {
        if (status) status.textContent = `Could not open that design file. ${err.message || err}`;
      }
    });
    byId("btnCopySelection")?.addEventListener("click", async () => {
      if (!isLeadSession()) return;
      const status = byId("builderFileStatus");
      try {
        await navigator.clipboard.writeText(JSON.stringify(buildSelectionPayload(), null, 2));
        if (status) status.textContent = "Copied selection.json.";
      } catch {
        if (status) status.textContent = "Could not copy. Download the design file instead.";
      }
    });
  }

  async function copyLink() {
    if (!isLeadSession()) return;
    const status = byId("shareStatus");
    const button = byId("btnCopyView");
    if (button) button.disabled = true;
    try {
      const result = await buildViewUrl();
      if (!result.url) {
        if (status) status.textContent = result.message;
        return;
      }
      try {
        await navigator.clipboard.writeText(result.url);
        if (status) status.textContent = result.message;
      } catch {
        const fallback = byId("shareLinkFallback");
        const field = byId("shareLinkField");
        if (fallback && field) {
          fallback.hidden = false;
          field.value = result.url;
          field.focus();
          field.select();
        }
        if (status) status.textContent = "Could not copy automatically. Select the link below.";
      }
    } finally {
      if (button) button.disabled = false;
    }
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
  const DERIVED_LAYER2 = {
    W: { leadComponent: "takeaways", secondaryAccent: "gold" },
    I: { leadComponent: "cards-grid", secondaryAccent: "primary" },
    P1: { leadComponent: "smart-stack", secondaryAccent: "gold" },
    P2: { leadComponent: "areas-grid", secondaryAccent: "primary" },
    P3: { leadComponent: "dangers-grid", secondaryAccent: "gold" },
    E: { leadComponent: "takeaways", secondaryAccent: "primary" },
    A: { leadComponent: "content-list", secondaryAccent: "gold" }
  };

  function builderIds() {
    const derived = (state.meta.chapterKeys || Object.keys(DERIVED_LAYER2))
      .map((k) => {
        const d = DERIVED_LAYER2[k] || {};
        return `${k}: ${d.leadComponent}/${d.secondaryAccent}`;
      })
      .join("; ");
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
      Fonts: state.fontPairing,
      "Derived Layer 2 (FID-5)": derived,
      "Registry key": state.lessonId ? `lesson-${state.lessonId}` : "—"
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderWelcome(panel) {
    panel.innerHTML = `
      <h1>How to use Bespoke</h1>
      <p class="panel-lead">For the team lead. Choose an edit code and write it down. The preview on the right is a sample of your lesson.</p>
      <label class="field" for="editCode">Your edit code
        <input id="editCode" type="text" autocomplete="off" minlength="${EDIT_CODE_MIN}" maxlength="${EDIT_CODE_MAX}" required>
      </label>
      <p id="editCodeHint" class="field-hint">At least ${EDIT_CODE_MIN} characters. Write it down. Capital letters matter. You will enter this code to edit again from the view link, on any computer.</p>
      <p id="editCodeError" class="share-status" role="status" aria-live="polite"></p>
      <ol class="guide-list">
        <li>You are the only person who can change this look and send it in.</li>
        <li>Write down your edit code. Open the view link later and enter the code to edit again.</li>
        <li>Pick a starter theme, then change any option. The starter does not lock anything.</li>
        <li>The preview on the right updates as you choose.</li>
        <li>Your choices also save on this computer, so you can come back here.</li>
        <li>Give teammates the <strong>view link</strong>. They can look, but they cannot change anything.</li>
        <li>When the team agrees, choose <strong>Submit</strong>. That sends the design for Britt to review (a pull request). It does not build the lesson by itself.</li>
      </ol>
    `;
    const input = byId("editCode");
    if (!input) return;
    input.value = state.editCode || "";
    const sync = () => {
      state.editCode = input.value.trim();
      const err = byId("editCodeError");
      if (err && state.editCode.length >= EDIT_CODE_MIN) err.textContent = "";
      saveDraft();
    };
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  }

  function renderReturn(panel) {
    const lead = isLeadSession();
    panel.innerHTML = `
      <h1>Save and come back</h1>
      <p class="panel-lead">You can leave and finish later. The preview still shows your lesson.</p>
      <ol class="guide-list">
        <li>Write down your edit code.</li>
        <li>Your choices are also saved on this computer. Open Bespoke here again and the draft comes back.</li>
        <li>To edit later from the link, open the view link and choose <strong>I am the team lead</strong>. Enter your edit code. This works on any computer.</li>
        <li>Teammates use the view link only. They do not need your code.</li>
        <li>Submit when the team is ready. You can submit again later if you revise.</li>
      </ol>
      ${lead ? `
      <div class="share-actions return-actions">
        <button type="button" class="btn btn-primary btn-lg" id="btnCopyView">Copy view link for your team</button>
      </div>
      <p id="shareStatus" class="share-status" role="status" aria-live="polite"></p>` : ""}
    `;
    byId("btnCopyView")?.addEventListener("click", () => copyLink());
  }

  function renderPanel() {
    const panel = byId("stepPanel");
    const id = STEPS[state.step].id;
    const renderers = {
      welcome: renderWelcome,
      team: renderTeam,
      preset: renderPreset,
      color: renderColor,
      surface: renderSurface,
      layouts: renderLayouts,
      cards: renderCards,
      fonts: renderFonts,
      content: renderContent,
      review: renderReview,
      return: renderReturn
    };
    renderers[id](panel);

    const nav = document.createElement("div");
    nav.className = "panel-nav";
    nav.innerHTML = `
      <button type="button" class="btn btn-secondary" id="btnBack"${state.step === 0 ? " disabled" : ""}>Back</button>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        ${id === "return" ? "" : `<button type="button" class="btn btn-primary" id="btnNext">Next</button>`}
        ${
          (id === "review" || id === "return") && isLeadSession()
            ? `<button type="button" class="btn btn-accent btn-lg" id="btnSubmit">Submit Spoke Signal</button>`
            : ""
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
    if (!isLeadSession()) return true;
    const id = STEPS[state.step].id;
    if (id === "welcome") {
      const input = byId("editCode");
      if (input) state.editCode = input.value.trim();
      const err = byId("editCodeError");
      if ((state.editCode || "").length < EDIT_CODE_MIN) {
        if (err) err.textContent = `Enter an edit code of at least ${EDIT_CODE_MIN} characters.`;
        input?.focus();
        return false;
      }
      if (err) err.textContent = "";
    }
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

  /** FID-10 — honesty line under the frame for each preview view. */
  const HONESTY = {
    title: { label: "Exact", detail: "Title slide layout matches the build." },
    divider: { label: "Exact — chapter image added at build", detail: "Divider layout matches; the chapter photo is added when the lesson is built." },
    cards: {
      label: "Representative",
      detail: "The builder picks the component per content type; this card style applies to all cards in this chapter."
    }
  };

  /** Caption under the frame + live region text; gold ring pulse on option changes. */
  function announcePreview(title) {
    const caption = byId("stageCaption");
    const live = byId("liveRegion");
    const viewName = VIEW_NAMES[state.previewView] || "Preview";
    const honesty = HONESTY[state.previewView] || HONESTY.title;
    const change = ui.lastChange;
    ui.lastChange = null;
    const honestyHtml = `<span class="honesty-caption"><strong>${escapeHtml(honesty.label)}</strong> — ${escapeHtml(honesty.detail)}</span>`;
    if (change) {
      const text = change.plain
        ? `${change.dimension} · ${change.label}`
        : `Updated · ${change.dimension} → ${change.label}`;
      const changeHtml = change.plain
        ? `<strong>${escapeHtml(change.dimension)}</strong> · ${escapeHtml(change.label)}`
        : `Updated · ${escapeHtml(change.dimension)} → <strong>${escapeHtml(change.label)}</strong>`;
      caption.innerHTML = `${changeHtml}<br>${honestyHtml}`;
      live.textContent = `${text}. ${honesty.label}. Spokes Model showing ${viewName.toLowerCase()} for ${title}.`;
      pulseFrame();
    } else {
      caption.innerHTML = `<strong>${escapeHtml(viewName)}</strong> · ${escapeHtml(title)}<br>${honestyHtml}`;
      live.textContent = `Spokes Model showing ${viewName.toLowerCase()} for ${title}. ${honesty.label}: ${honesty.detail}`;
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

  function draftFieldsFromSelection(payload) {
    const theme = payload.theme || {};
    const cards = theme.cards || {};
    const team = payload.team || {};
    const sp = team.spokesperson || {};
    const lesson = payload.lesson || {};
    return {
      lessonId: lesson.id || state.lessonId,
      lessonTitle: lesson.displayTitle || lesson.title || "",
      lessonSubtitle: lesson.subtitle || "",
      teamName: team.name || "",
      spokespersonName: sp.name || "",
      spokespersonEmail: sp.email || "",
      presetId: payload.presetId || state.presetId,
      colorLead: theme.colorLead || state.colorLead,
      sidebarColor: theme.sidebarColor || state.sidebarColor,
      backgroundTexture: theme.backgroundTexture || state.backgroundTexture,
      titleSlide: theme.titleSlide || state.titleSlide,
      dividerStyle: theme.dividerStyle || state.dividerStyle,
      fontPairing: theme.fontPairing || state.fontPairing,
      cardStyle: cards.lessonWide || state.cardStyle,
      varyCardsByChapter: Boolean(cards.varyByChapter),
      chapterCards: cards.varyByChapter && cards.chapterStyles ? { ...cards.chapterStyles } : {},
      sampleBullets: (payload.sampleContent && payload.sampleContent.bullets) || state.sampleBullets,
      sampleMyth: (payload.sampleContent && payload.sampleContent.mythReality) || state.sampleMyth,
      unspoken: payload.unspoken || ""
    };
  }

  function applySelectionPayload(payload) {
    if (payload.schema && payload.schema !== "bespoke-selection/v1") {
      throw new Error(`Unexpected schema ${payload.schema}`);
    }
    Object.assign(state, draftFieldsFromSelection(payload));
  }

  function bytesToBase64Url(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(str) {
    const pad = "=".repeat((4 - (str.length % 4)) % 4);
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function encodeCompressedHash(json) {
    if (typeof CompressionStream === "undefined") return null;
    const bytes = new TextEncoder().encode(json);
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return bytesToBase64Url(buf);
  }

  async function decodeCompressedHash(b64url) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser cannot open a compressed link");
    }
    const bytes = base64UrlToBytes(b64url);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }

  function decodeLegacyBase64(b64) {
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  }

  function hashBody() {
    const raw = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  async function decodeViewPayload(value) {
    try {
      return await decodeCompressedHash(value);
    } catch {
      return decodeLegacyBase64(value);
    }
  }

  async function hashEditCode(code) {
    const bytes = new TextEncoder().encode(String(code).trim());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return bytesToBase64Url(new Uint8Array(digest));
  }

  function hashesMatch(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /**
   * View hashes carry the design plus editCodeHash. They open read-only
   * until someone enters the matching edit code. Old `#e=` links do not grant edit.
   */
  async function readShareLink() {
    const body = hashBody();
    if (!body) return { kind: "none" };
    const eq = body.indexOf("=");
    if (eq < 1) return { kind: "none" };
    const kind = body.slice(0, eq);
    const value = body.slice(eq + 1);
    if (!value) return { kind: "none" };
    if (kind === "v" || kind === "s" || kind === "c") {
      const payload = kind === "s" ? decodeLegacyBase64(value) : await decodeViewPayload(value);
      return { kind: "view", payload };
    }
    if (kind === "e") return { kind: "retired" };
    return { kind: "none" };
  }

  async function buildViewUrl() {
    const code = (state.editCode || "").trim();
    if (code.length < EDIT_CODE_MIN) {
      return {
        url: "",
        message: `Enter your edit code first. It is on How to use Bespoke. Use at least ${EDIT_CODE_MIN} characters.`
      };
    }
    const payload = buildSelectionPayload();
    payload.editCodeHash = await hashEditCode(code);
    const json = JSON.stringify(payload);
    const compressed = await encodeCompressedHash(json);
    if (!compressed) {
      return {
        url: "",
        message: "This browser cannot make a view link. Ask a builder for help."
      };
    }
    const url = new URL(location.href);
    url.hash = `v=${compressed}`;
    const href = url.toString();
    if (href.length > SHARE_URL_MAX) {
      return {
        url: "",
        message: "This design is too long to share. Shorten the lesson text, then copy the view link again."
      };
    }
    return { url: href, message: "Link copied" };
  }

  function rememberUnlock(code) {
    try {
      sessionStorage.setItem(UNLOCK_HASH_KEY, ui.editCodeHash);
      sessionStorage.setItem(UNLOCK_CODE_KEY, code);
    } catch {
      /* private mode */
    }
  }

  async function rememberedLeadCode() {
    try {
      const hash = sessionStorage.getItem(UNLOCK_HASH_KEY) || "";
      const code = sessionStorage.getItem(UNLOCK_CODE_KEY) || "";
      if (!hash || !code || !hashesMatch(hash, ui.editCodeHash)) return "";
      const check = await hashEditCode(code);
      return hashesMatch(check, ui.editCodeHash) ? code : "";
    } catch {
      return "";
    }
  }

  async function tryUnlockLead() {
    const input = byId("leadCodeInput");
    const err = byId("leadCodeError");
    const code = (input?.value || "").trim();
    if (code.length < EDIT_CODE_MIN) {
      if (err) err.textContent = `Enter your edit code. It needs at least ${EDIT_CODE_MIN} characters.`;
      input?.focus();
      return;
    }
    if (!ui.editCodeHash) {
      if (err) err.textContent = "This shared design has no edit code. Ask the team lead to copy a new view link.";
      return;
    }
    const hashed = await hashEditCode(code);
    if (!hashesMatch(hashed, ui.editCodeHash)) {
      if (err) err.textContent = "That code is not right. Try again.";
      input?.focus();
      return;
    }
    state.editCode = code;
    ui.mode = "edit";
    rememberUnlock(code);
    if (err) err.textContent = "";
    saveDraft();
    render();
    clearTimeout(saveAnnounceTimer);
    const live = byId("saveLive");
    if (live) live.textContent = "You can edit this design now.";
  }

  async function openShareLink() {
    let link;
    try {
      link = await readShareLink();
    } catch (err) {
      console.warn("Bespoke share link could not be opened", err);
      ui.mode = "view";
      ui.restoreNote = "This link could not be opened. The design saved on this computer was left as it was.";
      return;
    }
    if (link.kind === "view") {
      ui.mode = "view";
      ui.editCodeHash = typeof link.payload.editCodeHash === "string" ? link.payload.editCodeHash : "";
      try {
        applySelectionPayload(link.payload);
      } catch (err) {
        console.warn("Bespoke share link could not be opened", err);
        ui.restoreNote = "This link could not be opened. The design saved on this computer was left as it was.";
        return;
      }
      state.editCode = "";
      state.step = stepIndex("review");
      const remembered = await rememberedLeadCode();
      if (remembered) {
        state.editCode = remembered;
        ui.mode = "edit";
      }
      ui.restoredFromLink = true;
      return;
    }
    if (link.kind === "retired") {
      ui.mode = "view";
      ui.restoreNote = "This link is out of date. Ask the team lead for the view link.";
      return;
    }
    loadDraft();
    ui.mode = "edit";
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

  function buildIssueBody(payload) {
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
      "An Action will open a lesson-tagged PR with `selection.json`. The Action writer (`bespoke-write-submission.py`) is the single source of `content-intake.md`.",
      "",
      "<!-- bespoke-payload:begin -->",
      "```json",
      json,
      "```",
      "<!-- bespoke-payload:end -->"
    ].join("\n");
  }

  function onSubmit() {
    if (!isLeadSession()) return;
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
    const stamp = payload.date;

    const issueBody = buildIssueBody(payload);
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
      <p>${
        urlTooLong
          ? "This design is too big to attach by itself. Open For builders, download the design file, and ask a builder to add it to the Spoke Signal."
          : "Open the Spoke Signal so Britt can review this design. When the issue is created, an Action opens a lesson draft."
      }</p>
      <div class="status-actions">
        <a class="btn btn-primary btn-lg" id="openIssue" href="${urlTooLong ? `https://github.com/${REPO}/issues/new?labels=spoke-signal,bespoke&title=${encodeURIComponent(title)}` : issueUrl}" target="_blank" rel="noopener">Open Spoke Signal</a>
      </div>
    `;

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
    lockViewControls();
    syncAccessChrome();
    updatePreview();
    if (isLeadSession()) saveDraft();

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
    await openShareLink();
    if (!state.chapterCards || typeof state.chapterCards !== "object") state.chapterCards = {};

    byId("btnLeadUnlock")?.addEventListener("click", () => {
      const form = byId("leadCodeForm");
      const leadBtn = byId("btnLeadUnlock");
      if (form) form.hidden = false;
      if (leadBtn) leadBtn.setAttribute("aria-expanded", "true");
      const err = byId("leadCodeError");
      if (err) err.textContent = "";
      const input = byId("leadCodeInput");
      if (input) {
        input.value = "";
        input.focus();
      }
    });
    byId("leadCodeForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      tryUnlockLead();
    });

    byId("btnClear").addEventListener("click", () => {
      if (!isLeadSession()) return;
      if (confirm("Clear the design saved on this computer?")) {
        localStorage.removeItem(STORAGE_KEY);
        try {
          sessionStorage.removeItem(UNLOCK_HASH_KEY);
          sessionStorage.removeItem(UNLOCK_CODE_KEY);
        } catch {
          /* private mode */
        }
        location.hash = "";
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

    window.addEventListener("hashchange", () => {
      openShareLink()
        .then(() => {
          ui.renderedStep = null;
          render();
        })
        .catch((err) => console.error(err));
    });

    render();
    saveAnnounceReady = true;
    if (isLeadSession() && ui.restoredFromLink) {
      const live = byId("saveLive");
      if (live) live.textContent = "Saved";
    }
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
