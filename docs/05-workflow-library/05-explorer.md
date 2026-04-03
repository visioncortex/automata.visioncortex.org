---
title: Windows Explorer
sidebar_label: Explorer
---

# Windows Explorer

<video controls width="100%" style={{borderRadius: '8px', marginBottom: '1.5rem'}}>
  <source src="/video/explorer-navigate.mp4" type="video/mp4" />
</video>

File Explorer is a Win32 application on Win10 and a Win11-modern app on Win11 (tabbed interface, `new_window` launch strategy). These workflows handle both by launching a fresh Explorer window and navigating from there.

## `explorer_open_folder`

Launches a new Explorer window, clicks **Home** in the navigation panel, and double-clicks a named folder.

| Parameter | Description |
|---|---|
| `folder` | Folder name to open (e.g. `Documents`, `Downloads`, `Desktop`) |
| `open_explorer` | *(bool)* Whether to launch a new window or attach to an existing one |

The `folder` param is matched against the list item name in the Home view, so it works with any folder that appears there by name.

## `explorer_navigate`

Launches a new Explorer window and navigates to an arbitrary path by typing it into the address bar.

| Parameter | Description |
|---|---|
| `address` | Full path or shell URI to navigate to (e.g. `C:\Users\chris\Documents`) |
| `open_explorer` | *(bool)* Whether to launch a new window or attach to an existing one |
