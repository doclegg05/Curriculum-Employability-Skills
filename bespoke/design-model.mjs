/**
 * BeSpoke v2 design model. Pure functions; the caller passes in the parsed
 * SPOKES Builder/role-components.json as `components`.
 * scripts/bespoke_roles.py mirrors every function; scripts/test_bespoke_roles.py
 * runs both and compares the results.
 */

/** Roles the similarity meter can measure in a released lesson. */
export const MEASURED_ROLES = Object.freeze([
  "sidebar", "titleBackground", "titleText", "subtitle", "contentBackground", "heading", "body", "accent", "button"
]);

export function kebab(id) {
  return id.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function color(components, id) {
  const found = components.palette.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown palette color ${id}`);
  return found;
}

/** White or Royal, whichever reads better on this palette color. */
export function inkFor(components, id) {
  const hex = color(components, id).hex;
  return contrast(color(components, "light").hex, hex) >= contrast(color(components, "royal").hex, hex) ? "light" : "royal";
}

function blend(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  return rgbToHex(fg.map((v, i) => Math.floor(v * alpha + bg[i] * (1 - alpha) + 0.5)));
}

export function resolveColor(components, design, ref) {
  if (ref && typeof ref === "object") {
    return blend(resolveColor(components, design, ref.tint), resolveColor(components, design, ref.over), ref.alpha);
  }
  const [kind, name] = String(ref).split(":");
  if (kind === "palette") return color(components, name).hex;
  if (kind === "role") return color(components, design.roles[name]).hex;
  if (kind === "ink") return color(components, inkFor(components, design.roles[name])).hex;
  throw new Error(`Unknown color reference ${ref}`);
}

function describe(components, design, ref) {
  if (ref && typeof ref === "object") return `${describe(components, design, ref.tint)} tint`;
  const [kind, name] = String(ref).split(":");
  if (kind === "palette") return color(components, name).name;
  if (kind === "role") return color(components, design.roles[name]).name;
  return color(components, inkFor(components, design.roles[name])).name;
}

/** Colors a role may use: the team's picks plus the always-available neutrals. */
export function roleChoices(components, design) {
  const { primary = [], secondary = [] } = design.palette || {};
  return [...new Set([...primary, ...secondary, ...components.neutrals])];
}

function rolePairs(role) {
  const pairs = (role.pairs || []).map((p) => ({ fg: p.fg || `role:${role.id}`, bg: p.bg, min: p.min }));
  if (role.ink) pairs.push({ fg: `ink:${role.id}`, bg: `role:${role.id}`, min: 4.5 });
  return pairs;
}

function pairProblem(components, design, pair, label) {
  const ratio = contrast(resolveColor(components, design, pair.fg), resolveColor(components, design, pair.bg));
  if (ratio >= pair.min) return null;
  return `${label}: ${ratio.toFixed(2)}:1 on ${describe(components, design, pair.bg)}, needs ${pair.min}:1`;
}

function roleProblem(components, design, role) {
  const value = design.roles?.[role.id];
  if (!value) return `${role.label}: choose a color.`;
  if (!(role.only || roleChoices(components, design)).includes(value)) {
    return `${role.label}: ${color(components, value).name} is not one of the available colors.`;
  }
  if (role.kind === "text" && components.notText.includes(value)) {
    return `${role.label}: ${color(components, value).name} is not used for text (SPOKES rule).`;
  }
  return null;
}

/** Every rule a v2 design must meet. Empty when valid. */
export function checkDesign(components, design) {
  const ids = new Set(components.palette.map((c) => c.id));
  const { primary = [], secondary = [] } = design.palette || {};
  const picked = [...primary, ...secondary];
  const errors = [];
  if (primary.length !== 2) errors.push("Pick exactly two primary colors.");
  if (secondary.length > 3) errors.push("Pick at most three secondary colors.");
  if (new Set(picked).size !== picked.length) errors.push("A color is picked twice.");
  for (const id of picked) if (!ids.has(id)) errors.push(`${id} is not a SPOKES palette color.`);
  if (errors.length) return errors;

  for (const role of components.roles) {
    const problem = roleProblem(components, design, role);
    if (problem) errors.push(problem);
  }
  if (errors.length) return errors;

  for (const role of components.roles) {
    for (const pair of rolePairs(role)) {
      const problem = pairProblem(components, design, pair, role.label);
      if (problem) errors.push(problem);
    }
  }
  for (const group of components.slides.groups) {
    for (const decision of group.decisions) {
      const option = decision.options.find((o) => o.id === design.slides?.[group.id]?.[decision.id]);
      if (!option) {
        errors.push(`${group.label}, ${decision.label}: choose an option.`);
        continue;
      }
      for (const pair of option.pairs) {
        const problem = pairProblem(components, design, pair, `${group.label}, ${option.label}`);
        if (problem) errors.push(problem);
      }
      for (const rule of option.excludes || []) {
        if (design.slides[group.id][rule.decision] !== rule.option) continue;
        const other = group.decisions.find((d) => d.id === rule.decision).options.find((o) => o.id === rule.option);
        errors.push(`${group.label}: ${option.label} can't be combined with ${other.label}.`);
      }
    }
  }
  return errors;
}

/** The colors offered for one role, each switched off with its reason when it would break a rule. */
export function roleOptions(components, design, roleId) {
  const role = components.roles.find((r) => r.id === roleId);
  return (role.only || roleChoices(components, design)).map((id) => {
    const name = color(components, id).name;
    if (role.kind === "text" && components.notText.includes(id)) {
      return { id, name, ok: false, reason: "not used for text (SPOKES rule)" };
    }
    const trial = { ...design, roles: { ...design.roles, [roleId]: id } };
    const related = components.roles.filter((r) => r.id === roleId || rolePairs(r).some((p) => JSON.stringify(p).includes(`role:${roleId}`)));
    for (const other of related) {
      for (const pair of rolePairs(other)) {
        const problem = pairProblem(components, trial, pair, other.label);
        if (problem) return { id, name, ok: false, reason: problem.slice(other.label.length + 2) };
      }
    }
    return { id, name, ok: true, reason: "" };
  });
}

function roleVariables(components, design) {
  const lines = [];
  for (const role of components.roles) {
    const id = design.roles[role.id];
    const name = kebab(role.id);
    lines.push(`--role-${name}: var(--${id});`, `--role-${name}-rgb: ${hexToRgb(color(components, id).hex).join(", ")};`);
    if (role.ink) {
      const ink = inkFor(components, id);
      lines.push(`--role-${name}-ink: var(--${ink});`, `--role-${name}-ink-rgb: ${hexToRgb(color(components, ink).hex).join(", ")};`);
    }
  }
  return lines;
}

/** Role variables, the base rules, then each chosen option in data-file order. */
export function designCss(components, design) {
  const blocks = [`body {\n${roleVariables(components, design).map((l) => `  ${l}`).join("\n")}\n}`, components.slides.base.trim()];
  for (const group of components.slides.groups) {
    for (const decision of group.decisions) {
      const option = decision.options.find((o) => o.id === design.slides[group.id][decision.id]);
      if (option.css.trim()) blocks.push(option.css.trim());
    }
  }
  return `${blocks.join("\n\n")}\n`;
}

/** Released lessons ranked by how many of the 11 measured dimensions they share with a design. */
export function similarity(fingerprints, design) {
  return fingerprints.lessons
    .map((lesson) => {
      const matches = MEASURED_ROLES.filter((r) => lesson.roles[r] && lesson.roles[r] === design.roles[r]);
      if (lesson.fontPairing === design.fontPairing) matches.push("fontPairing");
      if (lesson.background === design.slides?.background?.pattern) matches.push("background");
      return { id: lesson.id, title: lesson.title, shared: matches.length, total: MEASURED_ROLES.length + 2, matches };
    })
    .sort((a, b) => b.shared - a.shared || a.id.localeCompare(b.id));
}
