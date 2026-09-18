(() => {
  "use strict";

  const STORAGE_KEY = "bespoke-draft-v1";
  const REPO = "doclegg05/Curriculum-Employability-Skills";
  const LIBRARY_URL = "../SPOKES%20Builder/bespoke-library-catalog.json";
  const META_URL = "./catalog.json";

  const STEPS = [
    { id: "team", label: "Lesson & team" },
    { id: "preset", label: "Personality" },
    { id: "color", label: "Color lead" },
    { id: "surface", label: "Sidebar & texture" },
    { id: "layouts", label: "Title & divider" },
    { id: "cards", label: "Card style" },
    { id: "fonts", label: "Font pairing" },
    { id: "content", label: "Sample content" },
    { id: "review", label: "Review & submit" }
  ];

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
    state.presetId = presetId;
    Object.assign(state, preset.defaults);
    if (!state.varyCardsByChapter) state.chapterCards = {};
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
      btn.innerHTML = `<span class="step-num">${String(index + 1).padStart(2, "0")}</span><span>${step.label}</span>`;
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

  function optionButton({ id, label, detail, usedBy, swatch, pressed, badge, onSelect }) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    btn.dataset.id = id;
    if (swatch) {
      const sw = document.createElement("div");
      sw.className = "swatch";
      sw.style.background = swatch;
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
      tag.className = "used-tag";
      tag.textContent = badge;
      btn.appendChild(tag);
    }
    if (usedBy && usedBy.length) {
      const tag = document.createElement("span");
      tag.className = "used-tag";
      tag.textContent = `Used by ${usedBy.join(", ")}`;
      btn.appendChild(tag);
    }
    btn.addEventListener("click", onSelect);
    return btn;
  }

  function renderLibraryOptions(grid, family, selectedSlug, onPick, { swatchFor, showNew } = {}) {
    familyOptions(family).forEach((opt) => {
      const preview = swatchFor ? swatchFor(opt) : null;
      grid.appendChild(
        optionButton({
          id: opt.id,
          label: opt.label,
          detail: opt.description || null,
          swatch: preview,
          pressed: selectedSlug === opt.slug,
          badge: showNew && opt.legacy === false ? "New" : null,
          onSelect: () => onPick(opt)
        })
      );
    });
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
      <h1>Personality preset</h1>
      <p class="panel-lead">Starters only — every choice stays editable on later steps. Most teams stop here.</p>
      <div class="preset-grid" id="presetGrid" role="group" aria-label="Personality presets"></div>
    `;
    const grid = byId("presetGrid");
    state.meta.presets.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset";
      btn.setAttribute("aria-pressed", preset.id === state.presetId ? "true" : "false");
      btn.innerHTML = `<strong>${preset.label}</strong><small>${preset.blurb}</small>`;
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
      <p class="panel-lead">Existing SPOKES color leads only (D6 — display &amp; choice, no model rewrite). Options already used by Phase 1 lessons are tagged. Catalog id <code>colorLeads.{slug}</code>; intake stores the slug.</p>
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
          onSelect: () => {
            state.colorLead = opt.slug;
            saveDraft();
            render();
          }
        })
      );
    });
  }

  function renderSurface(panel) {
    panel.innerHTML = `
      <h1>Sidebar &amp; texture</h1>
      <p class="panel-lead">From <code>bespoke-library-catalog.json</code>. UI keys <code>sidebarColors.*</code> / <code>backgroundTextures.*</code>; persist slugs.</p>
      <p><strong>Sidebar</strong></p>
      <div class="option-grid" id="sidebarGrid"></div>
      <p style="margin-top:1.25rem"><strong>Background texture</strong></p>
      <div class="option-grid" id="textureGrid"></div>
    `;
    const sidePreview = state.meta.sidebarPreview || {};
    renderLibraryOptions(byId("sidebarGrid"), "sidebarColors", state.sidebarColor, (opt) => {
      state.sidebarColor = opt.slug;
      saveDraft();
      render();
    }, { swatchFor: (opt) => sidePreview[opt.slug] || "var(--dark)" });
    renderLibraryOptions(byId("textureGrid"), "backgroundTextures", state.backgroundTexture, (opt) => {
      state.backgroundTexture = opt.slug;
      saveDraft();
      render();
    });
  }

  function renderLayouts(panel) {
    panel.innerHTML = `
      <h1>Title slide &amp; divider</h1>
      <p class="panel-lead">Library family options including new variants. Keys <code>titleSlides.*</code> / <code>dividers.*</code>; intake gets slugs only.</p>
      <p><strong>Title slide</strong> · <a href="../SPOKES%20Builder/library-preview.html" target="_blank" rel="noopener">Library preview</a></p>
      <div class="option-grid" id="titleGrid"></div>
      <p style="margin-top:1.25rem"><strong>Section divider</strong></p>
      <div class="option-grid" id="dividerGrid"></div>
    `;
    renderLibraryOptions(byId("titleGrid"), "titleSlides", state.titleSlide, (opt) => {
      state.titleSlide = opt.slug;
      state.previewView = "title";
      saveDraft();
      render();
    }, { showNew: true });
    renderLibraryOptions(byId("dividerGrid"), "dividers", state.dividerStyle, (opt) => {
      state.dividerStyle = opt.slug;
      state.previewView = "divider";
      saveDraft();
      render();
    }, { showNew: true });
  }

  function renderCards(panel) {
    panel.innerHTML = `
      <h1>Card style</h1>
      <p class="panel-lead">Catalog keys <code>cards.{slug}</code> (16 styles). Persist <strong>slug only</strong>. Opt in to vary by WIPPEA chapter (D12). Adjacent chapters cannot share a card style (THM-04).</p>
      <div class="option-grid" id="cardGrid"></div>
      <div class="toggle-row">
        <input type="checkbox" id="varyCards" ${state.varyCardsByChapter ? "checked" : ""}>
        <label for="varyCards">
          <strong>Vary card style by chapter / topic</strong><br>
          <span style="font-weight:400;color:var(--gray)">Different library pieces for different WIPPEA stages.</span>
        </label>
      </div>
      <p id="thmNote" class="panel-lead" style="margin-top:0"></p>
      <div class="chapter-vary ${state.varyCardsByChapter ? "is-open" : ""}" id="chapterVary"></div>
    `;
    renderLibraryOptions(byId("cardGrid"), "cards", state.cardStyle, (opt) => {
      state.cardStyle = opt.slug;
      state.previewView = "cards";
      saveDraft();
      render();
    }, { showNew: true });

    byId("varyCards").addEventListener("change", (e) => {
      state.varyCardsByChapter = e.target.checked;
      if (state.varyCardsByChapter) seedChapterCards();
      saveDraft();
      render();
    });

    const chapterVary = byId("chapterVary");
    const thmNote = byId("thmNote");
    if (state.varyCardsByChapter) {
      thmNote.textContent = "THM-04 enforced: changing a chapter to match a neighbor auto-picks another library card.";
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
            thmNote.textContent = `THM-04: ${key} adjusted to ${findOption("cards", adjusted)?.label || adjusted} so it differs from neighbors.`;
          }
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
      <h1>Font pairing</h1>
      <p class="panel-lead">Self-hosted pairings from the SPOKES font library (wizard meta; not part of the card/layout library catalog).</p>
      <div class="option-grid" id="fontGrid"></div>
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
      <h1>Try your content</h1>
      <p class="panel-lead">Paste a little sample text. The Spokes Model preview updates with demo slides — not a full lesson build.</p>
      <div class="field-grid">
        <label class="field">Lesson title
          <input id="lessonTitle" type="text" placeholder="${lesson ? lesson.title : "Lesson title"}">
        </label>
        <label class="field">Subtitle
          <input id="lessonSubtitle" type="text" placeholder="Short phrase under the title">
        </label>
        <label class="field">Sample bullets (become takeaways)
          <textarea id="sampleBullets"></textarea>
        </label>
        <label class="field">Myth / reality sample (becomes flip-style cards)
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
      <p class="panel-lead">Spoke Signals opens a lesson-tagged PR. Merge is Britt’s greenlight. No GitHub token in this browser. Theme fields store <strong>slugs</strong> (e.g. <code>top-accent</code>), not full UI ids.</p>
      <ul class="summary-list" id="summaryList"></ul>
      <label class="field" style="margin-top:1.25rem">Unspoken — something we wish existed in the library
        <textarea id="unspoken" placeholder="Optional wish-list for future library pieces"></textarea>
      </label>
      <div id="submitStatus"></div>
    `;
    const list = byId("summaryList");
    Object.entries(labels).forEach(([k, v]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${k}</span><strong>${escapeHtml(v)}</strong>`;
      list.appendChild(li);
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
      Preset: preset ? preset.label : state.presetId,
      "Color lead": `${findOption("colorLeads", state.colorLead)?.label || state.colorLead} (${uiKey("colorLeads", state.colorLead)})`,
      Sidebar: findOption("sidebarColors", state.sidebarColor)?.label || state.sidebarColor,
      Texture: findOption("backgroundTextures", state.backgroundTexture)?.label || state.backgroundTexture,
      "Title slide": findOption("titleSlides", state.titleSlide)?.label || state.titleSlide,
      Divider: findOption("dividers", state.dividerStyle)?.label || state.dividerStyle,
      Cards: state.varyCardsByChapter
        ? `Vary by chapter (${Object.entries(state.chapterCards)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ")})`
        : `${cardLabel(state.cardStyle)} → slug \`${state.cardStyle}\``,
      Fonts: findMeta(state.meta.fontPairings, state.fontPairing)?.label || state.fontPairing
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

  function updatePreview() {
    applyLeadVars();
    const main = byId("modelMain");
    const sidebar = byId("modelSidebar");
    const stage = byId("modelStage");
    sidebar.style.background = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-tone");

    main.className = "model-main";
    if (state.backgroundTexture === "dark-royal") main.classList.add("is-dark");
    main.classList.add(`is-texture-${state.backgroundTexture}`);

    const title = lessonDisplayTitle();
    const subtitle = state.lessonSubtitle.trim() || "Skills for Life — sample preview";
    const bullets = parseBullets(state.sampleBullets);
    const mythLines = String(state.sampleMyth || "")
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (state.previewView === "title") {
      stage.innerHTML = renderTitleSlide(title, subtitle);
    } else if (state.previewView === "divider") {
      stage.innerHTML = `
        <div class="model-divider divider-${state.dividerStyle}">
          <span class="watermark" aria-hidden="true">P1</span>
          ${
            state.dividerStyle === "centered-badge"
              ? `<span class="badge">${escapeHtml(title)}</span>`
              : `<h3>${escapeHtml(title)}</h3>`
          }
        </div>`;
    } else {
      const previewCard = state.varyCardsByChapter
        ? state.chapterCards.P1 || state.cardStyle
        : state.cardStyle;
      const cardClass = `cards-${previewCard}`;
      const cards = (bullets.length ? bullets : ["Sample point one", "Sample point two", "Sample point three"])
        .map((b, i) => {
          const myth = mythLines[i] || "";
          return `<div class="demo-card"><strong>${escapeHtml(b)}</strong>${myth ? escapeHtml(myth) : "Demo card from your sample content."}</div>`;
        })
        .join("");
      stage.innerHTML = `
        <div class="model-slide">
          <h3>Key points</h3>
          <p>Demo-first Spokes Model — sample content, not a full build. Showing <code>${escapeHtml(uiKey("cards", previewCard))}</code>.</p>
        </div>
        <div class="model-cards ${cardClass}">${cards}</div>`;
    }

    document.querySelectorAll('#previewTabs [role="tab"]').forEach((tab) => {
      const selected = tab.dataset.view === state.previewView;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    });

    byId("liveRegion").textContent = `Spokes Model showing ${state.previewView} preview for ${title}`;
  }

  function renderTitleSlide(title, subtitle) {
    const cls = `model-title title-${state.titleSlide}`;
    if (["split-hero", "diagonal-split", "vertical-strip", "side-rail"].includes(state.titleSlide)) {
      return `<div class="${cls}">
        <div class="title-hero-panel" aria-hidden="true"></div>
        <div class="title-copy model-slide"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div>
      </div>`;
    }
    if (state.titleSlide === "framed-center") {
      return `<div class="${cls}"><div class="title-frame"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div></div>`;
    }
    return `<div class="${cls} model-slide"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div>`;
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
    const [metaRes, libRes] = await Promise.all([fetch(META_URL), fetch(LIBRARY_URL)]);
    if (!metaRes.ok) throw new Error(`Failed to load ${META_URL}`);
    if (!libRes.ok) throw new Error(`Failed to load library catalog (${libRes.status}). Is SPOKES Builder/bespoke-library-catalog.json present?`);
    state.meta = await metaRes.json();
    state.library = await libRes.json();
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
        state.previewView = tab.dataset.view;
        updatePreview();
      });
      tab.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tab.click();
        }
      });
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      const panel = byId("stepPanel");
      panel.innerHTML = `<h1>Catalog load failed</h1><p class="panel-lead">${escapeHtml(err.message)}</p>`;
      console.error(err);
    });
  });
})();
