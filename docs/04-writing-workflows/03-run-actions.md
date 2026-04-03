---
title: Actions in Depth
sidebar_label: Actions in Depth
---

# Actions in Depth

Actions are the verbs of a workflow. Each step executes exactly one action and then waits for its `expect` condition. This page covers every action type with practical examples drawn from real workflows.

For a quick reference of all action types, see [Actions](/docs/core-concepts/actions).

## Mouse Actions

### `Click`

Left-clicks the centre of the matched element.

```yaml
- intent: click the Save button
  action:
    type: Click
    scope: toolbar
    selector: ">> [role=button][name=Save]"
  expect:
    type: DialogPresent
    scope: main_window
```

### `DoubleClick`

Double-clicks the element. Use for opening files, list items, or anything that requires a double-click to activate.

```yaml
- intent: open the Downloads folder
  action:
    type: DoubleClick
    scope: explorer
    selector: ">> [role=list item][name=Downloads]"
  expect:
    type: ElementFound
    scope: explorer
    selector: ">> [role=list item][name=Documents]"
```

### `Hover`

Moves the mouse to the element without clicking. Use to trigger hover menus, tooltips, or reveal hidden controls (such as close buttons on tabs).

```yaml
- intent: hover tab to reveal close button
  action:
    type: Hover
    scope: tab_list
    selector: "> [role='tab item']"
  expect:
    type: ElementFound
    scope: tab_list
    selector: "> [role='tab item'] > [role=button][name^=Close]"
```

### `ClickAt`

Clicks at a fractional position within the element's bounding box. `x_pct` and `y_pct` are 0.0–1.0. `kind` is one of `left`, `double`, `triple`, `right`, `middle`.

```yaml
- intent: right-click the top-left of the canvas
  action:
    type: ClickAt
    scope: canvas_panel
    selector: ">> [role=document]"
    x_pct: 0.1
    y_pct: 0.1
    kind: right
```

Use `triple` to select all text in an edit field when `SetValue` is not an option:

```yaml
- intent: select all text and replace
  action:
    type: ClickAt
    scope: dialog
    selector: ">> [role=edit][name=Filename]"
    x_pct: 0.5
    y_pct: 0.5
    kind: triple
```

### `ScrollIntoView`

Scrolls ancestor containers until the element is within their visible viewport, then stops. Sends wheel events to each scrollable ancestor.

```yaml
- intent: scroll to the Advanced section
  action:
    type: ScrollIntoView
    scope: settings_panel
    selector: ">> [role=group][name=Advanced]"
  expect:
    type: ElementVisible
    scope: settings_panel
    selector: ">> [role=group][name=Advanced]"
```

:::caution
Do not use `ScrollIntoView` for items in WinUI / UWP scrollable lists — wheel events trigger elastic scroll and the list snaps back. Use `Invoke` instead.
:::

## Keyboard Actions

### `TypeText`

Types a string into the focused element. The text is sent as keystrokes. Supports `{param.*}` and `{output.*}` substitution.

```yaml
- intent: type the search term
  action:
    type: TypeText
    scope: search_bar
    selector: ">> [role=edit]"
    text: "{param.search_term}"
  expect:
    type: ElementHasText
    scope: search_bar
    selector: ">> [role=edit]"
    pattern:
      contains: "{param.search_term}"
```

`TypeText` appends to whatever is already in the field. To replace existing content, use `SetValue` instead.

### `PressKey`

Sends a key or key chord. Accepts virtual key names and modifier combinations.

```yaml
- intent: confirm with Enter
  action:
    type: PressKey
    scope: main_window
    selector: "*"
    key: "{ENTER}"
  expect:
    type: DialogAbsent
    scope: main_window
```

Common keys: `{ENTER}`, `{TAB}`, `{ESC}`, `{BACKSPACE}`, `{DELETE}`, `{F5}`, `{UP}`, `{DOWN}`, `{HOME}`, `{END}`

Modifier combinations: `{CTRL+A}`, `{CTRL+S}`, `{CTRL+Z}`, `{ALT+F4}`, `{SHIFT+TAB}`

## Value Actions

### `SetValue`

Sets the value of an edit field or combo box directly via UIA's `ValuePattern`, without simulating keystrokes. Unlike `TypeText`, it replaces the entire content in one operation.

```yaml
- intent: set the output path
  action:
    type: SetValue
    scope: save_dialog
    selector: ">> [role=edit][name='File name:']"
    value: "{output.full_path}"
  expect:
    type: ElementHasText
    scope: save_dialog
    selector: ">> [role=edit][name='File name:']"
    pattern:
      contains: "{output.full_path}"
```

Prefer `SetValue` over `TypeText` when you need to replace an existing value, or when the field processes each keystroke individually (e.g. search fields with live filtering).

## UIA Pattern Actions

### `Invoke`

Calls UIA's `IInvokePattern::Invoke()` on the element directly — no mouse click, no bounding rect required.

Use `Invoke` instead of `Click` for elements that are scrolled out of view. Off-screen elements in virtualised lists report a degenerate bounding box of `(0, 0, 1, 1)`, which causes `Click` to fire at the wrong screen position. `Invoke` bypasses the bounding box entirely.

```yaml
- intent: navigate to About page
  action:
    type: Invoke
    scope: settings
    selector: ">> [id=SettingsPageAbout_New]"
  expect:
    type: ElementFound
    scope: settings
    selector: ">> [name=Device Specifications]"
```

`Invoke` falls back to `Click` when the element does not support `InvokePattern`.

### `Focus`

Gives keyboard focus to the element without clicking or invoking it.

```yaml
- intent: focus the search field
  action:
    type: Focus
    scope: toolbar
    selector: ">> [role=edit][name=Search]"
  expect:
    type: Always
```

## Window Actions

### `ActivateWindow`

Brings the anchor's window to the foreground and restores it if minimized. Use this when a workflow needs to interact with a window that may have lost focus.

```yaml
- intent: bring editor back to foreground
  action:
    type: ActivateWindow
    scope: editor_window
  expect:
    type: WindowWithState
    anchor: editor_window
    state: active
```

### `MinimizeWindow`

Minimizes the anchor's window.

```yaml
- intent: minimize the file picker
  action:
    type: MinimizeWindow
    scope: file_picker
  expect:
    type: Always
```

### `CloseWindow`

Closes the anchor's window via its close button (sends `WM_CLOSE`). If closing triggers an unsaved-changes dialog, the dialog appears and the next step handles it.

```yaml
- intent: close Notepad (triggers unsaved-changes dialog)
  action:
    type: CloseWindow
    scope: notepad
  expect:
    type: DialogPresent
    scope: notepad
```

## Dialog Helpers

### `DismissDialog`

Finds the first dialog child of the scope window and closes it. A shortcut for the common "close whatever dialog is open" case.

```yaml
- intent: dismiss any open dialog
  action:
    type: DismissDialog
    scope: main_window
  expect:
    type: DialogAbsent
    scope: main_window
```

### `ClickForegroundButton`

Clicks a button by name in the current OS foreground window. Useful in recovery handlers where an unexpected dialog has stolen focus and you do not know its anchor.

```yaml
actions:
  - type: ClickForegroundButton
    name: OK
```

### `ClickForeground`

Like `ClickForegroundButton` but matches any element type, not just buttons.

## Data Actions

### `Extract`

Reads an attribute from a matched element and stores it under a key. See [Extracting Data](../extracting-data) for full details.

```yaml
- intent: read the current font size
  action:
    type: Extract
    key: font_size
    scope: font_panel
    selector: ">> [role='combo box'][name='Size'] > [role=edit]"
    attribute: text
  expect:
    type: EvalCondition
    expr: "output.font_size != ''"
```

### `Eval`

Computes an expression and stores the result. Supports arithmetic, string concatenation, comparisons, and built-in functions (`split_lines`, `round`, `floor`, `ceil`, `min`, `max`, `trim`, `len`).

```yaml
- intent: compute next font size cycling from 12 to 36
  action:
    type: Eval
    key: new_size
    expr: "(font_size + 8) % 24 + 12"
  expect:
    type: Always
```

Use the optional `output:` field to also push the result into the workflow output buffer (for use in subflow outputs or later `{output.*}` substitutions):

```yaml
- intent: build and publish the output path
  action:
    type: Eval
    key: full_path
    expr: "param.output_dir + output.filename"
    output: full_path
  expect:
    type: Always
```

### `WriteOutput`

Writes all values stored under a key in the output buffer to a file, one CSV-quoted line each. Creates or truncates the file. `path` supports `{output.*}` substitution.

```yaml
- intent: save extracted rows to CSV
  action:
    type: WriteOutput
    key: rows
    path: "{param.output_dir}\\results.csv"
  expect:
    type: FileExists
    path: "{param.output_dir}\\results.csv"
```

## System Actions

### `Exec`

Runs an external process and waits for it to exit. Resolves `command` via PATH. If `key` is set, stdout is captured line-by-line into that output key.

```yaml
- intent: run the post-processing script
  action:
    type: Exec
    command: python
    args:
      - "{workflow.dir}\\process.py"
      - "--input"
      - "{output.export_path}"
  expect:
    type: ExecSucceeded
```

### `MoveFile`

Moves or renames a file. Creates the destination directory if needed. Fails if the destination already exists.

```yaml
- intent: move the exported file to the archive folder
  action:
    type: MoveFile
    source: "{output.export_path}"
    destination: "{param.archive_dir}\\{output.filename}"
  expect:
    type: FileExists
    path: "{param.archive_dir}\\{output.filename}"
```

## Flow Actions

### `NoOp`

Performs no action but still evaluates its `expect` condition. Use it to wait for a state without touching the UI.

```yaml
- intent: wait for the progress dialog to disappear
  action:
    type: NoOp
  expect:
    type: DialogAbsent
    scope: main_window
  timeout: 60s
```

### `Sleep`

Pauses for a fixed duration before the `expect` condition is evaluated. Use sparingly — prefer polling with `NoOp` whenever the wait duration is unpredictable.

```yaml
- intent: wait for tooltip to appear after hover
  action:
    type: Sleep
    duration: 300ms
  expect:
    type: ElementFound
    scope: main_window
    selector: ">> [role=tooltip]"
```

## `run_actions`: Trying Actions Interactively

The `run_actions` MCP tool lets an agent execute a sequence of steps against a live window without creating a workflow file. It is the fastest way to test a selector, verify an action works, or prototype a phase before committing it to YAML.

All the same action types are available. The agent specifies the target window (by hwnd, title, process, or PID) and a list of steps in the same format as a workflow phase.
