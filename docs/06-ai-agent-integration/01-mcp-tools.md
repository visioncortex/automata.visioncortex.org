---
title: MCP Tools Reference
sidebar_label: MCP Tools Reference
---

# MCP Tools Reference

`automata-agent` exposes all ui-automata capabilities to Claude as MCP tools. Each tool covers a category of operations; within a tool, an `action` parameter selects the specific operation. This keeps the tool list short and the schema self-documenting.

## Workflow Tools

### `workflow`

Manage the workflow lifecycle: list available workflows, check the status of a running workflow, cancel it, list recent run logs, or lint a workflow YAML string without executing it.

Useful when an agent needs to know what workflows exist before deciding which to run, or when debugging a workflow that produced unexpected output.

### `start_workflow`

Run a workflow file to completion and return its outputs. Accepts a file path or an inline YAML string and a params map. Streams phase progress notifications back to the client while running.

This is the primary way an agent executes a predefined automation — hand it a workflow from the library and let the executor handle all the UI interaction.

### `run_actions`

Execute a list of UI automation steps directly, without a workflow file. Each step has an intent, an action, and an expect condition — the same structure as a workflow step. The executor runs them against a live window and returns the results.

Useful for one-off interactions or for an agent that is composing its own steps on the fly rather than calling a pre-built workflow.

## UI Inspection

### `desktop`

Inspect the Windows UI element tree. List all top-level windows, dump the UIA element tree of a specific window, or run a live selector query against a window to see exactly what it matches.

The primary tool for an agent exploring an unfamiliar application before writing selectors or deciding how to interact with it. Works alongside `vision` — `desktop` gives the UIA structure; `vision` gives the visual layout.

### `vision`

OCR and visual layout capture. Returns a YAML tree of visible UI regions and text with screen coordinates. Supports per-window capture (`window_layout`), full-screen capture (`screen_layout`), and a slower hover-probe mode (`window_probe`) that discovers interactable elements not exposed via UIA.

Use `vision` when UIA gives incomplete information — custom-rendered controls, game UIs, or applications that draw their own widgets. Coordinates returned by `vision` are in screen space and can be passed directly to `input mouse_click`.

## Application Management

### `app`

Launch applications, list installed apps, manage windows via the taskbar, and switch between open windows using Task View. Handles both Win32 apps (`new_pid` wait strategy) and UWP/single-instance apps like Explorer or Settings (`new_window` strategy).

### `window`

Manipulate a specific window by HWND: minimize, maximize, restore, close, reposition, or take a screenshot. Get the HWND from `desktop list_windows`.

## Input

### `input`

Raw mouse and keyboard input: move the cursor, click, scroll, drag, type text, or send key combinations with modifier syntax (`{ctrl}v`, `{alt}{F4}`). Operates at the OS level — works on any window regardless of UIA support.

Use `input` when a `run_actions` step would be overkill, or for interactions that don't map to UIA actions (drag-and-drop, scroll wheels, hotkeys).

### `clipboard`

Read or write the Windows clipboard. Useful for extracting text that is easier to copy than to extract via UIA, or for injecting data into an application via paste.

## Browser

### `browser`

Control Microsoft Edge via the Chrome DevTools Protocol. List tabs, navigate, evaluate JavaScript, read the DOM tree, or capture a tab screenshot. Must call `ensure` first to start Edge with a debug port.

For web-based workflows where UIA is insufficient — Edge's UIA tree does not expose full page content. CDP gives direct access to the page DOM and JavaScript runtime.

## Filesystem and System

### `file`

Full filesystem access: list, read, write, append, copy, move, delete files and directories, search with glob patterns, stat, and checksum. Handles binary files (base64-encoded) and large text files (line-range reads).

### `system`

Shell execution, process management, and system information. Run arbitrary programs via `cmd.exe`, `powershell.exe`, or `bash.exe`; list and kill processes; query network config; get environment variables.

The `exec` action runs programs without a shell — pass the program and arguments as an array. No quoting edge cases. `cmd.exe` and `powershell.exe` are handled specially with sensible defaults auto-configured.

## Library

### `resources`

Browse the embedded workflow library. List available workflows with their descriptions and parameters, or read a specific workflow file by path. An agent can use this to discover what pre-built workflows are available before deciding how to approach a task.
