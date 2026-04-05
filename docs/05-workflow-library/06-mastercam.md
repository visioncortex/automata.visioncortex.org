---
title: Mastercam
sidebar_label: Mastercam
---

# Mastercam

Mastercam is a professional CAD/CAM application. It has a deeply nested UIA tree, off-screen virtualised list items, toolbar buttons that doesn't have the best UIA ids, and multi-window flows involving a separate Simulator window. It is one of the harder automation targets and exercises most of the engine's advanced capabilities.

<video controls width="100%" style={{borderRadius: '8px', marginBottom: '1.5rem'}}>
  <source src="/video/mastercam-demo.mp4" type="video/mp4" />
</video>

## The Pipeline

The Mastercam workflow library is structured as a set of composable subflows, assembled by a top-level orchestrator:

| Workflow | What it does |
|---|---|
| `launch.yml` | Launches Mastercam and waits for splash to clear |
| `open_file.yml` | Opens a `.mcam` file and extracts all toolpath names |
| `open_simulator.yml` | Selects all operations and launches the Simulator window |
| `simulator_save_operation.yml` | Fast-forwards the simulator and saves the Operation Info CSV |
| `reset.yml` | Closes the file and returns to a clean state |
| `process_file.yml` | Orchestrator: runs all of the above, then calls a Python script |

`process_file.yml` is the entry point for end-to-end automation. It calls each subflow in sequence, passing outputs from earlier stages as parameters to later ones.

## Nested Workflows

`process_file.yml` is entirely composed of subflow phases:

```yaml
phases:
  - name: open_file
    subflow: open_file.yml
    params:
      file_path: "{param.file_path}"

  - name: open_simulator
    subflow: open_simulator.yml

  - name: save_operation_info
    subflow: simulator_save_operation.yml
    params:
      output_dir: "{param.output_dir}"

  - name: reset
    subflow: reset.yml

  - name: stitch_outputs
    steps:
      - ...
```

Each subflow is independently testable and reusable. Root and Session anchors (the Mastercam main window, the Simulator window) are shared across subflows by name — no duplicate resolution, no duplicate element tree.

## Data Extraction

`open_file.yml` extracts all toolpath names from the Toolpaths panel tree:

```yaml
- intent: extract all toolpath names into the output buffer
  action:
    type: Extract
    key: toolpaths
    scope: toolpaths_tree
    selector: "> [role='tree item'] > * > [role='tree item']"
    attribute: name
    multiple: true
  expect:
    type: EvalCondition
    expr: "output_count('toolpaths') > 0"
```

The selector navigates three levels: top-level tree items (group headers), an intermediate container, then the leaf tree items (the actual toolpaths). `multiple: true` collects all matches. The `EvalCondition` guard verifies extraction produced at least one result before continuing.

## Python Post-Processing

After the Simulator saves its CSV, the orchestrator writes the extracted toolpath names to a temp file and passes both to a Python script:

```yaml
- intent: write toolpath names to a temp file for the script
  action:
    type: WriteOutput
    key: toolpaths
    path: "{param.output_dir}{output.saved_file}_toolpaths.csv"
  expect:
    type: Always

- intent: run post-processing script
  action:
    type: Exec
    command: python
    args:
      - "{param.script_path}"
      - "--simulator-output"
      - "{param.output_dir}{output.saved_file}"
      - "--toolpaths-csv"
      - "{param.output_dir}{output.saved_file}_toolpaths.csv"
  expect:
    type: ExecSucceeded
```

`WriteOutput` serialises all values stored under the `toolpaths` key as CSV-quoted lines. The Python script (`post_process.py`) then joins the simulator output with the toolpath list to produce the final report.

## Complex Selectors

Mastercam's toolbar buttons have no accessible names — they are identified only by position. The fast-forward button in the Simulator is the 10th sibling of the Performance button's parent:

```yaml
selector: ">> [role=button][name=Performance]:parent > *:nth(9)"
```

This uses `:parent` to navigate up to the container, then `:nth(9)` to select the 10th child (0-indexed). It is the canonical pattern for toolbars where individual buttons carry no identity other than their position.

The toolpath tree selector also avoids off-screen virtualisation issues. Off-screen tree items report a degenerate `(0, 0, 1, 1)` bounding box. The `Invoke` action is used for the Save Operation Info button for the same reason: it activates the element via UIA's `InvokePattern` without needing a visible bounding rect.

## Waiting for Completion

The simulator's fast-forward progress is detected with a regex backreference, not a fixed sleep:

```yaml
expect:
  type: ElementHasText
  scope: move_info_pane
  selector: ">> [role=edit][name=MoveId]"
  pattern:
    regex: "^(\\d+) of \\1$"
```

`(\d+) of \1` matches when the current move equals the total (e.g. `"847 of 847"`). The engine polls every 100ms; no sleep duration needs to be guessed.

## Recovery Handlers

Mastercam produces unexpected dialogs at several points: "Errors or Warnings" after file load, "Dirty Operations Selected" before simulation, and overwrite confirmations during save. Each is declared as a named recovery handler and opted into the phases where it can appear:

```yaml
recovery_handlers:
  dismiss_errors:
    trigger:
      type: ElementFound
      scope: mastercam
      selector: "> [role=dialog][name='Errors or Warnings']"
    actions:
      - type: Click
        scope: mastercam
        selector: "> [role=dialog][name='Errors or Warnings'] >> [role=button][name=OK]"
    resume: retry_step

  confirm_overwrite:
    trigger:
      type: ElementFound
      scope: save_dialog
      selector: "> [role=dialog][name='Save Operation Info']"
    actions:
      - type: Click
        scope: save_dialog
        selector: "> [role=dialog][name='Save Operation Info'] >> [role=button][name=Yes]"
    resume: retry_step
```

The happy path phases stay linear. The recovery handlers fire only when needed, leaving no trace in the normal execution path.
