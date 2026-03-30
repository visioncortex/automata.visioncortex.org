---
title: Choosing Anchors
sidebar_label: Choosing Anchors
---

# Choosing Anchors

Given a real application, how do you decide where to put anchors? This is the most consequential structural decision in a workflow. The right choices make the workflow resilient; the wrong ones produce stale handles and fragile re-query chains.

For the anchor mechanics — declaration syntax, lifetime tiers, mount/unmount — see [Anchors](../03-core-concepts/04-anchors.md).

## Start from the App, Not the Tier List

The instinct when learning anchors is to read the tier definitions and try to assign each element to a tier. That is backwards.

Start instead by observing what the application actually rebuilds during the workflow. Every time the app navigates, opens a dialog, or reloads a panel, the element handles within that subtree go stale. Anchor boundaries should sit just outside those rebuild points.

**Anchor the outermost element that stays alive for the duration of the task.** Everything inside it can be addressed with selectors.

## A Worked Example

Consider a document editor with a menu bar, an editor pane, and a Save As dialog that appears when saving.

The app rebuilds the editor pane when it opens a new document, but the main window stays alive throughout. The Save As dialog appears mid-workflow and disappears after saving.

```yaml
anchors:
  # The main window — alive for the entire workflow.
  # Root: locked to HWND on first resolution, fatal if it goes away.
  app:
    type: Root
    process: myeditor
    selector: "*"

  # The editor pane — stable within the main window, but rebuilt on new document.
  # Stable: re-queried automatically from nearest live ancestor when stale.
  editor:
    type: Stable
    parent: app
    selector: ">> [role=document][name='Editor']"

  # The Save As dialog — present only during the save phase.
  # Session: non-fatal if absent, re-resolved lazily.
  save_dialog:
    type: Session
    selector: "[name='Save As']"
```

Phases opt in to the anchors they need:

```yaml
phases:
  - name: edit_content
    mount: [app, editor]
    steps: [...]

  - name: save_file
    mount: [app, save_dialog]
    unmount: [save_dialog]
    steps: [...]
```

The editor is only mounted where it is used. The save dialog is unmounted after the save phase so its stale handle does not accumulate.

## Choosing the Right Tier

| Situation | Tier |
|---|---|
| Main application window, must exist for the entire workflow | `Root` |
| Secondary window that may not be open (dialog, file picker, progress panel) | `Session` |
| Persistent UI region within the main window (sidebar, toolbar, editor pane) | `Stable` |
| A specific element captured at runtime (a list item just created) | `Ephemeral` |

When in doubt between `Root` and `Session`: if the window disappearing mid-workflow should stop the workflow, use `Root`. If the workflow should handle its absence gracefully, use `Session`.

## Single Root vs. Multiple Anchors

Prefer fewer anchors. A single `Root` anchor covering the entire main window plus selectors for everything inside it is simpler than a hierarchy of `Stable` children — until the app rebuilds parts of its UI mid-workflow.

Add a `Stable` child anchor when:
- A subtree is referenced by many steps and the selector path to reach it is long
- The app can reload that subtree independently (a document panel that refreshes on save)
- You need to guarantee that steps in different phases all target the same element instance

Do not add a `Stable` anchor just to shorten a selector by one step. The complexity cost is real.

## Common Mistakes

**Anchoring too deep.** A `Stable` anchor pointing at a specific button is fragile — the button may not exist yet when the anchor is mounted. Anchor containers, not leaves. Use selectors for leaves.

**Using `Root` where `Session` fits.** If a window can disappear mid-workflow (a progress dialog, a file picker), it must be `Session`. A stale `Root` anchor is a fatal error — the workflow stops with no recovery path.

**Mounting everything in every phase.** Only mount the anchors a phase actually needs. Mounting an anchor that is not yet present will block the phase from starting.

**Forgetting `unmount` on Session and Stable anchors.** If a phase opens a dialog and a later phase closes it, unmount the dialog anchor at the close phase. Stale handles accumulate and slow resolution. Root anchors are exempt — they cannot be unmounted and persist for the entire workflow by design.
