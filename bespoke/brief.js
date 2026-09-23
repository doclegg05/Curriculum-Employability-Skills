/**
 * BeSpoke design brief — turns a team's answers into a starting design.
 *
 * Pure functions only: no DOM, no storage. The wizard (app.js) and the Node
 * tests (scripts/test-bespoke-brief.mjs) both load this file.
 *
 * Every pick comes from the SPOKES library catalog; nothing here invents a
 * color, font, or CSS value. The brief answers stay in the browser draft; the
 * shared selection payload records only the resulting library choices.
 */
(function (root) {
  "use strict";

  /** Trait scale 0–1. e = energy (calm → lively), w = warmth (cool → warm), f = formality (relaxed → formal). */
  const TRAITS = {
    colorLeads: {
      blue: { e: 0.4, w: 0.35, f: 0.7 },
      royal: { e: 0.3, w: 0.2, f: 0.9 },
      green: { e: 0.55, w: 0.7, f: 0.45 },
      mauve: { e: 0.5, w: 0.55, f: 0.7 },
      gold: { e: 0.6, w: 0.85, f: 0.5 },
      "dual-blue-green": { e: 0.7, w: 0.6, f: 0.4 },
      "dual-gold-green": { e: 0.8, w: 0.8, f: 0.35 },
      "dual-mauve-blue": { e: 0.65, w: 0.45, f: 0.6 },
      "dual-mauve-gold": { e: 0.75, w: 0.75, f: 0.55 }
    },
    sidebarColors: {
      dark: { e: 0.45, w: 0.45, f: 0.6 },
      royal: { e: 0.3, w: 0.2, f: 0.85 }
    },
    backgroundTextures: {
      plain: { e: 0.3, w: 0.5, f: 0.7 },
      "dot-grid": { e: 0.45, w: 0.45, f: 0.6 },
      diagonal: { e: 0.65, w: 0.4, f: 0.5 },
      crosshatch: { e: 0.7, w: 0.5, f: 0.4 },
      "soft-gradient": { e: 0.4, w: 0.8, f: 0.4 },
      "dark-royal": { e: 0.5, w: 0.3, f: 0.8 }
    },
    titleSlides: {
      "centered-gradient": { e: 0.45, w: 0.45, f: 0.65 },
      "split-hero": { e: 0.6, w: 0.4, f: 0.7 },
      "full-bleed": { e: 0.8, w: 0.5, f: 0.5 },
      "bottom-anchored": { e: 0.4, w: 0.7, f: 0.45 },
      "offset-left": { e: 0.7, w: 0.5, f: 0.5 },
      "diagonal-split": { e: 0.85, w: 0.5, f: 0.4 },
      "framed-center": { e: 0.3, w: 0.4, f: 0.85 },
      "top-banner": { e: 0.7, w: 0.6, f: 0.4 },
      "radial-glow": { e: 0.6, w: 0.7, f: 0.45 },
      "vertical-strip": { e: 0.55, w: 0.4, f: 0.6 },
      "corner-accent": { e: 0.5, w: 0.55, f: 0.5 },
      "horizon-line": { e: 0.35, w: 0.5, f: 0.6 },
      "quiet-center": { e: 0.2, w: 0.55, f: 0.6 },
      "dual-band": { e: 0.6, w: 0.6, f: 0.5 },
      "side-rail": { e: 0.65, w: 0.45, f: 0.6 }
    },
    dividers: {
      "gradient-sweep": { e: 0.5, w: 0.45, f: 0.6 },
      "framed-gold": { e: 0.35, w: 0.5, f: 0.85 },
      "bold-full-bleed": { e: 0.85, w: 0.55, f: 0.4 },
      "split-panel": { e: 0.6, w: 0.5, f: 0.6 },
      "centered-badge": { e: 0.45, w: 0.75, f: 0.45 },
      "gold-rail": { e: 0.6, w: 0.55, f: 0.7 },
      "stacked-bands": { e: 0.7, w: 0.6, f: 0.5 },
      "dark-masthead": { e: 0.5, w: 0.3, f: 0.85 }
    },
    cards: {
      "left-border": { e: 0.4, w: 0.45, f: 0.6 },
      "shadow-float": { e: 0.45, w: 0.55, f: 0.5 },
      "sharp-border": { e: 0.45, w: 0.3, f: 0.85 },
      glass: { e: 0.55, w: 0.4, f: 0.6 },
      outlined: { e: 0.45, w: 0.45, f: 0.6 },
      "gradient-fill": { e: 0.7, w: 0.5, f: 0.5 },
      pill: { e: 0.55, w: 0.8, f: 0.3 },
      layered: { e: 0.8, w: 0.6, f: 0.35 },
      "top-accent": { e: 0.6, w: 0.5, f: 0.55 },
      "inset-panel": { e: 0.25, w: 0.6, f: 0.5 },
      "dual-rail": { e: 0.65, w: 0.55, f: 0.55 },
      "soft-lift": { e: 0.4, w: 0.7, f: 0.45 },
      "rule-stack": { e: 0.3, w: 0.35, f: 0.8 },
      "stamp-frame": { e: 0.85, w: 0.6, f: 0.45 },
      "banded-header": { e: 0.7, w: 0.6, f: 0.5 },
      "quiet-outline": { e: 0.15, w: 0.5, f: 0.6 }
    },
    fonts: {
      "dm-serif-display-outfit": { e: 0.45, w: 0.5, f: 0.6 },
      "playfair-display-inter": { e: 0.4, w: 0.35, f: 0.85 },
      "merriweather-source-sans-3": { e: 0.35, w: 0.75, f: 0.55 },
      "vollkorn-fira-sans": { e: 0.3, w: 0.4, f: 0.8 },
      "crimson-pro-work-sans": { e: 0.6, w: 0.7, f: 0.45 },
      "bitter-raleway": { e: 0.8, w: 0.55, f: 0.45 }
    }
  };

  /** Selection field → trait family. Order is the order picks are explained in. */
  const FIELDS = [
    ["colorLead", "colorLeads", "Color lead"],
    ["backgroundTexture", "backgroundTextures", "Background"],
    ["sidebarColor", "sidebarColors", "Sidebar"],
    ["titleSlide", "titleSlides", "Title slide"],
    ["dividerStyle", "dividers", "Divider"],
    ["cardStyle", "cards", "Cards"],
    ["fontPairing", "fonts", "Fonts"]
  ];

  /** The six presets reproduce the six existing lessons' registered looks. */
  const PRESET_LESSONS = {
    professional: "Time Management",
    modern: "Interview Skills",
    serious: "Controlling Anger",
    "light-hearted": "Employee Accountability",
    fun: "Communicating with the Public",
    outspoken: "Problem Solving & Decision Making"
  };

  /** Color leads that suit each Round 2 topic, best first. Topic cue only; teams can change it. */
  const LESSON_COLOR_CUES = {
    "goal-setting": ["green", "dual-gold-green", "gold"],
    "money-management": ["gold", "dual-gold-green", "green"],
    "professionalism-and-diversity": ["dual-blue-green", "dual-mauve-blue", "royal"],
    "knowing-your-rights": ["royal", "mauve", "dual-mauve-blue"],
    "communicating-assertively": ["mauve", "dual-mauve-gold", "blue"],
    "workplace-ethics": ["royal", "blue", "dual-mauve-blue"]
  };

  const QUESTIONS = [
    {
      id: "briefFeel",
      prompt: "How should learners feel when this lesson opens?",
      hint: "Pick the one that fits best.",
      options: [
        { id: "calm", label: "Calm and steady", detail: "Quiet colors, lots of breathing room", traits: { e: 0.2, w: 0.55, f: 0.6 } },
        { id: "welcoming", label: "Warm and welcoming", detail: "Soft shapes, friendly type", traits: { e: 0.45, w: 0.85, f: 0.35 } },
        { id: "professional", label: "Confident and professional", detail: "Crisp lines, boardroom polish", traits: { e: 0.4, w: 0.4, f: 0.85 } },
        { id: "upbeat", label: "Upbeat and energized", detail: "Bright pairs, playful cards", traits: { e: 0.85, w: 0.7, f: 0.35 } },
        { id: "serious", label: "Serious and focused", detail: "Grounded tones, few distractions", traits: { e: 0.3, w: 0.3, f: 0.85 } },
        { id: "bold", label: "Bold and empowered", detail: "Strong contrast that speaks up", traits: { e: 0.85, w: 0.5, f: 0.6 } }
      ]
    },
    {
      id: "briefRoom",
      prompt: "What does class time look like?",
      options: [
        { id: "quiet", label: "Quiet, reflective work", energy: -0.15 },
        { id: "discussion", label: "Talk and discussion", energy: 0 },
        { id: "active", label: "Hands-on and active", energy: 0.15 }
      ]
    },
    {
      id: "briefFresh",
      prompt: "How close to the existing lessons?",
      options: [
        { id: "familiar", label: "Close to the family", novelty: 0, maxShared: 5 },
        { id: "balanced", label: "Its own look", novelty: 0.5, maxShared: 4 },
        { id: "fresh", label: "Clearly different", novelty: 1, maxShared: 3 }
      ]
    },
    {
      id: "briefLight",
      prompt: "Light or dark slides?",
      options: [
        { id: "light", label: "Light" },
        { id: "dark", label: "Dark" },
        { id: "either", label: "Either is fine" }
      ]
    }
  ];

  const DEFAULT_BRIEF = Object.freeze({ briefFeel: "", briefRoom: "discussion", briefFresh: "balanced", briefLight: "either", briefVariant: 0 });

  function question(id) {
    return QUESTIONS.find((q) => q.id === id);
  }

  function answer(questionId, answerId) {
    const q = question(questionId);
    return (q && q.options.find((o) => o.id === answerId)) || null;
  }

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  /** FNV-1a — stable across browsers and Node, so a team sees the same suggestion everywhere. */
  function hash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function jitter(seed, family, slug) {
    return hash(`${seed}|${family}|${slug}`) / 0xffffffff;
  }

  function isComplete(brief) {
    return Boolean(brief && answer("briefFeel", brief.briefFeel));
  }

  function target(brief) {
    const feel = answer("briefFeel", brief.briefFeel);
    const room = answer("briefRoom", brief.briefRoom) || answer("briefRoom", DEFAULT_BRIEF.briefRoom);
    const base = feel ? feel.traits : { e: 0.5, w: 0.5, f: 0.5 };
    return { e: clamp01(base.e + room.energy), w: base.w, f: base.f };
  }

  function fit(traits, goal) {
    if (!traits) return 0.5;
    const d = Math.hypot(traits.e - goal.e, traits.w - goal.w, traits.f - goal.f) / Math.sqrt(3);
    return 1 - d;
  }

  /** Options per family as { slug, label, legacy, blocked }; fonts come from the wizard meta. */
  function familyOptions(ctx, family) {
    if (family === "fonts") {
      return (ctx.meta.fontPairings || []).map((p) => ({ slug: p.id, label: p.label, legacy: true, blocked: false }));
    }
    return ctx.library?.families?.[family]?.options || [];
  }

  /** Slugs the six existing lessons (presets) already use, per selection field. */
  function usedSlugs(ctx, field) {
    return new Set((ctx.meta.presets || []).map((p) => p.defaults[field]).filter(Boolean));
  }

  /**
   * Score every available option in one family for this brief. Highest first.
   * Each entry carries the reasons that moved its score, for plain-language explanations.
   */
  function rankFamily(ctx, brief, field, family, variant = brief.briefVariant || 0) {
    const goal = target(brief);
    const fresh = answer("briefFresh", brief.briefFresh) || answer("briefFresh", DEFAULT_BRIEF.briefFresh);
    const light = brief.briefLight || "either";
    const seed = `${ctx.lessonId}|${String(ctx.teamName || "").trim().toLowerCase()}|${variant}`;
    const used = usedSlugs(ctx, field);
    const cues = family === "colorLeads" ? LESSON_COLOR_CUES[ctx.lessonId] || [] : [];

    return familyOptions(ctx, family)
      .filter((o) => !o.blocked)
      .filter((o) => !(family === "backgroundTextures" && light === "light" && o.slug === "dark-royal"))
      .map((o) => {
        const reasons = [];
        let score = fit(TRAITS[family]?.[o.slug], goal);
        const cueRank = cues.indexOf(o.slug);
        if (cueRank >= 0) {
          score += 0.12 * (3 - cueRank) / 3;
          reasons.push("topic");
        }
        if (fresh.novelty > 0 && o.legacy === false) {
          score += 0.1 * fresh.novelty;
          reasons.push("new");
        }
        if (fresh.novelty > 0 && used.has(o.slug)) score -= 0.08 * fresh.novelty;
        if (family === "backgroundTextures" && o.slug === "dark-royal") {
          if (light === "dark") { score += 1; reasons.push("dark"); }
          else score -= 0.1;
        }
        if (family === "cards" && o.slug === "glass") score += light === "dark" ? 0.1 : -0.15;
        score += jitter(seed, family, o.slug) * 0.06;
        return { slug: o.slug, label: o.label, score, reasons };
      })
      .sort((a, b) => b.score - a.score);
  }

  function sharedWith(selection, preset) {
    return FIELDS.filter(([field]) => preset.defaults[field] === selection[field]).length;
  }

  /** How close a selection is to each existing lesson's look. */
  function distinctness(meta, selection) {
    let closest = null;
    for (const preset of meta.presets || []) {
      const shared = sharedWith(selection, preset);
      if (!closest || shared > closest.shared) closest = { presetId: preset.id, lesson: PRESET_LESSONS[preset.id] || preset.label, shared };
    }
    return { ...(closest || { presetId: null, lesson: null, shared: 0 }), total: FIELDS.length };
  }

  /** Only the reasons beyond the feel itself; the feel is stated once above the list. */
  function reasonText(entry, lessonTitle) {
    const parts = [];
    if (entry.reasons.includes("dark")) parts.push("Dark slides, as you asked");
    if (entry.reasons.includes("topic")) parts.push(`Suits ${lessonTitle}`);
    if (entry.reasons.includes("new")) parts.push("Newer piece, not in any lesson yet");
    return parts.join(" · ");
  }

  /**
   * Build a complete starting design from the brief.
   * ctx = { meta, library, lessonId, lessonTitle, teamName }.
   * Returns null until the feel question is answered.
   */
  function suggestDesign(ctx, brief) {
    if (!isComplete(brief)) return null;
    const ranked = Object.fromEntries(FIELDS.map(([field, family]) => [field, rankFamily(ctx, brief, field, family)]));
    const choice = Object.fromEntries(FIELDS.map(([field]) => [field, 0]));
    const pick = () => Object.fromEntries(FIELDS.map(([field]) => [field, ranked[field][choice[field]]?.slug]));
    const fresh = answer("briefFresh", brief.briefFresh) || answer("briefFresh", DEFAULT_BRIEF.briefFresh);
    const locked = new Set(brief.briefLight === "dark" ? ["backgroundTexture"] : []);

    // Step away from any existing lesson this design copies too closely:
    // swap the shared choice whose runner-up costs the least score.
    for (let guard = 0; guard < FIELDS.length; guard += 1) {
      const selection = pick();
      const near = distinctness(ctx.meta, selection);
      if (near.shared <= fresh.maxShared) break;
      const preset = ctx.meta.presets.find((p) => p.id === near.presetId);
      let best = null;
      for (const [field] of FIELDS) {
        if (locked.has(field) || preset.defaults[field] !== selection[field]) continue;
        const list = ranked[field];
        const next = list[choice[field] + 1];
        if (!next) continue;
        const loss = list[choice[field]].score - next.score;
        if (!best || loss < best.loss) best = { field, loss };
      }
      if (!best) break;
      choice[best.field] += 1;
    }

    const picks = pick();
    const explained = FIELDS.map(([field, family, name]) => {
      const entry = ranked[field][choice[field]];
      return { field, family, name, slug: entry.slug, label: entry.label, why: reasonText(entry, ctx.lessonTitle) };
    });
    const near = distinctness(ctx.meta, picks);
    const basePreset = near.presetId || (ctx.meta.presets[0] && ctx.meta.presets[0].id);
    return { picks, explained, closest: near, basePreset };
  }

  /** Top slugs in a family for the "Fits your brief" tag. */
  function topPicks(ctx, brief, field, family, count = 2) {
    if (!isComplete(brief)) return [];
    return rankFamily(ctx, brief, field, family).slice(0, count).map((e) => e.slug);
  }

  /** Two plain mood words for options the library does not describe. */
  function moodWords(family, slug) {
    const t = TRAITS[family]?.[slug];
    if (!t) return "";
    const words = [];
    if (t.e >= 0.65) words.push("Lively");
    else if (t.e <= 0.35) words.push("Calm");
    if (t.f >= 0.7) words.push("Formal");
    else if (t.f <= 0.4) words.push("Relaxed");
    if (words.length < 2 && t.w >= 0.65) words.push("Warm");
    else if (words.length < 2 && t.w <= 0.35) words.push("Cool");
    return words.slice(0, 2).join(" · ");
  }

  const api = {
    TRAITS,
    FIELDS,
    QUESTIONS,
    PRESET_LESSONS,
    LESSON_COLOR_CUES,
    DEFAULT_BRIEF,
    answer,
    isComplete,
    rankFamily,
    suggestDesign,
    topPicks,
    distinctness,
    moodWords
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BespokeBrief = api;
})(typeof window !== "undefined" ? window : globalThis);
