---
title: Launching an App or Mounting a Window
sidebar_label: Launch & Mount
---

# Launching an App or Mounting a Window

Before a workflow can interact with a UI, it needs a handle to a window. There are two situations: you need to launch the application yourself, or the application is already running and you need to attach to it.

## Launching an Application

Use the top-level `launch:` field to start an application before the first phase runs. The executor waits for a window to appear before proceeding.

```yaml
launch:
  exe: notepad.exe
  wait: new_pid
```

For UWP and Store apps, use `app:` with the app's URI scheme instead:

```yaml
launch:
  app: ms-settings
```

`app:` accepts a URI scheme name (`ms-settings`, `ms-windows-store`), a full URI (`ms-settings:display`), or a UWP AppID.

## Wait Strategies

The `wait:` field controls which window the engine locks to after launch. Getting this wrong is the most common launch bug — the engine attaches to the wrong window and the first step fails immediately.

| Strategy | When to use |
|---|---|
| `new_pid` | Apps that spawn a dedicated process per window. The engine waits for a window owned by the exact PID the OS returned. |
| `new_window` | Single-instance apps, or apps where the spawned process hands off to an existing one. The engine snapshots open windows before launch and waits for a new HWND to appear. |
| `match_any` | Apps that reuse an existing process. The engine waits until the root anchor's selector resolves against any window of the process. |

### Win10 vs Win11: Notepad

This distinction matters in practice. Win10 Notepad spawns a fresh process for every window — `new_pid` is correct:

```yaml
# win10
launch:
  exe: notepad.exe
  wait: new_pid
```

Win11 Notepad runs as a single-instance process with a tabbed interface. Launching it again brings focus to the existing process rather than spawning a new one. Use `new_window` to detect the new tab window:

```yaml
# win11
launch:
  exe: notepad.exe
  wait: new_window
```

The same distinction applies to File Explorer and other single-instance Win32 apps.

### UWP apps: ApplicationFrameHost

Store apps (Settings, Paint, Calculator, etc.) do not run in their own process in the way Win32 apps do. They are hosted by `ApplicationFrameHost.exe` — a shell process that manages UWP windows. When you launch `ms-settings`, the visible window belongs to `ApplicationFrameHost`, not to a `SystemSettings` or similar process.

This means you cannot match the window by the app's own process name. Match by title instead, and set `process: ApplicationFrameHost` on the anchor:

```yaml
launch:
  app: ms-settings

anchors:
  settings:
    type: Root
    process: ApplicationFrameHost
    selector: "[name=Settings]"
```

The `wait:` strategy for UWP apps is typically `new_window` or `match_any` — the launch is indirect and `new_pid` will not match because `ApplicationFrameHost` was already running.

## Handing Off to a Different Process

When the launched executable immediately spawns a *different* process (e.g. `control.exe` delegates to `explorer.exe`), use `wait_for:` pointing to an anchor that filters on the target process name:

```yaml
launch:
  exe: control.exe
  wait_for: control_panel

anchors:
  control_panel:
    type: Root
    process: explorer
    selector: "[name~=Control Panel]"
```

## Attaching to an Existing Window

If the application is already running, skip `launch:` entirely. Declare a `Root` anchor and mount it in the first phase:

```yaml
anchors:
  notepad:
    type: Root
    selector: "[name~=Notepad]"

phases:
  - name: interact
    mount: [notepad]
    steps:
      - ...
```

To pin to a specific process by name — useful when multiple instances may be running:

```yaml
anchors:
  my_app:
    type: Root
    process: myapp
    selector: "*"
```

To target a specific known PID (for example, one returned by a previous workflow or passed as a parameter):

```yaml
anchors:
  my_app:
    type: Root
    pid: "{param.target_pid}"
    selector: "*"
```
