---
title: Selectors
sidebar_label: Selectors
---

# Selectors

The Windows UI Automation element tree is messy. A typical application window contains hundreds of elements: nested panels, unlabelled containers, toolbars with identical-looking buttons, lists where every row has the same role and no name. Individual elements often carry only partial information (a role but no name, a name but the wrong role, an AutomationId in one OS version but not another).

No single property is reliably enough on its own to pinpoint the exact element you need. Selectors exist to let you combine every available signal (role, name, AutomationId, structural position, parent context, tree depth) into a precise, unambiguous address.

If you have written CSS before, the syntax will feel familiar, and intentionally so. CSS invented the ideas of `#id`, `.class`, `>` child, and `>>` descendant combinators as a way to pinpoint elements in a tree. This selector language borrows the same vocabulary, applied to the Windows UI Automation tree instead of the DOM.

## Semantic Properties, Not Visual Ones

Selectors operate on Windows UI Automation properties (the accessibility layer baked into Windows). This is a critical design choice. UIA properties are stable:

- **Role** (`button`, `edit`, `list item`) is determined by the control type, not its appearance
- **Name** is the accessible name (what a screen reader would announce); *usually* matches the on-screen text
- **AutomationId** is a developer-assigned identifier that survives localization and theming

A pixel-coordinate-based tool breaks when the window moves or the DPI changes. A selector-based tool does not: the element is the same element regardless of where it is rendered on screen.

| Attribute | UIA property |
|---|---|
| `role` | Control type / accessibility role |
| `name` | Accessible name |
| `title` | Alias for `name` on Window elements |
| `id` | UIA AutomationId |

## Compound Predicates

### AND Logic

A step can chain multiple predicates. All must match.

```python
[role=button][name=Save]
```

Role is `button` AND name is exactly `Save`. One predicate leaves ambiguity; two predicates eliminate it. A dialog with three buttons only has one named Save.

A bare word before the brackets is shorthand for `[role=...]`:

```
Button[name=Open]
```

is equivalent to `[role=button][name=Open]`.

### OR Values

The same UI element can have different role strings across Windows versions or application updates. OR values let one selector match both:

```python
[role=button|menu item]     # matches either role
[name=OK|Yes]               # matches either button name
[name~=Editor|Designer]     # name contains "Editor" OR "Designer"
```

This is precision in the other direction: instead of over-specifying and breaking on variation, you enumerate exactly the valid alternatives.

## Match Operators

Different situations call for different levels of specificity.

| Operator | Meaning |
|---|---|
| `=` | Exact match |
| `~=` | Contains (case-insensitive) |
| `^=` | Starts with (case-insensitive) |
| `$=` | Ends with (case-insensitive) |

Use `=` when the name is stable and fully known. Use `~=` when the name includes a dynamic suffix (e.g., a document title with an unsaved-changes indicator). Use `^=` and `$=` together to pin both ends without quoting characters that vary across OS versions:

```python
>> [role=button][name^=Don][name$=Save]
```

Matches "Don't Save" whether the apostrophe is `U+0027` or `U+2019` (right single quotation mark, common in newer Windows versions).

## Combinators: Structural Context

A selector describes not just *what* an element is, but *where* it lives in the tree. This structural context is often what makes a selector unambiguous.

| Combinator | Meaning |
|---|---|
| `>` | Immediate child only |
| `>>` | Any descendant (depth-first) |
| *(none)* | Match the scope root element itself |

```yaml
# A toolbar that is a direct child of the window — not any toolbar deeper in the tree
selector: "Window[name~=Mastercam] > ToolBar[name=Mastercam]"

# The Save button anywhere inside the scoped panel
selector: ">> [role=button][name=Save]"
```

`>` is stronger than `>>`. If there are multiple toolbars nested at different depths, `> ToolBar` pins you to the one at the top level. Use `>` when structure matters; use `>>` when you want the first match regardless of depth.

### Leading `>>`

When a selector starts with `>>`, the search starts *inside* the scope anchor rather than testing the anchor element itself. This is the most common form when the scope anchor is a window or panel:

```yaml
scope: dialog
selector: ">> [role=edit][name=Filename]"
```

Without `>>`, the selector would test the dialog element itself against `[role=edit]`, which would fail.

## Positional Modifier: `:nth`

When multiple elements satisfy the same predicates, position disambiguates.

```python
ToolBar > Group:nth(1)     # second Group (0-indexed) that is a direct child of ToolBar
```

`:first` is shorthand for `:nth(0)`. Use `:nth` when elements are structurally identical and position is the only distinguishing factor.

## Tree Navigation: `:parent` and `:ancestor`

Sometimes the element you need to act on can only be identified through one of its children. Navigate up with `:parent` or `:ancestor(n)`. `:parent` is shorthand for `:ancestor(0)` (one level up).

```python
>> [role=button][name=Settings]:parent
```

Finds the Settings button, then returns its parent container. `:ancestor(n)` goes `n` levels up:

```python
>> [role=button][name=Performance]:ancestor(2)
```

You can continue the path after ascending:

```python
>> [role=button][name=Performance]:parent > *:nth(9)
```

Finds the Performance button, moves to its parent, then selects the 10th child of that parent. This handles layouts where a row container can only be identified by a landmark element inside it.

## Common Patterns

#### Pin by AutomationId when available: it is the most stable identifier.
```yaml
selector: ">> [id=SettingsPageAbout_New]"
```
AutomationIds are set by the developer and survive label changes and localization.

#### Narrow by both role and name to eliminate ambiguity:

```python
>> [role=button][name=Save]
```
Role alone is too broad; name alone may match non-interactive elements. Together they are unambiguous.

#### Handle dynamic titles with `~=`:

```python
[name~=Notepad]
```
Matches "Notepad", "Untitled - Notepad", "report.txt - Notepad": any window whose title contains "Notepad".

#### Anchor on a container you can only find through a child:

```python
>> [role=text][name=Status]:parent
```
