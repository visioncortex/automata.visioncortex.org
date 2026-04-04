---
title: Exploring an Unknown UI
sidebar_label: Exploring the UI
---

# Exploring an Unknown UI

Before you can write a selector, you need to know the element tree. ui-automata ships CLI tools for inspecting a live Windows UI.

The same tools are exposed as MCP actions, so the AI agent and the workflow author are working from identical information. There is no separate "agent view" of the UI.

This is the first step of every new workflow: explore first, write selectors second.

## The Live Inspector

<video controls width="100%" style={{borderRadius: '8px', marginBottom: '1.5rem'}}>
  <source src="/video/ui-inspector-demo.mp4" type="video/mp4" />
</video>

For mouse-driven interactive exploration, run `ui-inspector` from a terminal on the Windows machine:

```powershell
ui-inspector
```

Move the mouse over any element in any window. The inspector:

- **Highlights** the element under the cursor with an on-screen overlay rectangle
- **Prints the full ancestor chain** to the terminal, from the desktop root down to the hovered element, cleared and refreshed on every move

```
[desktop] "Desktop 1" class=#32768 id=
   └─ [window] "Untitled - Notepad" class=Notepad id=
      └─ [pane] "" class=NotepadTextBox id=
         └─ [document] "Text editor" class=RichEditD2DPT id= value= enabled=true rect=(0,0,400,200)
```

Every line shows the element's role, name, class, AutomationId, value, enabled state, and bounding rect — exactly the properties you need to write a selector.

Use `ui-inspector` to answer:
- What is the role and name of the element I need to target?
- Does it have an AutomationId I can anchor on?
- Which container is the right boundary for a `Stable` anchor?

Press `Ctrl-C` to exit.

## Step 1: Find the Window

List all top-level windows to get the HWND, PID, process name, and title of the target application.

```powershell
list-windows
```

Output:

```
--- Window #1 ---
  hwnd    : 0x1234ab
  process : notepad (pid 4812)
  title   : Untitled - Notepad
  type    : window
  class   : Notepad
  id      :
  bounds  : x=100 y=80 w=800 h=600
```

Note the `hwnd` — it uniquely and stably identifies the window for all subsequent calls.

The MCP equivalent for agents: `desktop list_windows`.

## Step 2: Walk the Element Tree

Dump the full UIA element tree for a window by its HWND. Output is YAML.

```powershell
element-tree 0x1234ab
```

This walks the entire subtree and prints every element with its role, name, class, AutomationId, and bounds. For a complex application this can be large — pipe through a pager or redirect to a file.

The MCP equivalent for agents: `desktop element_tree hwnd=0x1a2b3c`, which also accepts an optional `selector` to filter output to matched subtrees.

What to look for:
- **Role** — the UIA control types in use (`button`, `edit`, `list item`, `tree item`, `document`, etc.)
- **Name** — accessible names, which are what `[name=...]` predicates match
- **AutomationId** — developer-assigned IDs, the most stable anchoring point when present
- **Parent and Siblings** — which containers wrap which controls, to decide where to put anchors

:::note
Elements with `role=window` in the tree are hosted child windows (e.g. embedded WebView, ActiveX, or Win32 controls inside a WPF shell). Their leaf descendants are reachable via `>>`, but the `role=window` element itself cannot be used as a selector target.
:::

## Step 3: Testing a Selector

Once you have a candidate selector, verify it before committing it to a workflow.

Pass `--interactive` to `element-tree` to enter REPL mode. On startup it constructs the element tree and caches it, then waits for selector input. Because queries run against the cache, results are instant and deterministic — no live UIA round-trips.

Below, we run it against an Explorer window, find the file list, and enumerate all items in it.

```python
element-tree 0x80818 --interactive
constructing element tree ... done
$ >> [role=list]
[role=list][name="Items View"] rect=(1163,90,841,390)
$ >> [role=list][name="Items View"] > [role=list item]
[role=list item][name="logs"][id=0] rect=(1177,121,599,23)
[role=list item][name="workflows"][id=1] rect=(1177,142,599,23)
[role=list item][name=".client_id"][id=2] rect=(1177,163,599,23)
[role=list item][name="automata-agent.exe"][id=3] rect=(1177,184,599,23)
[role=list item][name="element-tree.exe"][id=4] rect=(1177,205,599,23)
[role=list item][name="identity.json"][id=5] rect=(1177,226,599,23)
[role=list item][name="list-windows.exe"][id=6] rect=(1177,247,599,23)
[role=list item][name="ui-inspector.exe"][id=7] rect=(1177,268,599,23)
[role=list item][name="ui-sight-windows.exe"][id=8] rect=(1177,289,599,23)
[role=list item][name="ui-workflow.exe"][id=9] rect=(1177,310,599,23)
[role=list item][name="ui-workflow-check.exe"][id=10] rect=(1177,331,599,23)
```

The MCP `find_elements` action runs a live query against the window and returns each match with its role, name and bounds.

```
desktop find_elements hwnd=0x1A2B3C selector=">> [role=edit][name='File name:']"
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

## Step 4: Identify Anchor Boundaries

With the tree in hand, apply the rules from [Choosing Anchors](../declaring-anchors):

- The main window: `Root` anchor
- Stable panels that stay alive across the workflow: `Stable` anchors, children of the root
- Dialogs that appear and disappear: `Session` anchors

Anchor the outermost stable container. Use selectors for everything inside it.

## Summary

| Tool | How to use | Best for |
|---|---|---|
| `ui-inspector` | Run in terminal, hover elements | Quick interactive exploration, identifying elements and anchors |
| `list-windows` | CLI | Find HWNDs and process names |
| `element-tree <hwnd>` | CLI / MCP | Full tree dump for offline analysis |
| `element-tree <hwnd> --interactive` | CLI | Testing a selector interactively |
| `desktop find_elements` | MCP | Testing a selector, finding ancestors / siblings |
| `vision window_layout` | MCP | Visual grounding — OCR + layout of a window in screen space |
