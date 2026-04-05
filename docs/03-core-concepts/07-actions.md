---
title: Actions
sidebar_label: Actions
---

# Actions

An action is what a step does. Actions range from basic UI interactions like clicking and typing, to reading values out of the UI, to running external scripts. Every action is paired with an `expect` condition that must be satisfied before the workflow continues.

## Interaction Actions

### Click

Sends a mouse click to the element matched by `selector` within `scope`.

### DoubleClick

Sends a double-click to the matched element. Same fields as `Click`.

### ClickAt

Clicks at a fractional position within the element's bounding box. Useful for canvas controls, sliders, or any element where the click target matters.

| Field | Description |
|---|---|
| `x_pct` | Horizontal position as a fraction of element width (0.0 = left edge, 1.0 = right edge) |
| `y_pct` | Vertical position as a fraction of element height (0.0 = top edge, 1.0 = bottom edge) |
| `kind` | Mouse button: `Left` (default), `Right`, or `Middle` |

```yaml
- intent: click the centre of the canvas
  action:
    type: ClickAt
    scope: main_window
    selector: ">> [name=Canvas]"
    x_pct: 0.5
    y_pct: 0.5
  expect:
    type: Always
```

### TypeText

Types a string into the focused element. Supports `{param.*}` and `{output.*}` substitution in the `text` field.

### SetValue

Sets the value of an element directly via UIA's `ValuePattern`, without simulating keystrokes. Useful for edit fields where `TypeText` would append rather than replace.

### PressKey

Sends a key or key chord. Accepts virtual key names (`{ENTER}`, `{TAB}`, `{F5}`) and modifier combinations (`{CTRL+A}`, `{ALT+F4}`).

### Invoke

Calls UIA's `IInvokePattern::Invoke()` on the matched element (no mouse click, no bounding rect required). Use this instead of `Click` for elements that are scrolled out of view, which report a degenerate bounding box of `(0, 0, 1, 1)` and will cause `Click` to fail.

```yaml
- intent: navigate to About
  action:
    type: Invoke
    scope: settings
    selector: ">> [id=SettingsPageAbout_New]"
  expect:
    type: ElementFound
    scope: settings
    selector: ">> [name=Device Specifications]"
```

:::caution
Do not use `ScrollIntoView` for items in WinUI / UWP scrollable lists: it uses mouse-wheel events that trigger elastic scroll and the list snaps back. Use `Invoke` instead.
:::

### DismissDialog

Finds the first modal dialog child of the `scope` window and dismisses it by sending `WM_CLOSE`. Use this as a lighter alternative to locating and clicking a specific button when the dialog content varies.

### ActivateWindow

Brings a window to the foreground and gives it focus. Accepts a `scope` anchor. Use this when a workflow needs to interact with a window that may not be in the foreground.

## Data Actions

### Extract

Reads an attribute from one or more matched elements and stores it in an output variable. By default the first match is stored as a scalar. Set `multiple: true` to collect all matches into a list.

### Eval

Computes an expression and stores the result in an output variable. See [Expressions](../expressions) for the full syntax.

## System Actions

### Exec

Runs an external process. `command` is resolved via `PATH`; `args` are passed as a list. If `key` is set, stdout is captured line-by-line into that output variable. See [Running External Scripts](../04-writing-workflows/11-running-scripts.md) for full usage.

### Sleep

Pauses execution for a fixed `duration`. Useful after a `Hover` action to wait for a tooltip to appear before reading it.

## File Actions

### MoveFile

Moves or renames a file. Supports `{output.*}` and `{param.*}` substitution in both `source` and `destination`.

### WriteFile

Writes a string to a file, creating it if it does not exist.

### WriteOutput

Writes all values stored under `key` in the output buffer to a file, one CSV-quoted value per line. The file is created or truncated. `path` supports `{output.*}` substitution.

## Browser Actions

### BrowserNavigate

Navigates a browser tab to a URL. Requires a `Tab` anchor as `scope`.

```yaml
- intent: navigate to gitforwindows.org
  action:
    type: BrowserNavigate
    scope: git_tab
    url: "https://gitforwindows.org"
  expect:
    type: TabWithAttribute
    scope: git_tab
    title:
      contains: "Git for Windows"
  timeout: 30s
```

`BrowserNavigate` blocks until `document.readyState === 'complete'` before returning, so the page is fully loaded before the `expect` condition is evaluated. Use `TabWithAttribute` to additionally confirm the tab title matches the expected page, as a guard against redirects or error pages.

### BrowserEval

Evaluates a JavaScript expression in a browser tab and stores the result in an output variable under `key`. Use this to read page content, extract computed values, or check dynamic state that is not exposed through the DOM tree.

```yaml
- intent: read the download link href
  action:
    type: BrowserEval
    scope: git_tab
    key: download_url
    expr: "document.querySelector('a#download').href"
  expect:
    type: Always
```

The result is stored as a string. If the expression returns `null` or `undefined`, the key is set to an empty string.

## The NoOp Action

`NoOp` performs no action but still evaluates its `expect` condition. Use it to wait for a state to become true without doing anything:

```yaml
- intent: wait for the dialog to disappear
  action:
    type: NoOp
  expect:
    type: DialogAbsent
    scope: main_window
  timeout: 15s
```
