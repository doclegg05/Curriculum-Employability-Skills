# BeSpoke preview editor — approved implementation plan

Baseline: main 77514d0 (builder matches deployed b4eb377). Retain SPOKES identity,
the five reusable slide types, approved curriculum, Guide me, presets, private
saving/reopening and cumulative design history.

1. Make the cumulative preview the primary editing surface. Keep five live design
   thumbnails to its left, with a compact contextual toolbar above. Start and
   Review remain available; detailed slide controls open only through More options.
2. Select visible heading, supporting text, box or background by click or keyboard.
   A native element picker offers an equivalent keyboard path. Selection is UI
   state, never lesson content. Show a visible selection ring and precise scope.
3. Use existing model setters for fonts, size, color, background and arrangement.
   All matching headings/body text on a reusable slide type share formatting.
   Box fill/border treatment and layout affect all boxes on Text boxes slides;
   label that scope explicitly rather than promise arbitrary per-box overrides.
   Shared defaults stay in the existing explicitly scoped detailed controls.
4. Preserve Undo/Redo, Guide me, native text-input history, saved model restore,
   hidden sample words and all detailed choices. Selection survives redraws and
   history; unavailable targets resolve to background. Read-only sessions cannot
   mutate through the toolbar.
5. Test direct/keyboard selection, local edit boundaries, repeated actions, undo/
   redo, navigation, More options, save/reopen, mobile layout and accessibility.
   Run the repository quality gate and Chromium/WebKit editor checks. Review a
   rendered desktop/mobile batch and correct concrete issues once.

Preview: isolated loopback server on a new port; separate synthetic Save/Open
storage. No real submission, team messaging, public deployment or merge.
