---
title: Windows Explorer
sidebar_label: Explorer
---

# Windows Explorer

File Explorer is a Win32 application on Win10 and a Win11-modern app on Win11 (tabbed interface, `new_window` launch strategy). These workflows handle both by launching a fresh Explorer window and navigating from there.

## `explorer_open_folder`

Launches a new Explorer window, clicks **Home** in the navigation panel, and double-clicks a named folder.

| | |
|---|---|
| **Params** | `folder` — folder name to open (e.g. `Documents`, `Downloads`, `Desktop`); `open_explorer` *(bool)* — whether to launch a new window or use an existing one |

The `folder` param is matched against the list item name in the Home view, so it works with any folder that appears there by name.

## `explorer_navigate`

Launches a new Explorer window and navigates to an arbitrary path by typing it into the address bar.

| | |
|---|---|
| **Params** | `address` — full path or shell URI to navigate to (e.g. `C:\Users\chris\Documents`); `open_explorer` *(bool)* |
