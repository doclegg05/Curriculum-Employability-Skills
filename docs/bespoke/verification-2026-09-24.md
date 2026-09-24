# BeSpoke guided builder — local verification, September 24, 2026

## Result and boundary

The v2 reusable visual-design builder is implemented on `codex/bespoke-guided-builder`, based on remote main `04f6f9fd3780a418ad3667d1c42184fe60100560`. A separate managed worktree and port preserve the original checkout, unfinished Claude worktree, and original Safari draft.

The new local preview is `http://127.0.0.1:8766/bespoke/`. A detached Node process serves the isolated worktree and a synthetic persistent draft service. Safari visibly rendered the new builder in a **new tab**; the earlier wizard tab remained present and port 8765 still returned HTTP 200. The new service binds loopback, supplies only its own local handoff URL, and blocks Send/status operations. No hosted acceptance, production deployment, real team code, production draft mutation, merge, lesson build or publication was performed.

This is a reusable visual-design tool with sample text. It is not a full lesson authoring canvas. Franklin Gothic Book remains omitted under the user's authorized fallback; all twelve existing font families remain independently available.

## Executed checks

`bash scripts/quality.sh` exited 0 with `quality.sh: all checks passed`.

- All six released lesson decks and the canonical builder template passed the required critical validator checks. Their existing noncritical warnings were unchanged.
- 47 validator Python tests and 35 BeSpoke Python tests passed.
- V1 and generated v2 schemas are current; positive and deliberately invalid selection fixtures behaved as expected.
- 10 pure model regression groups and seven similarity tests passed. Rendered fingerprint regeneration matched all six actual decks and their source hashes.
- 45 service/provisioning/brief/v2/local-server Node tests passed, including synthetic revision conflicts, mutation retries, preserved v1 recovery, receipt behavior, staged dependencies, and persistence after local-service restart.
- The preserved v1 browser suite passed 27 workflows against `legacy.html`.
- The new v2 browser suite passed seven end-to-end scenarios: full palette and independent fonts, editable presets, cumulative navigation and reload, Undo, hidden box text through all counts/title/treatments, invalid-contrast backup recovery, save/reopen and stale-writer recovery, v1 conversion review pause, keyboard focus, desktop/mobile layout and accessibility.
- Browser checks recorded no missing assets, runtime errors or external requests. All desktop steps and mobile controls/preview passed axe WCAG A/AA. The sole new-suite exclusion is the explicitly decorative, `aria-hidden` duplicate chapter-number watermark; readable chapter labels/headings remain scanned.
- Generated v2 contracts preserve the full model and check real component structure, including all 24 box-count/title-bar/text-treatment combinations. Shared model markup/CSS also received a bounded Chromium sweep of 94 individual option/viewport scenarios without horizontal overflow at 375px and 1100px.
- Existing generated-design checks, all fifteen title layouts, catalog synchronization, and readability baseline passed. Existing title-layout coverage warnings for `offset-left` and `radial-glow` remain report-only.
- Existing lesson accessibility ratchet passed with no additions to its committed baseline. This does **not** claim that the released decks have zero accessibility findings.
- A final legacy-route smoke check found a missing local-server allowlist entry for its public `theme-options.json`. The exact asset was added; all three local-server tests passed again, and the original v1 app rendered its eleven steps without runtime errors. The original `app.js` is reused byte-for-byte rather than duplicated.
- `git diff --check` passed. Original saved checkout remained clean.

The preview and artifacts use the same `builder-model.mjs` renderer, with canonical integration rules disabled only for the surrounding editor chrome. The selected fonts were checked as loaded browser font families, not merely serialized strings.

## Independent finish review

The Impeccable finish review inspected desktop and mobile screenshots and source. Its initial P2 finding was loss of keyboard focus after dynamic controls re-rendered. Stable identities now restore focus for preset, paint and layout buttons; Enter/Tab tests and six desktop/mobile focus traces verify the repair.

| Finding | Verdict |
| --- | --- |
| P2: preserve focus after selecting an option | Resolved |
| Remaining material findings | None |
| Final disposition | **ship** |

Three detector flags were reviewed in context: the thick rail is a miniature layout diagram, the lower border is the active tab indicator, and Inter is one of the user-required existing selectable fonts. They are retained for those explicit functions. No replacement visual-world comp was required for this extension of SPOKES.

## Reproduce and inspect

```sh
node scripts/bespoke-dev-server.mjs --port 8766 \
  --runtime-dir "$HOME/Library/Application Support/Codex/local-previews/bespoke-guided-builder"
bash scripts/quality.sh
```

Do not launch a second server on an occupied port. The running process's PID, log, synthetic encrypted store, full quality log and review screenshots are under that runtime directory, outside Git. The server intentionally rejects runtime directories inside any Git checkout. The dependencies used for this run were existing pinned Playwright/axe packages linked into the isolated checkout; `npm ci` is the reproducible installation path.

The browser suite creates separate ephemeral servers and contexts. Its state never enters the persistent user-facing local preview. Original v1 files remain accepted; converted designs retain the untouched original and explicit approximation notes. Browser drafts/backups can retain readability warnings for recovery, while shared-save/design-generation authority rejects unresolved unsafe combinations.

## Remaining rollout work

Hosted service staging/deployment and hosted acceptance are still required before any v2 team rollout. The submission workflow now declares Node 22 for the shared JS model bridge. Deploy service and static v2 assets together only after authorization and acceptance. The existing legacy registry command deliberately rejects v2 rather than discarding independent choices; a reviewed v2 registry consumer is needed only if a future separately authorized lesson build uses that registry. Current proposal generation produces the complete selection, intake, CSS, contract and reusable sample HTML.

## Follow-up: visible button-color feedback

Britt reported that Buttons could be painted while Text boxes showed no button.
The role value was serialized, but the selected preview could not demonstrate it.
The correction adds a temporary, labeled action sample outside title/divider/text-box
slide markup while Buttons is selected. It keeps the chosen tab, uses the same model
button styles, and provides an inline sample on phones. Video and Activity now use
actual inert sample buttons. No sample has a link, download target or submit action.
Local drafts also retain the selected paint role and preview tab through refresh.

A new desktop/390px behavioral regression verifies Green/Royal and Navy/White
computed button colors and 4.5:1-or-better text contrast; visible feedback without
switching surfaces; keyboard selection/focus; unchanged unrelated choices; Undo;
reload with history; all preview tabs; removal of the contextual sample when leaving
the Buttons role; and inert activation without navigation, downloads or service
requests. The new builder suite now passes eight scenarios with no runtime, asset,
external-request or accessibility failures under the same documented watermark
exception. The full `scripts/quality.sh` gate passed again, including generated
contracts/artifacts and the unchanged legacy/lesson baselines.

Synthetic desktop and mobile screenshots visibly show the Green sample beneath
Text boxes and beside the phone palette. Before refreshing the existing Safari tab,
a recovery download was confirmed. After refresh, the selected Raleway heading,
Source Sans 3 body, Soft wash background, Divider preview and available Undo remained.
The user resumed editing; their subsequent preset confirmation was left untouched.
No saved selections were reseeded or cleared. The old checkout and port 8765 were
untouched. Follow-up logs/screenshots are retained in the external preview runtime
directory as `bespoke-button-*`; no production rollout occurred.
