---
title: Anchors
sidebar_label: Anchors
---

# Anchors

An anchor is a named, cached handle to a live UI element. Rather than re-querying the element tree on every step, you declare anchors once and the engine manages their lifetime: resolving them lazily, checking them on each use, and re-resolving them automatically when they go stale.

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

The name is used to reference the anchor everywhere else in the workflow: in `mount:`, `scope:`, and condition fields.

## Anchor Types

The `type:` field sets the lifetime tier: how the engine first finds the element, and what happens when it goes stale.

| Tier | Resolved against | On stale |
|---|---|---|
| `Root` | Desktop application windows | Fatal error |
| `Session` | Desktop windows; may appear and disappear | Re-resolved on next use |
| `Stable` | Parent anchor's subtree | Re-queried automatically from nearest live ancestor |
| `Ephemeral` | Parent anchor's subtree | Released at phase exit |
| `Browser` | A running browser instance (Edge/Chrome) via CDP | Fatal error |
| `Tab` | A single browser tab within a `Browser` anchor | Re-resolved on next use |

### What "Stale" Means

Every time an anchor is accessed, the engine performs a liveness check on the cached handle. A handle is stale when either:

- `is_visible()` returns an error: the underlying COM object no longer refers to a live element (window destroyed, app rebuilt its UI tree)
- `has_parent()` returns false: the element exists in the accessibility tree but is detached from it (common in virtualized lists)

If the handle is live, it is returned immediately with no further work. If stale, the engine invalidates the cache and re-resolves.

## Root Anchors and HWND Locking

`Root` is the tier for your main application window. When a Root anchor is first resolved, the engine locks the exact window handle (HWND) and process ID. All subsequent resolutions (including after staleness) find the window by that exact HWND, not by re-running the selector.

This has an important consequence: a Root anchor survives window title changes, theme switches, and other changes that would cause a re-query to land on the wrong window. The anchor always refers to the same window it was first mounted on, for the life of the workflow.

If the locked HWND no longer exists (the application was closed), re-resolution fails and the workflow terminates with an error.

Root anchors are resolved **eagerly at mount time**. If the window is not found when the phase starts, the mount retries until the phase timeout expires.

## Session Anchors

`Session` is the tier for transient windows that may or may not be present (dialogs, progress windows, secondary panels). Like Root anchors, Session anchors are resolved lazily and HWND-locked on first resolution. Unlike Root, a stale Session anchor is not fatal.

When a Session anchor goes stale, the engine invalidates it **and all of its Stable descendants** in one sweep. This cascade means you never end up with a Stable child holding a live handle that points into a closed dialog. Everything starts fresh on next use.

## Stable Anchors

`Stable` is the tier for elements inside a Root or Session window: toolbars, panels, editors, list items. Stable anchors are resolved **lazily on first use**, not at mount time.

A toolbar is a good example. It exists for the lifetime of its parent window, its UIA handle does not change between steps, and it contains many buttons you will interact with repeatedly. Declaring it as a Stable anchor gives you two things:

1. **Precision**: subsequent selectors scope to the toolbar's subtree, not the entire window. `>> [name=Save]` finds the Save button inside the toolbar, not any element named Save anywhere in the application.
2. **Speed**: the toolbar handle is cached after the first resolution. Every subsequent step that uses the toolbar as `scope` skips the full-window traversal and searches only within the already-located subtree.

On staleness, the engine does not immediately fall back to a full DFS from the root. It first checks whether the cached step-parent (the element one level above the matched node in the tree) is still live. If it is, the engine re-runs only the final step of the selector from that narrower starting point, a much cheaper search. Only if the step-parent is also stale does it fall back to a full traversal from the anchor root.

## Ephemeral Anchors

`Ephemeral` is for handles you discover at runtime rather than declare statically. The classic case is a row that was just created by an action: you do not know its selector in advance, so you capture the element after it appears and give it a name for use in subsequent steps. Ephemeral anchors are released at the end of the workflow, or at the end of the sub-workflow that created them.

## Mount and Unmount

Anchors are activated per-phase via `mount:`. Only anchors that are listed in a phase's `mount:` are available for that phase.

```yaml
phases:
  - name: interact
    mount: [notepad, editor]
    steps:
      - ...
```

`Root` and `Browser` anchors are resolved immediately when mounted. `Session`, `Stable`, and `Ephemeral` anchors are resolved on first use.

`unmount:` explicitly releases `Stable` and `Ephemeral` anchors at the end of the phase, even if steps fail. `Root`, `Session`, and `Browser` anchors **cannot be unmounted**: they are shared across the entire workflow and held until the workflow ends or the window is destroyed. Attempting to unmount them is silently ignored.

```yaml
phases:
  - name: interact
    mount: [notepad, editor]
    unmount: [editor]
    steps:
      - ...
```

An anchor that is mounted but not explicitly unmounted is released automatically when the workflow depth that introduced it exits.

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

`Browser` and `Tab` are specialized anchor types for controlling a web browser via CDP (Chromium DevTools Protocol).

### `Browser`

Represents a running Edge instance. On mount, the engine starts the browser with a CDP debug port (or attaches to an existing one) and locks the HWND of the browser window. Like a `Root` anchor, it is held for the entire workflow and cannot be unmounted.

The `Browser` anchor serves two roles: it is the CDP connection for browser actions, and it is the UIA scope for actions targeting the browser's own UI: the address bar, toolbar, and Downloads panel.

```yaml
anchors:
  edge:
    type: Browser
```

### `Tab`

Represents a single browser tab. A `Tab` anchor must declare a `Browser` anchor as its `parent`.

```yaml
anchors:
  git_tab:
    type: Tab
    parent: edge
```

The engine's behaviour at mount depends on the selector:

- **No selector (or wildcard)**: Opens a new tab. The tab is **closed automatically** when the anchor is unmounted or the workflow ends.
- **A real selector**: Polls the browser's open tabs until one matches (up to 30 seconds). The tab is **left open** on unmount (the anchor attached to an existing tab, not created it).

When used as `scope` for UIA actions (like `Invoke` or `Click`), a Tab anchor resolves to the parent Browser window. When used as `scope` for CDP actions (`BrowserNavigate`, `BrowserEval`, `TabWithAttribute`), it targets the tab directly.

#### Using Browser and Tab Together

Mount both in the phase that opens the page:

```yaml
anchors:
  edge:
    type: Browser
  git_tab:
    type: Tab
    parent: edge

phases:
  - name: navigate
    mount: [edge, git_tab]
    steps:
      - intent: navigate to the target page
        action:
          type: BrowserNavigate
          scope: git_tab
          url: "https://example.com"
        expect:
          type: TabWithAttribute
          scope: git_tab
          title:
            contains: "Example"
```

After mounting, subsequent phases can use `edge` and `git_tab` as scope without re-mounting.

## Filtering by Process or PID

Root and Session anchors can be restricted to a specific process. This filter is applied only at first resolution; afterwards the anchor is HWND-locked.

```yaml
anchors:
  my_app:
    type: Root
    process: myapp              # matches any window of myapp.exe
    selector: "*"
  pinned:
    type: Root
    pid: "{param.target_pid}"   # matches a specific known PID
    selector: "*"
```
