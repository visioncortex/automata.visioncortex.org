---
title: Anchors
sidebar_label: Anchors
---

# Anchors

An anchor is a named, cached handle to a live UI element. Rather than re-querying the element tree on every step, you declare anchors once and the engine manages their lifetime — resolving them lazily and invalidating them when the UI changes.

## Declaration Syntax

Anchors are declared at the top level of the workflow file under `anchors:`. Each entry is a name and a definition:

```yaml
anchors:
  notepad:
    type: Root
    selector: "[name~=Notepad]"
  editor:
    type: Stable
    parent: notepad
    selector: ">> [role=edit][name='Text Editor']"
```

The name is used to reference the anchor everywhere else in the workflow: in `mount:`, `unmount:`, `scope:`, and `wait_for:`.

## Lifetime Tiers

The `type:` field sets the lifetime tier — how the engine resolves the handle and what happens when it goes stale.

| Tier | Resolved against | On stale |
|---|---|---|
| `Root` | Desktop application windows | Fatal error |
| `Session` | Desktop windows; may appear and disappear | Non-fatal; re-resolved on next use |
| `Stable` | Parent anchor's subtree | Re-queried automatically from nearest live ancestor |
| `Ephemeral` | Parent anchor's subtree | Stored via `Capture`; released when its phase exits |
| `Browser` | A running browser instance (Edge/Chrome) via CDP | Fatal error |
| `Tab` | A single browser tab within a `Browser` anchor | Re-resolved on next use |

`Root` is for the main application window. `Stable` is for panels, toolbars, and editors within it. `Session` is for transient windows like progress dialogs that may or may not be present. `Ephemeral` is for handles captured dynamically at runtime. `Browser` and `Tab` are for web browser automation — see [Browser Anchors](#browser-anchors) below.

## Mount and Unmount

`Stable`, `Session`, and `Ephemeral` anchors are activated per-phase via `mount:` and optionally released via `unmount:`.

```yaml
phases:
  - name: interact
    mount: [notepad, editor]
    unmount: [editor]
    steps:
      - ...
```

`mount:` activates anchors at the start of the phase. The engine resolves `Session` handles immediately; `Stable` handles are resolved on first use. `unmount:` releases specific handles at the end of the phase, even if steps fail.

**Root anchors are different.** A `Root` anchor is registered on its first `mount:` and held for the entire workflow. Subsequent `mount:` calls for the same Root anchor are no-ops. Root anchors **cannot be unmounted** — they remain live until the workflow ends or the window is destroyed. This means a Root anchor keeps working even if the window title changes during navigation, because it is locked to the original HWND.

## Using Anchors as Scope

Actions and conditions reference anchors by name via the `scope:` field. The engine resolves the selector relative to that anchor's cached element:

```yaml
action:
  type: Click
  scope: editor
  selector: ">> [role=button][name=Save]"
```

The selector `>> [role=button][name=Save]` is evaluated within the `editor` anchor's subtree, not the entire desktop.

## Browser Anchors

`Browser` and `Tab` are specialized anchor types for controlling a web browser. They connect via CDP (Chromium DevTools Protocol) and integrate with the UIA window for actions that require a real user gesture.

#### `Browser`

Represents a running browser instance. The engine connects to Edge via CDP on mount and holds the connection for the phase.

```yaml
anchors:
  edge:
    type: Browser
```

A `Browser` anchor is always a top-level anchor — it has no `parent`. It behaves like a `Root` anchor in that it is registered on first mount and held for the rest of the workflow. It also serves as the UIA scope for actions targeting the browser window itself (address bar, toolbar, Downloads panel).

#### `Tab`

Represents a single browser tab. A `Tab` anchor must have a `Browser` anchor as its `parent`.

```yaml
anchors:
  my_tab:
    type: Tab
    parent: edge
```

The engine tracks the tab by its CDP tab ID. Tab anchors are used as `scope` for `BrowserNavigate` actions and `TabWithAttribute` conditions. When the tab is navigated or reloaded, the anchor remains live — the engine follows the same tab.

#### Using Browser and Tab Together

Declare both anchors and mount the `Browser` anchor together with the `Tab` anchor in the phase that opens the page:

```yaml
anchors:
  edge:
    type: Browser
  my_tab:
    type: Tab
    parent: edge

phases:
  - name: navigate
    mount: [edge, my_tab]
    steps:
      - intent: navigate to the target page
        action:
          type: BrowserNavigate
          scope: my_tab
          url: "https://example.com"
        expect:
          type: TabWithAttribute
          scope: my_tab
          title:
            contains: "Example"
```

## Filtering by Process or PID

Root and Session anchors can be restricted to a specific process:

```yaml
anchors:
  my_app:
    type: Root
    process: myapp        # matches any window of myapp.exe
    selector: "*"
  pinned:
    type: Root
    pid: "{param.target_pid}"   # matches a specific known PID
    selector: "*"
```
