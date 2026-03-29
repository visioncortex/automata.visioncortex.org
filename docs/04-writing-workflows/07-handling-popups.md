---
title: Handling Popups and Dialogs
sidebar_label: Handling Popups
---

# Handling Popups and Dialogs

Popups and dialogs are the most common reason workflows fail. A save prompt appears when you did not expect one; a permission dialog captures focus mid-sequence; a warning blocks the next click. This page covers the patterns for handling each kind.

## Expected dialogs: inline handling

When a dialog is a known, predictable part of the workflow, handle it inline with a `Session` anchor. Mount it in the phase where it appears, interact with it, unmount it when done.

### The standard Save As dialog

The Windows common file dialog is the same across most Win32 applications. Declare it as a `Session` anchor under the main window:

```yaml
anchors:
  main_window:
    type: Root
    process: myapp
    selector: "*"

  save_dialog:
    type: Session
    selector: "[name='Save As']"
```

Then handle it in a phase:

```yaml
- name: save_file
  mount: [main_window, save_dialog]
  unmount: [save_dialog]
  steps:
    - intent: trigger Save As
      action:
        type: Click
        scope: main_window
        selector: ">> [role=menu item][name=Save]"
      expect:
        type: DialogPresent
        scope: main_window

    - intent: set the output filename
      action:
        type: SetValue
        scope: save_dialog
        selector: ">> [role='combo box'][name='File name:'] >> [role=edit]"
        value: "{param.save_as}"
      expect:
        type: ElementHasText
        scope: save_dialog
        selector: ">> [role='combo box'][name='File name:'] >> [role=edit]"
        pattern:
          contains: "{param.save_as}"

    - intent: click Save
      action:
        type: Click
        scope: save_dialog
        selector: ">> [role=button][name=Save]"
      expect:
        type: DialogAbsent
        scope: main_window
```

The filename selector `>> [role='combo box'][name='File name:'] >> [role=edit]` is safe across Win10 and Win11. On Win10 the inner `role=edit` has no accessible name — only the parent combo box is identifiable. On Win11 the edit gained its own name, but navigating through the named combo box parent still resolves correctly on both versions.

`unmount: [save_dialog]` releases the Session handle after the phase so it does not accumulate as a stale reference.

## Unsaved-changes prompts: Win10 vs Win11

The unsaved-changes prompt is a good example of how the same logical dialog looks completely different on different OS versions.

### Win10: real dialog

On Win10, closing a Notepad window with unsaved changes produces a child dialog window — a separate OS-level dialog attached to the Notepad process. `DialogPresent` detects it, and the button lives inside the dialog subtree:

```yaml
- name: close_notepad
  steps:
    - intent: close the window
      action:
        type: CloseWindow
        scope: notepad
      expect:
        type: DialogPresent
        scope: notepad

    - intent: click Don't Save
      action:
        type: Click
        scope: notepad
        selector: ">> [role=button][name^=Don][name$=Save]"
      expect:
        type: WindowClosed
        anchor: notepad
```

### Win11: embedded prompt

On Win11, Notepad has a tabbed interface. The unsaved-changes prompt is not a child dialog — it is rendered inline within the window itself after the tab's close button is clicked. `DialogPresent` does not fire. Instead, the Save/Don't Save buttons appear directly in the window's element tree:

```yaml
- name: close_notepad
  mount: [tab_list]
  steps:
    - intent: hover tab to reveal its close button
      action:
        type: Hover
        scope: tab_list
        selector: "> [role='tab item']"
      expect:
        type: ElementFound
        scope: tab_list
        selector: "> [role='tab item'] > [role=button][name^=Close]"

    - intent: click the tab close button
      action:
        type: Click
        scope: tab_list
        selector: "> [role='tab item'] > [role=button][name^=Close]"
      expect:
        type: ElementFound
        scope: notepad
        # The Save/Don't Save buttons appear under [role=window][title=Notepad]
        selector: ">> [role=button][name=Save]"

    - intent: click Don't Save
      action:
        type: Click
        scope: notepad
        selector: ">> [role=button][name^=Don][name$=Save]"
      expect:
        type: WindowClosed
        anchor: notepad
```

The `[name^=Don][name$=Save]` selector handles both `Don't Save` (ASCII apostrophe) and `Don't Save` (Unicode right quote) without quoting the character.

## Unexpected dialogs: recovery handlers

When a dialog can appear at any point — an error popup, a license warning, a background process notification — handling it inline would require adding a precondition to every step. Recovery handlers are the right tool.

### Dismissing a known dialog type

Use `DialogPresent` as the trigger to detect any child dialog on the main window, then click the expected dismissal button:

```yaml
recovery_handlers:
  dismiss_dont_save:
    trigger:
      type: DialogPresent
      scope: main_window
    actions:
      - type: Click
        scope: main_window
        selector: ">> [role=button][name^=Don][name$=Save]"
    resume: retry_step
```

### Generic catch-all: `ForegroundIsDialog`

When you do not know what dialog might appear — or the dialog is application-specific and varies by version — use `ForegroundIsDialog`. It fires whenever the OS foreground window is a dialog, regardless of which anchor it belongs to. Combined with `ClickForegroundButton`, it dismisses whatever dialog stole focus:

```yaml
recovery_handlers:
  dismiss_ok:
    trigger:
      type: ForegroundIsDialog
      scope: main_window
    actions:
      - type: ClickForegroundButton
        name: OK
    resume: retry_step
```

`ClickForegroundButton` clicks the button named `OK` in the current foreground window — it does not need a scope or selector, so it works even when the dialog is outside the anchor hierarchy.

Enable this handler on phases where unexpected dialogs are likely:

```yaml
phases:
  - name: long_running_operation
    mount: [main_window]
    recovery:
      handlers: [dismiss_ok]
      limit: 5
    steps:
      - ...
```

### Layering multiple handlers

Handlers are checked in order. Put the most specific handler first:

```yaml
recovery_handlers:
  dismiss_errors_dialog:
    trigger:
      type: ElementFound
      scope: main_window
      selector: "> [role=dialog][name='Errors or Warnings']"
    actions:
      - type: Click
        scope: main_window
        selector: "> [role=dialog][name='Errors or Warnings'] >> [role=button][name=OK]"
    resume: retry_step

  dismiss_ok:
    trigger:
      type: ForegroundIsDialog
      scope: main_window
    actions:
      - type: ClickForegroundButton
        name: OK
    resume: retry_step
```

The specific `Errors or Warnings` handler fires first when that particular dialog is present. The generic `dismiss_ok` catches anything else. If neither handler's trigger matches, the step fails normally.

## Dialogs that should abort the workflow

Not every dialog is safe to dismiss. A fatal error dialog, a data-loss warning, or an authentication prompt that should never appear during automation — these should fail the workflow explicitly rather than being silently dismissed.

Use `resume: fail` on a handler whose trigger identifies the bad state:

```yaml
recovery_handlers:
  fatal_error:
    trigger:
      type: ElementFound
      scope: main_window
      selector: "> [role=dialog][name='Fatal Error']"
    actions: []
    resume: fail
```

With an empty `actions` list and `resume: fail`, the handler fires, does nothing, and immediately propagates the error — giving you a clear failure message that identifies the dialog rather than a generic timeout.
