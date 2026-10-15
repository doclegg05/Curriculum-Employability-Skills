# BeSpoke shared sessions: verification record

## Intended instructor workflow

1. Britt shares one private lesson link in each team's private Teams channel.
2. One spokesperson opens the link and shares the BeSpoke window during the call.
3. The team chooses among the approved visual options. **Save** confirms a shared
   revision; a browser draft alone is not a shared save.
4. Reopening the same link restores the latest shared design. **Open** refreshes
   it during a session. Unsaved local work is preserved before replacement.
5. **History** restores previous choices as a new revision. **Download backup**
   and **Open backup** support optional OneDrive recovery without credentials.
6. **Send to Britt** submits the saved design. The screen reports receipt only
   after GitHub creates the matching proposal, not when submission starts.

Teachers need no GitHub account, file renaming, command line, or agent knowledge.
This is turn-taking collaboration during a Teams call, with conflict protection
for simultaneous editors; it is not a live multi-cursor editor. OneDrive remains
the place for team source materials and optional downloaded design backups.

## Implementation and guardrails

- The wizard runs on GitHub Pages; a dedicated `spokes-bespoke` Netlify function
  holds service credentials and writes encrypted drafts to `bespoke-drafts`.
- Each lesson has a provisioned private access link. Authentication precedes
  repository access; there is no public first-claim registration.
- Version checks reject stale writes. Stable mutation IDs make interrupted-save
  retries safe, including retries after a later team revision.
- A separate encryption key survives GitHub token rotation. Private provisioning
  files are outside the repository; the GitHub token is in macOS Keychain and the
  service environment, never in instructor downloads or browser code.
- The server validates schema, lesson identity, catalog choices, brand constraints,
  calendar dates, and size limits before saving or sending.
- Submission creates an immutable selection, generated CSS, and build contract in
  a draft proposal. Britt reviews the design. Building needs separate authorization
  and approved content; none of the six new lessons is built by this change.
- Proposals are public because this repository is public. The UI and teacher guide
  disclose this before submission; use non-sensitive preview text and work contact
  details. Encrypted drafts and private access links are separate from proposals.

## Validation evidence

| Check | Result |
| --- | --- |
| Complete local quality gate | Passed, including six current lessons, template, schemas, registry/library sync, receipt/intake regression tests, browser workflow, generated-design checks, readability report, and existing accessibility ratchet |
| Backend and provisioning/staging tests | 26 passed |
| Python BeSpoke tests | 27 passed |
| Browser workflow | 18 scenarios passed through the real HTTP handler, including lost replies, stalled requests, wrong codes, dirty reloads, two contexts, history, snapshots, backups, and 390/768/1280-pixel widths |
| Expanded history on smaller screens | A final screenshot exposed a clipped form. Corrected the scroll layout and history toggle; hit-testing confirms reachable form controls with long notices at 1280×900, 1280×720, and 390×700. Save/Open stay first on phones. |
| Live Netlify cross-origin preflight | Empty HTTP 204 with required CORS headers |
| Invalid private access | HTTP 403 before repository writes |
| Valid private access, empty draft | HTTP 200 with null selection/revision |
| Live Netlify Save/Open, two revisions, stale write, committed retry, History, previous version | Passed against real GitHub storage; main was unchanged |
| Public Pages UI | Passed in two fresh Chromium contexts: shared Save, reload, automatic Open on another browser, stale-save rejection, credential-free backup download, latest recovery, and History restoration |
| Actual submission and receipt | Spoke Signals succeeded and created draft proposal #20 with exactly four expected design artifacts; the UI confirmed receipt and repeated Send returned the same proposal |
| Team isolation and concurrency | All six provisioned team links opened concurrently; cross-lesson revision access returned 404; sending an unsaved selection returned 409 |
| Synthetic cleanup | Test proposal #20 closed without merging, its branch removed, and the guarded synthetic-only draft branch removed; all six teams then reopened with empty shared designs |

The complete local gate is not a claim that the existing lesson accessibility
baseline is clean. The six lesson readability scores remain below grade 8; known
accessibility baseline findings remain tracked by the existing ratchet. BeSpoke's
tested session view has no axe violations in the browser suite.

## Deployed evidence and test boundary

- Implementation: [PR #19](https://github.com/doclegg05/Curriculum-Employability-Skills/pull/19), merged as `fd9343a8e68d9435f7c26ac9d994dcf1e38a1cb0`. PR quality and main quality passed.
- Pages deployment: [run 35766489508](https://github.com/doclegg05/Curriculum-Employability-Skills/actions/runs/35766489508), successful.
- Netlify service: deployment `6ab2c40ad8cfd429a1393a69`; staged function, helper, and all three authority JSON files matched the reviewed source. Production credentials were verified after deployment.
- Actual review workflow: [run 35766741304](https://github.com/doclegg05/Curriculum-Employability-Skills/actions/runs/35766741304), successful.
- Delivery evidence: [synthetic draft proposal #20](https://github.com/doclegg05/Curriculum-Employability-Skills/pull/20), closed after the test. It contained `selection.json`, `design.css`, `build-contract.json`, and `content-intake.md`; no lesson files. Receipt: `2026-09-22-e5b6439fe51c436f`.

Live browser testing used automated Chromium contexts on macOS, including actual
cross-origin requests from the public Pages host. Lost-response, timeout, blocked
browser storage, and token-rotation invariants are covered by local tests, not
claimed as production outages deliberately induced during launch. Six concurrent
team opens are a functional check, not a load benchmark.

No real instructor meeting or Microsoft tenant permissions were exercised. Teams
screen sharing and OneDrive folder access remain ordinary Microsoft features;
BeSpoke does not require a Microsoft connector. Backup JSON download/import is
tested; teachers should keep source materials in their existing shared folder.
Generated CSS and design-contract checks run on the canonical template, without
building any new lesson. A later lesson still needs visual and instructor review.

## Operational ownership

Britt controls team link distribution, design approval, and credential renewal.
The initial GitHub token expires **December 21, 2026**, before the March 2027 soft
target. Renew it using the administrator guide before expiry; preserve the draft
encryption key and team access codes. No hosting-plan change was made.

See [the process and recovery map](auto-handoff-setup.md),
[teacher meeting guide](../../bespoke/team-guide.html), and
[design-to-build contract](builder-handoff.md) for operating instructions.
