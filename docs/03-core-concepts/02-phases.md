---
title: Phases
sidebar_label: Phases
---

# Phases

A phase is the top-level unit of execution within a workflow. Phases run in order; the first failure stops the workflow. Each phase is one of three kinds: an action phase (steps), a flow-control phase (conditional jump), or a subflow phase (delegates to a child workflow).

## Action Phases

An action phase runs a list of steps and manages anchor lifetime around them.

```yaml
phases:
  - name: fill_form
    mount: [main_window, form_panel]
    unmount: [form_panel]
    steps:
      - intent: type the username
        action:
          type: TypeText
          scope: form_panel
          selector: ">> [role=edit][name=Username]"
          text: "{param.username}"
        expect:
          type: Always
```

### Fields

| Field | Required | Description |
|---|---|---|
| `name` | yes | Identifies the phase in logs and `go_to` targets |
| `steps` | yes | Ordered list of steps to execute |
| `mount` | no | Anchor names to activate at phase start |
| `unmount` | no | Anchor names to release at phase end (even on failure) |
| `precondition` | no | Condition evaluated before mounting; phase is skipped (logged, not an error) if false |
| `recovery` | no | Recovery handler configuration for this phase |
| `finally` | no | If `true`, the phase runs even when earlier phases have failed |

### Phase Lifecycle: Mount and Unmount

`mount:` activates the listed anchors at the start of the phase before any steps run. Root anchors are resolved immediately on mount; Stable anchors are resolved lazily on first use.

`unmount:` releases the listed anchors at the end of the phase, even if steps fail. Use it to clean up Stable and Session anchors that are only needed for this phase. Root anchors cannot be unmounted: they persist for the entire workflow.

### `precondition`

Evaluated before the phase's anchors are mounted. If the condition is false, the phase is skipped.

```yaml
- name: close_progress_dialog
  precondition:
    type: DialogPresent
    scope: main_window
  mount: [progress_dialog]
  steps:
    - ...
```

### `finally`

A `finally: true` phase always runs, regardless of whether a previous phase failed. Use it for cleanup: closing dialogs, restoring focus, resetting application state.

```yaml
- name: cleanup
  finally: true
  mount: [main_window]
  steps:
    - intent: close any open dialog
      action:
        type: PressKey
        key: "{ESCAPE}"
      expect:
        type: Always
```

Errors within a `finally` phase are logged but do not override the original workflow error.

### Recovery Configuration

Opt a phase into named recovery handlers via `recovery.handlers`. The engine checks these handlers whenever a step times out.

```yaml
- name: export_data
  mount: [main_window]
  recovery:
    handlers: [dismiss_error_dialog]
    limit: 5
  steps:
    - ...
```

`limit` caps total handler invocations across all steps in the phase. The workflow-level `defaults.recovery.limit` applies when no phase-level limit is set (default: 10).

## Flow-Control Phases

A flow-control phase is a conditional jump. It has no steps and no anchor lifecycle: just a condition and a target phase name.

```yaml
- name: check_loop_condition
  flow_control:
    condition:
      type: EvalCondition
      expr: "output.counter < param.max"
    go_to: process_item
```

If the condition is true, execution jumps to the named phase. If false, execution falls through to the next phase in order. See [Control Flow](../control-flow) for loop patterns.

## Subflow Phases

A subflow phase delegates to a child workflow YAML file.

```yaml
- name: export_report
  subflow: ./export/export_report.yml
  params:
    output_dir: "{param.output_dir}"
    report_name: "{output.report_name}"
```

The child runs in the same engine instance. Root and Session anchors from the parent are inherited by the child; Stable and Ephemeral anchors are scoped to the child. See [Subflows](../04-writing-workflows/10-subflows.md) for details.

## Error Propagation

When a step fails, the phase stops immediately. The workflow stops unless a `finally: true` phase is configured. The error message includes the phase name, step intent, the failing condition, and the last observed UI state.
