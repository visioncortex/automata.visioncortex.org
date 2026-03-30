---
title: Writing Robust Selectors
sidebar_label: Writing Selectors
---

# Writing Robust Selectors

A selector that works today can silently stop working after an application update, a locale change, or an OS upgrade. This page covers the practical craft of writing selectors that are precise, stable, and debuggable.

For selector syntax, see [Selectors](../03-core-concepts/06-selectors.md).

## Property Stability: What to Trust

Not all UIA properties are equally stable. Knowing which ones to prefer changes how you write selectors.

| Property | Stability | Notes |
|---|---|---|
| `id` (AutomationId) | Highest | Set by the developer, survives localization and theming. Use when present. |
| `role` | High | Determined by control type, not appearance. Rarely changes. |
| `name` (exact) | Medium | Can change with localization, or when the UI adds a suffix (e.g. unsaved indicator) |
| `name` (partial `~=`) | Medium-high | Survives dynamic suffixes; still breaks on full renames |
| Position (`:nth`) | Low | Breaks if items are inserted or removed upstream |

**When `id` is present, use it.** A single `[id=SettingsPageAbout_New]` is more reliable than any combination of role and name predicates, and survives the application being translated into another language.

**When `id` is absent, combine role and name.** Role alone matches too broadly; name alone may match non-interactive elements or the wrong element type. Together they are usually unambiguous.

## Exact vs. Partial Matching

Use `=` when the name is fully known and stable. Use partial matching when the name includes dynamic content.

**Window titles change.** Notepad adds the filename and an unsaved indicator to its title. `[name=Notepad]` will not match `report.txt - Notepad`. Use `~=` instead:

```
[name~=Notepad]
```

**Field labels sometimes include a colon or trailing space.** The File name field in a Save As dialog is often `"File name:"` with the colon. Match it exactly:

```
[name='File name:']
```

**Unicode apostrophes break exact matches.** Windows applications increasingly use typographic apostrophes (`U+2019`) rather than ASCII (`U+0027`). Instead of quoting the full name, pin both ends:

```
>> [role=button][name^=Don][name$=Save]
```

This matches "Don't Save" regardless of which apostrophe character is used.

## When to Use `:nth` — and When Not To

`:nth` is the selector of last resort. It works when it works, but it is the most fragile property you can select on — if any sibling is added, removed, or reordered, the index shifts and you match the wrong element or nothing.

**Use `:nth` only when elements are structurally identical with no distinguishing name or id.** For example, a fixed layout where the third toolbar group is always the one you want:

```
>> [role=tool bar] > [role=group]:nth(2)
```

**Avoid `:nth` for list items, tree nodes, or anything that can be filtered or reordered.** If the list can change between runs, `:nth` will be wrong. Use name or id instead.

**When `:nth` is unavoidable, document why.** Add a comment in the workflow YAML explaining what position 2 represents and why it cannot be identified by name.

## Handling Unlabelled Containers

Many applications have structural containers with no name and no AutomationId — panes, groups, panels used purely for layout. If you need to anchor on one of them, identify it through a child it reliably contains.

```
>> [role=button][name=Settings]:parent
```

Finds the Settings button, then returns its parent container. This is more stable than a positional path because it depends on the Settings button existing, not on the container's position in the tree.

For deeper navigation:

```
>> [role=text][name=Status]:ancestor(2)
```

Goes two levels up from the Status label to reach the row container. Combined with a subsequent selector step, this lets you reach siblings of the row:

```
>> [role=text][name=Status]:parent > [role=button]:nth(0)
```

## Handling Localization

If the workflow may run against a localized version of the application, name-based selectors can break. The mitigations in order of preference:

1. **Use `id` instead of `name`.** AutomationIds are not localized. `[id=btnSave]` works in every locale.
2. **Use role alone when the element is unique in context.** If there is only one `[role=edit]` in the dialog, name is redundant.
3. **Use partial matching for known-stable fragments.** If the button name is always "Save" regardless of locale (English apps often are), `[name=Save]` is fine.
4. **Use OR values for known variants.** If you know the two locales the workflow runs on:
   ```
   [name=Save|Speichern|Enregistrer]
   ```

## Debugging a Selector That Does Not Match

When a step fails because the selector matched nothing, work through this in order:

**1. Verify the anchor is live.** If the `scope` anchor itself failed to resolve, no selector under it will match. Check that the anchor's window is open and the anchor is mounted in this phase.

**2. Dump the element tree.** Run `element-tree <hwnd>` or `desktop element_tree` to see the actual tree. Compare the role and name values in the tree to what the selector expects. The most common issue: the name has a trailing space, a colon, or a Unicode character the selector does not account for.

**3. Test the selector live.** Use `desktop find_elements` to run the selector against the window and see exactly what it matches (including the ancestor chain). Narrow or broaden predicates until it matches exactly one element.

**4. Check for hosted child windows.** Elements with `role=window` in the ancestor chain are hosted child windows (WebView, Win32-in-WPF, ActiveX). Their descendants are reachable via `>>`, but the `role=window` node itself cannot be used as a selector target. If the element tree shows a `role=window` above your target, start the selector from the root anchor and traverse through it with `>>`.

**5. Check for virtual lists.** Elements in a virtualised list may not exist in the UIA tree until they are scrolled into view. Use `Invoke` to activate them — `Invoke` does not require a bounding rect and works on off-screen items. Avoid `Click` on virtualised list items; `Click` reads the bounding box and fires at the wrong position when the box is `(0,0,1,1)`.

## Building Up Selectors Iteratively

The most reliable workflow for writing a new selector:

1. Use `ui-inspector` to hover over the target and read its role, name, and id
2. Write the tightest single-step selector that uniquely identifies it: `[id=...]` if available, otherwise `[role=...][name=...]`
3. Test it with `desktop find_elements` — check that it returns exactly one match
4. If it returns multiple matches, add a combinator (`>>`) and a parent predicate to narrow the context
5. If it returns no matches, relax the name match from `=` to `~=`, or check the tree for the actual property values
