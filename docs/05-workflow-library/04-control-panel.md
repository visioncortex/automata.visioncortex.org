---
title: Control Panel
sidebar_label: Control Panel
---

# Control Panel

<video controls width="100%" style={{borderRadius: '8px', marginBottom: '1.5rem'}}>
  <source src="/video/control-panel.mp4" type="video/mp4" />
</video>

The classic Control Panel is a Win32 application (`control.exe`). These workflows cover settings that have not been migrated to the modern Settings app or that are more conveniently accessed here.

Control Panel uses a search-and-click navigation model: open the panel, type a search term in the search box, then click the result link. The `mouse_settings` workflow demonstrates this pattern and can be adapted to any Control Panel page reachable by search.

## `mouse_settings`

Opens Control Panel, searches for a term, and clicks a result link.

| Parameter | Description |
|---|---|
| `search` | Search term to type *(default: `mouse`)* |
| `link` | Text of the result link to click |

## `firewall_settings`

Opens Control Panel, searches for "firewall", and navigates to **Windows Defender Firewall**.

No parameters.
