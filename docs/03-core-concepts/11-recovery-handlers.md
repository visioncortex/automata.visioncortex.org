---
title: Recovery Handlers
sidebar_label: Recovery Handlers
---

# Recovery Handlers

A workflow is not a flat sequence of steps. It is a hierarchical state machine.

The primary axis is the happy path: the ordered sequence of phases and steps that takes the application from its starting state to the desired outcome. But real applications run in a noisy environment. An unexpected error dialog appears. A background process triggers a notification. A network call stalls and a progress indicator stays up longer than expected. These are orthogonal states: they arrive independently of what the workflow is doing, on a different axis entirely.

Without recovery handlers, the only option is to encode every possible interruption inline, cluttering every step with conditional branches that mostly never fire. Recovery handlers separate these concerns cleanly. The happy path stays linear; the orthogonal cases are declared once, activated per-phase, and fire only when they are needed.

The goal of a recovery handler is always the same: detect that the workflow has left the happy path, take corrective action to return to it, then resume.

## Declaring a Recovery Handler

Handlers are declared at the top level of the workflow file under `recovery_handlers:`, then opted into per-phase.

```yaml
recovery_handlers:
  dismiss_error_dialog:
    trigger:
      type: DialogPresent
      scope: main_window
    actions:
      - type: Click
        scope: main_window
        selector: ">> [role=button][name=OK]"
    resume: retry_step
```

Each handler has three fields:

| Field | Description |
|---|---|
| `trigger` | Any [Condition](../conditions), checked after a step timeout |
| `actions` | List of [Actions](../actions) to execute when the trigger fires |
| `resume` | What the executor does after the actions complete |

## Trigger Conditions

The trigger is evaluated after `expect` times out on a step. If the trigger is true, the handler fires. If it is false, the engine moves to the next handler (or fails the step if none match).

Any condition type can be a trigger. The most common is `DialogPresent`:

```yaml
trigger:
  type: DialogPresent
  scope: main_window
```

## Corrective Actions

The `actions` list runs in order after the trigger fires. These are the same action types available in steps. The typical pattern is to dismiss the interfering dialog:

```yaml
actions:
  - type: Click
    scope: main_window
    selector: ">> [role=button][name=OK]"
```

## Resume Strategies

After the corrective actions complete, the executor uses the `resume` strategy to decide what to do next:

### `retry_step`

Re-execute the failing step from scratch. Use this when the handler has restored a known-good state and the step should be attempted again.

```yaml
resume: retry_step
```

### `skip_step`

Treat the step as succeeded and advance to the next one. Use this when the handler has achieved the same result the step was trying to achieve.

```yaml
resume: skip_step
```

### `fail`

Treat the step as failed and propagate the error. Use this when the trigger identifies an unrecoverable state that should be reported clearly.

```yaml
resume: fail
```

## Enabling Handlers Per Phase

Handlers are opt-in per phase via `recovery.handlers`. Listing a handler name enables it for all steps in that phase.

```yaml
phases:
  - name: export_data
    mount: [main_window]
    recovery:
      handlers: [dismiss_error_dialog, dismiss_license_warning]
      limit: 5
    steps:
      - ...
```

`limit` caps the total number of handler invocations across all steps in the phase. The workflow-level default is 10, set via `defaults.recovery.limit`.

To opt a single step into recovery handling, set `retry: with_recovery` on that step:

```yaml
- intent: click the long-running export button
  action:
    type: Click
    scope: toolbar
    selector: ">> [role=button][name=Export]"
  expect:
    type: DialogAbsent
    scope: main_window
  timeout: 60s
  retry: with_recovery
```

## Common Patterns

**Dismiss an unexpected error dialog:**

```yaml
recovery_handlers:
  dismiss_error:
    trigger:
      type: ForegroundIsDialog
      scope: main_window
      title:
        contains: "Error"
    actions:
      - type: PressKey
        key: "{ENTER}"
    resume: retry_step
```

**Handle a disabled button that becomes enabled after a delay:**

When the button is disabled, `ElementEnabled` will not be true yet. Use `retry: with_recovery` with a long timeout instead of a handler and let the polling loop handle it. Handlers are for unexpected state changes, not timing.

**Recover from focus loss:**

```yaml
recovery_handlers:
  refocus_window:
    trigger:
      type: Not
      condition:
        type: WindowWithState
        anchor: main_window
        state: active
    actions:
      - type: ActivateWindow
        scope: main_window
    resume: retry_step
```
