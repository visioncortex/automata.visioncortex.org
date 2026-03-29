---
title: Steps and Intents
sidebar_label: Steps & Intents
---

# Steps and Intents

A step is the atomic unit of work in a workflow. Each step performs one action, then waits for a condition to become true before the workflow continues.

## Anatomy of a step

```yaml
- intent: click the Save button
  precondition:
    type: ElementEnabled
    scope: toolbar
    selector: ">> [role=button][name=Save]"
  action:
    type: Click
    scope: toolbar
    selector: ">> [role=button][name=Save]"
  expect:
    type: DialogAbsent
    scope: main_window
  timeout: 10s
  retry:
    fixed:
      count: 2
      delay: 500ms
  on_failure: abort
  on_success: continue
```

### `intent`

Required. A human-readable label shown in logs, progress events, and error messages. Write it as a verb phrase: `"click the Save button"`, `"type the search term"`, `"wait for the export dialog to disappear"`.

### `precondition`

Optional. Evaluated before the action. If false, the step is **skipped** — not an error. Use this for conditional steps:

```yaml
- intent: dismiss warning dialog if present
  precondition:
    type: DialogPresent
    scope: main_window
  action:
    type: Click
    scope: main_window
    selector: ">> [role=button][name=OK]"
  expect:
    type: DialogAbsent
    scope: main_window
```

### `action`

The action to perform. See [Actions](./07-actions) for the full list.

### `fallback`

Optional. An alternative action run when `expect` times out on the primary action. After the fallback runs, `expect` is re-polled once with a fresh timeout. If it succeeds, the step succeeds; otherwise `on_failure` applies.

```yaml
- intent: click Save or press Enter
  action:
    type: Click
    scope: dialog
    selector: ">> [role=button][name=Save]"
  fallback:
    type: PressKey
    key: "{ENTER}"
  expect:
    type: DialogAbsent
    scope: main_window
```

### `expect`

The condition that must become true after the action. Polled every 100 ms until satisfied or the timeout elapses. See [Conditions](./08-conditions) for the full list.

### `timeout`

Maximum time to wait for `expect`. Accepts duration strings: `"5s"`, `"300ms"`, `"2m"`. Overrides the workflow-level default (which is 10s if not set).

### `retry`

Controls what happens when `expect` times out (after any `fallback`):

| Value | Behaviour |
|---|---|
| `none` | Fall back to workflow default |
| `fixed: { count: N, delay: Xms }` | Re-execute the action up to N more times |
| `with_recovery` | Check registered recovery handlers, then retry the step |

```yaml
retry:
  fixed:
    count: 3
    delay: 1s
```

The workflow-level default is `fixed: { count: 1, delay: 1s }`.

### `on_failure`

What to do when the step fails:

| Value | Behaviour |
|---|---|
| `abort` | Stop the phase and propagate the error *(default)* |
| `continue` | Log the failure and advance to the next step |

### `on_success`

What to do immediately after the step succeeds:

| Value | Behaviour |
|---|---|
| `continue` | Proceed to the next step *(default)* |
| `return_phase` | Stop executing steps in this phase immediately (not an error) |

`return_phase` is the early-exit mechanism. Combine with `on_failure: continue` to implement optional fast-path checks:

```yaml
- intent: skip export if file already exists
  action:
    type: NoOp
  expect:
    type: FileExists
    path: "{output.export_path}"
  on_failure: continue
  on_success: return_phase
```

## Workflow defaults

Set `defaults` at the top of the workflow file to apply a timeout and retry policy to every step that does not specify its own:

```yaml
defaults:
  timeout: 10s
  retry:
    fixed:
      count: 1
      delay: 1s
```

## Reading step traces

When a step fails, the error includes the phase name, step intent, the failing condition type, and the last observed element state. Reading the intent label is usually enough to locate the failing step in the YAML.
