# BeSpoke direct editor — October 1, 2026

## Scope and baseline

Britt authorized planning and implementation of a simpler visual design editor. No lesson construction, production deployment, merge or design submission is included.

The isolated branch starts at `77514d06109e743a1ce9071d4f4195d360841f96` on origin/main. At baseline verification, GitHub Pages served a builder-app.mjs with the same SHA-256 as this branch: `e330733da58e420f339e589f4b9ec131113fa4f51ce892f1b8150dd0d6ee9029`. Main included all guided-builder work and the later guide/Pages fixes. Other checkouts and the port 8766 preview were left alone.

## Implemented behavior

The default surface is a cumulative slide with five live thumbnails and a contextual toolbar. Selecting visible text exposes font, supported relative size, text color and alignment. A native target dropdown provides another accessible route to the same elements. Enter/Space selects a focused element and moves to its controls; Escape selects background. Sample words use native text fields and retain normal editing shortcuts.

Selecting a box offers independent fill, border and style; layout and count remain slide-wide and are explicitly labeled. Text typography retains the supported role-level model: box headings/title bar, box body text, divider supporting text/label and activity heading/label share their indicated formatting. Individual box sample words remain independent. Background choices remain local to that reusable slide type. Shared defaults, presets, the optional guide, team/review details and all former advanced controls remain accessible. More options opens the selected slide's full inspector.

Optional `design.boxStyles` contains four closed records (`fill`, `border`, `look`), each allowing `inherit`. Hidden box settings remain stored. Designs without this extension keep their previous generated CSS. Presets reset visual overrides and retain sample words. Model validation, generated selection schema, service validation, browser recovery, save history and generated artifact CSS preserve the extension. Older strict services reject it rather than silently flattening it; a future deployment must update the compatible service/model/schema together. No deployment is included here.

Review now names individual box overrides. Similarity remains an advisory comparison of its existing measured choices and explicitly excludes individual box overrides. No claim of perceptual uniqueness is made.

## Evidence

- `scripts/test-bespoke-direct-editor.mjs`: Chromium and WebKit pass selection, scope, live computed styling, sample text, native typing, Undo/Redo, box independence, hidden-box retention, navigation, advanced controls, synthetic Save/Open/reload, schema/CSS boundaries, chrome accessibility, responsive widths and enlarged text.
- Existing synthetic artifact tests preserve box overrides in selection, contract and generated samples, including hidden boxes and immutable recovery.
- Focused existing checks pass 25 guide scenarios; 6 streamlined workflows; 4 effective-paint groups; 4 effective-theme groups; role acceptance with 481 edits, 40 paints, 100 typography checks, 20 pixel checks, 50 geometry checks and 31 axe scans.
- Existing rendered checks pass title geometry at desktop/narrow/phone widths; 60 editor and 180 generated video-frame checks with 120 pixel comparisons; 70 divider renders, 140 pattern comparisons and 80 artifact parity checks; sidebar geometry/paint/accessibility; and generated role rendering.
- Visual QA reports 48 editor axe scans, 112 viewport checks and 208 slide checks, including 42 canonical checks, with zero findings. Decorative watermark and deliberately low-contrast user artwork exclusions follow each existing suite's documented boundaries. This is not an assertion that every user-selected palette meets contrast guidance.
- Full repository quality gate: `bash scripts/quality.sh` completed successfully with browser dependencies installed. All BeSpoke suites, schema/model/service tests, lesson/template validation, library/fingerprint consistency and the lesson accessibility ratchet passed. The report-only readability baseline completed.
- Impeccable detector: no non-advisory findings in the new editor files; 18 typography notices against the former documented scale. The documentation handoff records the new compact chrome scale.
- Fresh Impeccable finish review: initial disposition `fix` for mobile density and outdated documentation. Both resolved; final disposition **ship**. The mobile canvas moved from approximately y=890 to y=645 at 390×844. Review used screenshots/source; browser evidence comes from the checks above.

## Persistent local preview

[Open BeSpoke](http://127.0.0.1:8777/bespoke/).

This loopback preview uses synthetic local Save/Open/history. It cannot send a review or reach the hosted shared service. A clearly named “Local preview demo” was saved, the detached server restarted, and a fresh browser restored its complete design including independent box styling.

The server serves this worktree. Runtime data and server logs/PID live outside Git in `/Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-direct-editor`. It is detached from the tool session and remains running; it is not a launch-at-login service.

## Screenshots

- [Desktop text selection](bespoke-direct-editor-desktop-2026-10-01.png)
- [Independent box styling](bespoke-direct-editor-box-2026-10-01.png)
- [Phone layout](bespoke-direct-editor-mobile-2026-10-01.png)

## Limits

The preview configures five reusable visual slide roles, not arbitrary lesson pages. Sizes remain the model's Smaller/Match layout/Larger choices, and linked text formatting is labeled rather than represented as independent. No production shared-save acceptance or publishing is claimed. The user must still review the proposed interaction and appearance before a release decision.
