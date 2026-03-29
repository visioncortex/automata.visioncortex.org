---
title: Microsoft Office
sidebar_label: Office
---

# Microsoft Office

Office applications (Word, Excel, PowerPoint) are native Win32/C++ applications with a custom UI framework that predates .NET. What makes them interesting for automation is that they expose unusually rich UIA automation IDs — `FontSize`, `TabHome`, `BackstageView` — on most interactive controls. This gives you stable, locale-independent selectors that survive version updates, which is the best-case scenario for any automation target.

The key pattern: **use `id` selectors wherever possible.** Office exposes rich automation IDs (`FontSize`, `TabHome`, `BackstageView`) that survive version updates and locale changes. Name-based selectors are a fallback for elements without IDs.

## `hello_word`

A smoke test that exercises the core Word interaction pattern end-to-end: launch, create a document, type text, change formatting via the ribbon, and close without saving.

What it does:
1. Launches Word and opens a blank document from the Backstage view
2. Types `"hello word!"` into the page editor
3. Reveals the Home ribbon if it is collapsed (uses a `precondition` to skip this if already expanded)
4. Sets font size to 48 via the `FontSize` control
5. Closes the window and clicks **Don't Save**

Notable patterns:

- **Backstage navigation via `Invoke`** — the Backstage view items respond to `Invoke` without needing a bounding rect, which avoids click-position issues on the startup screen.
- **Ribbon reveal with `precondition`** — the phase that clicks the Home tab only runs if `[id=FontSize]` is not already visible. No separate version-detection logic needed.
- **Font size by `id`** — `[id=FontSize] > [role=Edit Box]` is stable across Word versions and locales. `SetValue` + `PressKey {ENTER}` is the reliable pattern for combo-box-style inputs.
- **"Don't Save" dialog** — Word's save prompt uses `[name^=Don][name$=Save]` to handle both ASCII and Unicode apostrophe variants, the same pattern as Notepad.
