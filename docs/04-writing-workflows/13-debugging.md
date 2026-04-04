---
title: Debugging Workflows
sidebar_label: Debugging Workflows
---

# Debugging Workflows

## Trace Logs

Every workflow run writes a structured trace log to:

```
%USERPROFILE%\.ui-automata\logs\<workflow_name>\***.log
```

The log records every step with its intent, action, poll result, and outcome. When a step fails, the log includes the last observed condition state and the full error message. Reading the intent label is usually enough to locate the failing step in the YAML.

## Capturing UI Changes

After each action, the engine can snapshot the UIA element tree of the scoped anchor and diff it against the previous snapshot. Each change is written to the trace log:

```python
dom: toolbar: ADDED [button "Save As"]
dom: status_bar > [text "Status"]: name "Ready" → "Saving…"
dom: dialog: REMOVED [button "Cancel"]
```

This tells you exactly what changed in the UI tree as a result of each action — which elements appeared, disappeared, or had their properties updated. It is the fastest way to understand what an unfamiliar application is doing in response to your workflow steps.

DOM diffing is disabled by default. Enable it in the workflow's `defaults` block:

```yaml
defaults:
  action_snapshot: true
```

## Debugging "Element Not Found"

When a step fails because a selector matches nothing, use `element-tree --interactive` to test selectors against the live application. It drops you into a REPL that queries the cached element tree instantly:

```python
element-tree 0x1A2B3C --interactive
constructing element tree ... done
$ >> [role=button][name=Save]
[role=button][name=Save] rect=(120,44,60,24)
```

See [Exploring Unknown UI](./01-exploring-unknown-ui.md) for full usage.

## Checking the Exit Code

`ExecSucceeded` checks that the most recent `Exec` action exited with code 0. For more nuanced handling, the exit code is stored in the local variable `__exec_exit_code__` and available as a bare identifier in expressions:

```yaml
- intent: run the script
  action:
    type: Exec
    command: python
    args: ["{workflow.dir}\\check.py"]
  expect:
    type: Always
  on_failure: continue

- intent: branch on exit code
  action:
    type: Eval
    key: failed
    expr: "__exec_exit_code__ != '0'"
  expect:
    type: Always
```
