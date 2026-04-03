---
title: Actions
sidebar_label: Actions
---

# Actions

An action is what a step does. Actions range from basic UI interactions like clicking and typing, to reading values out of the UI, to running external scripts. Every action is paired with an `expect` condition that must be satisfied before the workflow continues.

## Interaction Actions

### Click

Sends a mouse click to the element matched by `selector` within `scope`.

### TypeText

Types a string into the focused element. Supports `{param.*}` and `{output.*}` substitution in the `text` field.

### SetValue

Sets the value of an element directly via UIA's `ValuePattern`, without simulating keystrokes. Useful for edit fields where `TypeText` would append rather than replace.

### PressKey

Sends a key or key chord. Accepts virtual key names (`{ENTER}`, `{TAB}`, `{F5}`) and modifier combinations (`{CTRL+A}`, `{ALT+F4}`).

### Invoke

Calls UIA's `IInvokePattern::Invoke()` on the matched element — no mouse click, no bounding rect required. Use this instead of `Click` for elements that are scrolled out of view, which report a degenerate bounding box of `(0, 0, 1, 1)` and will cause `Click` to fail.

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
Do not use `ScrollIntoView` for items in WinUI / UWP scrollable lists — it uses mouse-wheel events that trigger elastic scroll and the list snaps back. Use `Invoke` instead.
:::

### ActivateWindow

Brings a window to the foreground and gives it focus. Accepts a `scope` anchor. Use this when a workflow needs to interact with a window that may not be in the foreground.

## Data Actions

### Extract

Reads an attribute from one or more matched elements and stores it in an output variable.

### Eval

Computes an expression and stores the result in an output variable. See [Expressions](../expressions) for the full syntax.

### WriteOutput

Writes a value directly to an output key without computing an expression. Useful for capturing a multi-line result to a file or for publishing a final value at the end of a phase.

## System Actions

### Exec

Runs an external process. `command` is resolved via `PATH`; `args` are passed as a list. If `key` is set, stdout is captured line-by-line into that output variable. See [Running External Scripts](../04-writing-workflows/11-running-scripts.md) for full usage.

### MoveFile

Moves or renames a file. Supports `{output.*}` and `{param.*}` substitution in both `source` and `destination`.

### WriteFile

Writes a string to a file, creating it if it does not exist.

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

After navigation the engine continues evaluating the `expect` condition until the tab's title (or other attribute) matches. Use `TabWithAttribute` to confirm the page has loaded before proceeding.

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
