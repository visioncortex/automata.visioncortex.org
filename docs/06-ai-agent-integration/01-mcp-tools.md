---
title: MCP Tools Reference
sidebar_label: MCP Tools Reference
---

# MCP Tools Reference

`automata-agent` exposes all ui-automata capabilities to Claude as MCP tools. Each tool covers a category of operations; within a tool, an `action` parameter selects the specific operation. This keeps the tool list short and the schema self-documenting.

## Workflow Tools

### `workflow`

Manage the workflow lifecycle.

| Action | Description |
|---|---|
| `list` | List available workflow files |
| `status` | Get the status of the currently running workflow |
| `cancel` | Cancel the running workflow |
| `list_runs` | List recent run logs with elapsed time |
| `lint` | Validate a workflow YAML string without executing it |

### `start_workflow`

Run a workflow file to completion and return its outputs. Accepts a file path or an inline YAML string and a params map. Streams phase progress notifications back to the client while running.

This is the primary way an agent executes a predefined automation — hand it a workflow from the library and let the executor handle all the UI interaction.

### `run_actions`

Execute a list of UI automation steps directly, without a workflow file. Each step has an intent, an action, and an expect condition — the same structure as a workflow step. The executor runs them against a live window and returns the results.

Useful for one-off interactions or for an agent composing its own steps on the fly rather than calling a pre-built workflow.

## UI Inspection

### `desktop`

Inspect the Windows UI element tree.

| Action | Description |
|---|---|
| `list_windows` | List all top-level windows with HWND, title, process, and bounds |
| `element_tree` | Dump the full UIA element tree of a window; accepts an optional `selector` to filter to matched subtrees |
| `find_elements` | Run a live selector query against a window and return all matches with role, name, and bounds |

The primary tool for an agent exploring an unfamiliar application before writing selectors or deciding how to interact with it. Works alongside `vision` — `desktop` gives the UIA structure; `vision` gives the visual layout.

### `vision`

OCR and visual layout capture.

| Action | Description |
|---|---|
| `window_layout` | Capture visible text and UI regions for a specific window |
| `screen_layout` | Full-screen capture |
| `window_probe` | Hover-probe mode — discovers interactable elements not exposed via UIA by simulating mouse movement |

Use `vision` when UIA gives incomplete information — custom-rendered controls or applications that draw their own widgets. Coordinates returned by `vision` are in screen space and can be passed directly to `input mouse_click`.

## Application Management

### `app`

Launch and manage applications and windows.

| Action | Description |
|---|---|
| `list_installed` | List installed applications |
| `launch` | Launch an application; `wait` strategy: `new_pid`, `new_window`, or `match_any` |
| `list_taskbar` | List windows pinned or open in the taskbar |
| `focus` | Bring a window to the foreground by HWND |
| `show_desktop` | Minimize all windows and show the desktop |
| `list_task_view_windows` | List windows visible in Task View |
| `activate_task_view_window` | Switch to a window via Task View |

### `window`

Manipulate a specific window by HWND.

| Action | Description |
|---|---|
| `minimize` | Minimize the window |
| `maximize` | Maximize the window |
| `restore` | Restore to normal size |
| `close` | Send WM_CLOSE |
| `set_bounds` | Reposition and resize the window |
| `screenshot` | Capture a screenshot of the window |

Get the HWND from `desktop list_windows`.

## Input

### `input`

Raw mouse and keyboard input. Operates at the OS level — works on any window regardless of UIA support.

| Action | Description |
|---|---|
| `mouse_move` | Move the cursor to screen coordinates |
| `mouse_click` | Click at coordinates; `button`: `left`, `right`, `middle`, `double`, `triple` |
| `mouse_drag` | Click and drag from one point to another |
| `mouse_scroll` | Scroll at coordinates |
| `key_press` | Send a key or chord with modifier syntax (`{ctrl}v`, `{alt}{F4}`) |
| `type_text` | Type a string as keystrokes |
| `get_cursor_pos` | Return the current cursor position |

### `clipboard`

Read or write the Windows clipboard.

| Action | Description |
|---|---|
| `read` | Return the current clipboard text |
| `write` | Set the clipboard to a string |

Useful for extracting text that is easier to copy than to read via UIA, or for injecting data into an application via paste.

## Browser

### `browser`

Control Microsoft Edge via the Chrome DevTools Protocol.

| Action | Description |
|---|---|
| `ensure` | Start Edge with a CDP debug port (must call first) |
| `tabs` | List open tabs with id, title, and URL |
| `navigate` | Navigate a tab to a URL |
| `eval` | Evaluate JavaScript in a tab and return the result |
| `dom` | Read the DOM tree of a tab |
| `screenshot` | Capture a screenshot of a tab |
| `open` | Open a new tab |
| `activate` | Switch to a tab by id |
| `close` | Close a tab by id |

For web-based workflows where UIA is insufficient — Edge's UIA tree does not expose full page content. CDP gives direct access to the page DOM and JavaScript runtime.

## Filesystem

### `file`

Full filesystem access.

| Action | Description |
|---|---|
| `list` | List files in a directory |
| `read` | Read a file's full contents |
| `read_lines` | Read a specific line range from a large file |
| `write` | Write (create or overwrite) a file |
| `append` | Append to a file |
| `copy` | Copy a file |
| `move` | Move or rename a file |
| `delete` | Delete a file |
| `mkdir` | Create a directory |
| `rmdir` | Remove a directory |
| `stat` | Get file metadata (size, modified time, etc.) |
| `glob` | Search with a glob pattern |
| `checksum` | Compute a file checksum |

Handles binary files (base64-encoded) and large text files (via `read_lines`).

## System

### `system`

Shell execution, process management, and system information.

| Action | Description |
|---|---|
| `exec` | Run a program directly (no shell); pass program and arguments as an array |
| `ping` | Check connectivity to the agent |
| `whoami` | Return the current Windows username |
| `ipconfig` | Return network adapter configuration |
| `route_table` | Return the IP routing table |
| `get_path` | Return the current `PATH` environment variable |
| `list_processes` | List running processes |
| `kill_process` | Terminate a process by PID |

`cmd.exe` and `powershell.exe` can be passed as the program to `exec` for shell-style invocation.

## Library

### `resources`

Browse the embedded workflow library.

| Action | Description |
|---|---|
| `list` | List available workflows with their descriptions and parameters |
| `read` | Read a specific workflow file by path |

An agent can use this to discover what pre-built workflows are available before deciding how to approach a task.
