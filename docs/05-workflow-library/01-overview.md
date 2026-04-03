---
title: Workflow Library
sidebar_label: Overview
---

# Workflow Library

The workflow library is a collection of ready-to-use workflows for common Windows applications. Each workflow is a tested, parameterized YAML file you can call directly or compose into larger automations as a subflow.

## Cross-Toolkit Coverage

Windows applications are built on many different UI frameworks, and each one exposes its element tree differently through UIA. Writing reliable automation means knowing which quirks to expect.

The library covers applications across the full range of Windows UI toolkits:

| Toolkit | Examples | Notes |
|---|---|---|
| Win32 | Notepad (Win10), Explorer, Control Panel | Classic API; dialogs are real child windows; stable across versions |
| MFC | Mastercam | Dense, deeply nested UIA trees; large element counts; requires shadow DOM caching |
| WPF | Visual Studio, SQL Server Management Studio | Named `AutomationId` on most controls; virtualizing panels require `Invoke` for off-screen rows |
| Office | Word | Native Win32 with rich UIA automation IDs; ribbon modelled as tabs and groups |
| UWP | Windows Settings, Microsoft Store | Hosted by `ApplicationFrameHost.exe`; anchor by window title rather than process name |
| WinUI 3 | Win11 Notepad, Explorer | Direct process (no `ApplicationFrameHost`); tabbed interfaces; inline prompts instead of child dialogs |

The selector patterns, anchor strategies, and popup-handling techniques in each workflow reflect the actual behaviour of that toolkit — not a generic approach that happens to work most of the time.

## What the Library Solves

The hard problems in Windows automation are not the clicks and keystrokes. They are the edge cases:

- **Win10 vs Win11 divergence.** Notepad gained a tab bar in Win11. The unsaved-changes prompt is a real child dialog on Win10 but an inline element on Win11. The library ships separate workflows for each.
- **UWP hosting.** Store apps do not appear under their own process name — they are hosted by `ApplicationFrameHost.exe`. Anchoring by title rather than process is the correct pattern, and the library demonstrates it.
- **Dynamic dialogs.** Some apps show error dialogs at unexpected times. The library uses a layered recovery handler to dismiss it and continue, rather than treating it as a fatal failure.

## How the Library Is Organized

```
workflows/
  win10/
    notepad/
    explorer/
    windows_settings/
  win11/
    notepad/
    explorer/
    windows_settings/
  control_panel/
  office/
    word/
  browser/
  ..
```

OS-specific workflows (those that differ between Win10 and Win11) live under `win10/` and `win11/`. Application workflows that behave consistently across OS versions live at the top level.

## Using a Library Workflow

Run a workflow directly with the executor:

```
ui-automata \workflows\win11\notepad\notepad_demo.yml -- --text 'Hello'
```

Or call it as a subflow from your own workflow:

```yaml
phases:
  - name: search_store
    subflow: ../workflows/microsoft_store/microsoft_store_search.yml
    params:
      search_term: "{param.app_name}"
```

All library workflows declare their parameters and outputs explicitly, so the interface is self-documenting and linter-checkable.
