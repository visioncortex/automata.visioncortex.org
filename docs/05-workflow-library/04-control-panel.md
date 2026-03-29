---
title: Control Panel
sidebar_label: Control Panel
---

# Control Panel

The classic Control Panel is a Win32 application (`control.exe`). These workflows cover settings that have not been migrated to the modern Settings app or that are more conveniently accessed here.

Control Panel uses a search-and-click navigation model: open the panel, type a search term in the search box, then click the result link. The `mouse_settings` workflow demonstrates this pattern and can be adapted to any Control Panel page reachable by search.

## `mouse_settings`

Opens Control Panel, searches for a term, and clicks a result link.

| | |
|---|---|
| **Params** | `search` *(default: `mouse`)* — search term to type; `link` — text of the result link to click |

## `firewall_settings`

Opens Control Panel, searches for "firewall", and navigates to **Windows Defender Firewall**.

No parameters.
