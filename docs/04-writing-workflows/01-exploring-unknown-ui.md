---
title: Exploring an Unknown UI
sidebar_label: Exploring the UI
---

# Exploring an Unknown UI

Before you can write a selector, you need to know the element tree. ui-automata ships CLI tools for inspecting a live Windows UI — listing windows, walking the UIA element tree, and testing selectors — without touching a workflow file.

The same tools are exposed as MCP actions, so the AI agent and the workflow author are working from identical information. There is no separate "agent view" of the UI.

This is the first step of every new workflow: explore first, write selectors second.

## The live inspector

For mouse-driven interactive exploration, run `ui-inspector` from a terminal on the Windows machine:

```powershell
ui-inspector
```

Move the mouse over any element in any window. The inspector:

- **Highlights** the element under the cursor with an on-screen overlay rectangle
- **Prints the full ancestor chain** to the terminal, from the desktop root down to the hovered element, cleared and refreshed on every move

```
[desktop] ""  class=  id=
   └─ [window] "Untitled - Notepad"  class=Notepad  id=
      └─ [pane] ""  class=EVERYTHING  id=
         └─ [document] "Text editor"  class=RichEditD2DPT  id=
            └─ [edit] "Text editor"  class=  id=  value=Hello  enabled=true  rect=(12,52,1240,720)
```

Every line shows the element's role, name, class, AutomationId, value, enabled state, and bounding rect — exactly the properties you need to write a selector.

Use `ui-inspector` to answer:
- What is the role and name of the element I need to target?
- Does it have an AutomationId I can anchor on?
- Which container is the right boundary for a `Stable` anchor?

Press `Ctrl-C` to exit.

## Step 1: find the window

List all top-level windows to get the HWND, PID, process name, and title of the target application.

```powershell
list-windows
```

Output:

```
--- Window #1 ---
  hwnd    : 0x1a2b3c
  process : notepad (pid 4812)
  title   : Untitled - Notepad
  type    : window
  class   : Notepad
  id      :
  bounds  : x=100 y=80 w=800 h=600
```

Note the `hwnd` — it uniquely and stably identifies the window for all subsequent calls.

The MCP equivalent for agents: `desktop list_windows`.

## Step 2: walk the element tree

Dump the full UIA element tree for a window by its HWND. Output is YAML.

```powershell
element-tree 0x1a2b3c
```

This walks the entire subtree and prints every element with its role, name, class, AutomationId, and bounds. For a complex application this can be large — pipe through a pager or redirect to a file.

The MCP equivalent for agents: `desktop element_tree hwnd=0x1a2b3c`, which also accepts an optional `selector` to filter output to matched subtrees.

What to look for:
- **Roles** — the UIA control types in use (`button`, `edit`, `list item`, `tree item`, `document`, etc.)
- **Names** — accessible names, which are what `[name=...]` predicates match
- **AutomationIds** — developer-assigned IDs, the most stable anchoring point when present
- **Depth and nesting** — which containers wrap which controls, to decide where to put anchors

:::note
Elements with `role=window` in the tree are hosted child windows (e.g. embedded WebView, ActiveX, or Win32 controls inside a WPF shell). Their leaf descendants are reachable via `>>`, but the `role=window` element itself cannot be used as a selector target.
:::

## Step 3: test a selector live

Once you have a candidate selector, verify it before committing it to a workflow. The MCP `find_elements` action runs a live query against the window and returns each match with its role, name, bounds, and full ancestor chain:

```
desktop find_elements  hwnd=0x1A2B3C  selector=">> [role=edit][name='File name:']"
```

```json
[
  {
    "role": "edit",
    "name": "File name:",
    "bounds": { "x": 120, "y": 440, "width": 380, "height": 24 },
    "ancestors": [
      { "role": "combo box", "name": "File name:" },
      { "role": "pane",      "name": "Save As"    },
      { "role": "dialog",    "name": "Save As"    }
    ]
  }
]
```

The ancestor chain shows the exact structural path — useful for deciding where to set anchor boundaries and how to write multi-step selectors. Set `include_siblings: true` to also see peer elements, which helps when you need `:nth` or OR predicates to disambiguate.

## Step 4: identify anchor boundaries

With the tree in hand, apply the rules from [Choosing Anchors](./04-declaring-anchors):

- The main window: `Root` anchor
- Stable panels that stay alive across the workflow: `Stable` anchors, children of the root
- Dialogs that appear and disappear: `Session` anchors

Anchor the outermost stable container. Use selectors for everything inside it.

## Summary

| Tool | How to use | Best for |
|---|---|---|
| `ui-inspector` | Run in terminal, hover elements | Quick interactive lookup, identifying anchor boundaries |
| `list-windows` | CLI | Find HWNDs and process names |
| `element-tree <hwnd>` | CLI | Full tree dump for offline analysis |
| `desktop find_elements` | MCP (agent) | Testing a selector, verifying ancestor context |
| `vision window_layout` | MCP (agent) | Visual grounding — OCR + layout of a window in screen coordinates |
