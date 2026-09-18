(() => {
  "use strict";

  const STORAGE_KEY = "bespoke-draft-v1";
  const REPO = "doclegg05/Curriculum-Employability-Skills";

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
    catalog: null,
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

  const els = {};

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      Object.assign(state, saved, { catalog: state.catalog });
    } catch {
      /* ignore corrupt draft */
    }
  }

  function saveDraft() {
    const { catalog, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }

  function findById(list, id) {
    return list.find((item) => item.id === id);
  }

  function applyPreset(presetId) {
    const preset = findById(state.catalog.presets, presetId);
    if (!preset) return;
    state.presetId = presetId;
    Object.assign(state, preset.defaults);
    if (!state.varyCardsByChapter) {
      state.chapterCards = {};
    }
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

  function optionButton({ id, label, detail, usedBy, swatch, pressed, onSelect }) {
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
    if (usedBy && usedBy.length) {
      const tag = document.createElement("span");
      tag.className = "used-tag";
      tag.textContent = `Used by ${usedBy.join(", ")}`;
      btn.appendChild(tag);
    }
    btn.addEventListener("click", onSelect);
    return btn;
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
    state.catalog.lessons.forEach((lesson) => {
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
      input.value = state[key] || "";
      input.addEventListener("input", () => {
        state[key] = input.value;
        saveDraft();
        updatePreview();
      });
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
    state.catalog.presets.forEach((preset) => {
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
      <p class="panel-lead">Existing SPOKES color leads only (D6). Mix and match with other catalog pieces. Options already used by Phase 1 lessons are tagged.</p>
      <div class="option-grid" id="colorGrid" role="group" aria-label="Color leads"></div>
    `;
    const grid = byId("colorGrid");
    state.catalog.colorLeads.forEach((lead) => {
      grid.appendChild(
        optionButton({
          id: lead.id,
          label: lead.label,
          usedBy: lead.usedBy,
          swatch: `linear-gradient(135deg, ${lead.gradientFrom}, ${lead.gradientTo})`,
          pressed: state.colorLead === lead.id,
          onSelect: () => {
            state.colorLead = lead.id;
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
      <p class="panel-lead">Layer 1 surfaces from the existing theme library.</p>
      <h2 class="sr-only">Sidebar color</h2>
      <p><strong>Sidebar</strong></p>
      <div class="option-grid" id="sidebarGrid"></div>
      <p style="margin-top:1.25rem"><strong>Background texture</strong></p>
      <div class="option-grid" id="textureGrid"></div>
    `;
    const sidebarGrid = byId("sidebarGrid");
    state.catalog.sidebarColors.forEach((item) => {
      sidebarGrid.appendChild(
        optionButton({
          id: item.id,
          label: item.label,
          swatch: item.css,
          pressed: state.sidebarColor === item.id,
          onSelect: () => {
            state.sidebarColor = item.id;
            saveDraft();
            render();
          }
        })
      );
    });
    const textureGrid = byId("textureGrid");
    state.catalog.backgroundTextures.forEach((item) => {
      textureGrid.appendChild(
        optionButton({
          id: item.id,
          label: item.label,
          pressed: state.backgroundTexture === item.id,
          onSelect: () => {
            state.backgroundTexture = item.id;
            saveDraft();
            render();
          }
        })
      );
    });
  }

  function renderLayouts(panel) {
    panel.innerHTML = `
      <h1>Title slide &amp; divider</h1>
      <p class="panel-lead">Twelve title layouts and five section dividers from the library.</p>
      <p><strong>Title slide</strong></p>
      <div class="option-grid" id="titleGrid"></div>
      <p style="margin-top:1.25rem"><strong>Section divider</strong></p>
      <div class="option-grid" id="dividerGrid"></div>
    `;
    const titleGrid = byId("titleGrid");
    state.catalog.titleSlides.forEach((item) => {
      titleGrid.appendChild(
        optionButton({
          id: item.id,
          label: item.label,
          pressed: state.titleSlide === item.id,
          onSelect: () => {
            state.titleSlide = item.id;
            state.previewView = "title";
            saveDraft();
            render();
          }
        })
      );
    });
    const dividerGrid = byId("dividerGrid");
    state.catalog.dividerStyles.forEach((item) => {
      dividerGrid.appendChild(
        optionButton({
          id: item.id,
          label: item.label,
          pressed: state.dividerStyle === item.id,
          onSelect: () => {
            state.dividerStyle = item.id;
            state.previewView = "divider";
            saveDraft();
            render();
          }
        })
      );
    });
  }

  function renderCards(panel) {
    panel.innerHTML = `
      <h1>Card style</h1>
      <p class="panel-lead">Lesson-wide by default. Opt in to vary by WIPPEA chapter (D12).</p>
      <div class="option-grid" id="cardGrid"></div>
      <div class="toggle-row">
        <input type="checkbox" id="varyCards" ${state.varyCardsByChapter ? "checked" : ""}>
        <label for="varyCards">
          <strong>Vary card style by chapter / topic</strong><br>
          <span style="font-weight:400;color:var(--gray)">Uses different library card pieces for different WIPPEA stages.</span>
        </label>
      </div>
      <div class="chapter-vary ${state.varyCardsByChapter ? "is-open" : ""}" id="chapterVary"></div>
    `;
    const cardGrid = byId("cardGrid");
    state.catalog.cardStyles.forEach((item) => {
      cardGrid.appendChild(
        optionButton({
          id: item.id,
          label: item.label,
          pressed: state.cardStyle === item.id,
          onSelect: () => {
            state.cardStyle = item.id;
            state.previewView = "cards";
            saveDraft();
            render();
          }
        })
      );
    });
    byId("varyCards").addEventListener("change", (e) => {
      state.varyCardsByChapter = e.target.checked;
      if (state.varyCardsByChapter) {
        state.catalog.chapterKeys.forEach((key) => {
          if (!state.chapterCards[key]) state.chapterCards[key] = state.cardStyle;
        });
      }
      saveDraft();
      render();
    });
    const chapterVary = byId("chapterVary");
    if (state.varyCardsByChapter) {
      state.catalog.chapterKeys.forEach((key) => {
        const label = document.createElement("label");
        label.textContent = key;
        const select = document.createElement("select");
        select.setAttribute("aria-label", `Card style for chapter ${key}`);
        state.catalog.cardStyles.forEach((style) => {
          const opt = document.createElement("option");
          opt.value = style.id;
          opt.textContent = style.label;
          if ((state.chapterCards[key] || state.cardStyle) === style.id) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => {
          state.chapterCards[key] = select.value;
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
      <p class="panel-lead">Self-hosted pairings from the SPOKES font library.</p>
      <div class="option-grid" id="fontGrid"></div>
    `;
    const grid = byId("fontGrid");
    state.catalog.fontPairings.forEach((item) => {
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
    const lesson = findById(state.catalog.lessons, state.lessonId);
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
      input.value = state[key] || "";
      input.addEventListener("input", () => {
        state[key] = input.value;
        saveDraft();
        updatePreview();
      });
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
      <p class="panel-lead">Spoke Signals sends your choices as a lesson-tagged PR. Merge is Britt’s greenlight to build. No GitHub token is used in this browser.</p>
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
    const c = state.catalog;
    const lesson = findById(c.lessons, state.lessonId);
    const preset = findById(c.presets, state.presetId);
    return {
      Lesson: lesson ? lesson.title : state.lessonId,
      Team: state.teamName || "—",
      Spokesperson: state.spokespersonName || "—",
      Preset: preset ? preset.label : state.presetId,
      "Color lead": findById(c.colorLeads, state.colorLead)?.label || state.colorLead,
      Sidebar: findById(c.sidebarColors, state.sidebarColor)?.label || state.sidebarColor,
      Texture: findById(c.backgroundTextures, state.backgroundTexture)?.label || state.backgroundTexture,
      "Title slide": findById(c.titleSlides, state.titleSlide)?.label || state.titleSlide,
      Divider: findById(c.dividerStyles, state.dividerStyle)?.label || state.dividerStyle,
      Cards: state.varyCardsByChapter
        ? `Vary by chapter (${Object.entries(state.chapterCards)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ")})`
        : findById(c.cardStyles, state.cardStyle)?.label || state.cardStyle,
      Fonts: findById(c.fontPairings, state.fontPairing)?.label || state.fontPairing
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

  function validateCurrentStep() {
    const id = STEPS[state.step].id;
    if (id === "team") {
      if (!state.spokespersonName.trim()) {
        alert("Spoke Too Soon — add the spokesperson’s name before continuing.");
        return false;
      }
      if (!state.lessonId) {
        alert("Spoke Too Soon — pick a lesson.");
        return false;
      }
    }
    return true;
  }

  function applyLeadVars() {
    const lead = findById(state.catalog.colorLeads, state.colorLead);
    const root = document.documentElement;
    if (lead) {
      root.style.setProperty("--lead-heading", lead.heading);
      root.style.setProperty("--lead-button", lead.button);
      root.style.setProperty("--lead-from", lead.gradientFrom);
      root.style.setProperty("--lead-to", lead.gradientTo);
    }
    const sidebar = findById(state.catalog.sidebarColors, state.sidebarColor);
    root.style.setProperty("--sidebar-tone", sidebar ? sidebar.css : "var(--dark)");
    const fonts = findById(state.catalog.fontPairings, state.fontPairing);
    if (fonts) {
      root.style.setProperty("--model-heading", `"${fonts.heading}", Georgia, serif`);
      root.style.setProperty("--model-body", `"${fonts.body}", system-ui, sans-serif`);
    }
  }

  function lessonDisplayTitle() {
    if (state.lessonTitle.trim()) return state.lessonTitle.trim();
    const lesson = findById(state.catalog.lessons, state.lessonId);
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
      const cardClass = `cards-${state.cardStyle}`;
      const cards = (bullets.length ? bullets : ["Sample point one", "Sample point two", "Sample point three"])
        .map((b, i) => {
          const myth = mythLines[i] || "";
          return `<div class="demo-card"><strong>${escapeHtml(b)}</strong>${myth ? escapeHtml(myth) : "Demo card from your sample content."}</div>`;
        })
        .join("");
      stage.innerHTML = `
        <div class="model-slide">
          <h3>Key points</h3>
          <p>Demo-first Spokes Model — sample content, not a full build.</p>
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
    if (["split-hero", "diagonal-split", "vertical-strip"].includes(state.titleSlide)) {
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
    const lesson = findById(state.catalog.lessons, state.lessonId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      schema: "bespoke-selection/v1",
      submittedAt: new Date().toISOString(),
      date: today,
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
    return `# SPOKES Lesson Content Intake Template

**Filled by Bespoke** (prototype). Template remains canonical (D11).

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

| Dimension | Selection |
|-----------|-----------|
| Preset | ${payload.presetId} |
| Color lead | ${payload.theme.colorLead} |
| Sidebar | ${payload.theme.sidebarColor} |
| Texture | ${payload.theme.backgroundTexture} |
| Title slide | ${payload.theme.titleSlide} |
| Divider | ${payload.theme.dividerStyle} |
| Font pairing | ${payload.theme.fontPairing} |
| Cards | ${
      payload.theme.cards.varyByChapter
        ? `vary by chapter: ${JSON.stringify(payload.theme.cards.chapterStyles)}`
        : payload.theme.cards.lessonWide
    } |
| Unspoken | ${payload.unspoken || "_none_"} |

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
    buildStepper();
    renderPanel();
    updatePreview();
    saveDraft();
    byId("stepPanel").focus({ preventScroll: true });
  }

  async function init() {
    els.live = byId("liveRegion");
    const res = await fetch("./catalog.json");
    state.catalog = await res.json();
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

  document.addEventListener("DOMContentLoaded", init);
})();
