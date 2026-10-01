# Expanded role customization implementation checklist

Authorized September 24, 2026. Preserve the current editor and reusable-role
workflow while giving title, chapter divider, text-box, video and activity samples
independent local controls. This is visual design with sample words, not lesson
authoring. Work stays on `codex/bespoke-guided-builder` in the owning worktree.

## Implementation

- [x] Add a closed optional `design.roleStyles` extension. Existing v2 designs and
  v1 conversions retain their appearance without eager storage migration. Missing
  local values inherit existing theme/arrangement settings; older strict consumers
  reject the extension rather than drop it. Keep the v2 envelope coordinated across
  model, schemas, browser, service, Python and generated contracts.
- [x] Give all five roles local Background, Texture, Text and Watermark sections.
  Include solid/gradient, independent primary/secondary colors and direction;
  approved texture and strength; local colors/fonts/size/alignment/visibility;
  editable sample copy; decorative watermark type/text/color/size/placement/opacity.
  Preserve hidden values and every existing role-specific arrangement control.
- [x] Use the same effective design and layer recipes for live preview, generated
  component samples, canonical CSS and advisory contrast. Preserve title geometry,
  video frames, real sidebar, safe scrolling and sample-button behavior.
- [x] Add concise first-step directions and always-reachable help. Explain editable
  presets, shared defaults vs local overrides, cumulative sample previews, recovery
  and saving, all eleven mix-and-match brand colors, curated fonts, four-box limit,
  actual logo constraints, advisory contrast and known-reference similarity.
- [x] Preserve all new sample words on preset application. Keep UI disclosure and
  help state out of saved designs. Make compatibility and comparison limitations
  explicit, with no silent color changes or discarded choices.

## Verification and delivery

- [x] Independent model/contract and browser review with scoped repairs.
- [x] Legacy v2/v1 and new extension validation across Node/Python/schema, malformed
  imports and Unicode, all palette/font choices, nonblocking contrast, generated
  output and truthful similarity.
- [x] Isolated Chromium/WebKit checks for every control's actual effect, role
  isolation, hidden-value retention, Undo/Redo, reload/history/backup/shared save,
  representative combinations, long copy and narrow/enlarged-text accessibility.
- [x] One batched desktop/mobile visual review, repairs and bounded confirmation.
- [x] Full repository quality gate after changes settle, including prior nine QA
  repairs and latest sidebar regression. Preserve reference lesson/template hashes.
- [x] Readable implementation/evidence report and updated active design docs. Commit
  and push same branch; verify remote SHA and served assets. If module caching needs
  a server restart, back up external runtime first and verify state byte identity.

Initial verified HEAD: `1462262b482b6b709d13c93faa97779cebb204b2`.
Task-start persistent state SHA-256:
`f4c6ced81bbc95a5d82c8ce667109e0d6d76aa54c34c146e879cbed30caef11e`.
No active Safari/in-app browser operation, production release, real Send, private
access, lesson/template edits or new PR is authorized.
