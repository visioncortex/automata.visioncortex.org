---
title: The Workflow Engine
sidebar_label: Workflow Engine
---

# The Workflow Engine

The name *Automata* is deliberate. An automaton is a state machine — a system that moves through defined states in response to inputs. A workflow is exactly that.

Each **phase** is a state. Execution follows a linear path through phases — that is the happy path. Phases can be skipped via preconditions, jumped to via flow control, or interrupted by recovery handlers when something goes wrong. The `finally` phase runs unconditionally at the end, regardless of how the workflow exits. Together these give you: a main path, conditional branches, loops, and guaranteed cleanup — the full vocabulary of a state machine.

Workflows can also call other workflows as sub-workflows. Each sub-workflow is its own state machine, nested inside the caller's. State (anchors, variables) is scoped to the nesting level that introduced it and cleaned up automatically when that level exits.

## Every Step is an Action + an Observable Postcondition

The central design decision of the engine is this: **every step declares not just what to do, but what the UI must look like afterward.**

```yaml
- intent: click Save
  action:
    type: Click
    scope: toolbar
    selector: ">> [name=Save]"
  expect:
    type: ElementFound
    scope: status_bar
    selector: ">> [name~=Saved]"
  timeout: 10s
```

The action fires once. The engine then polls the `expect` condition every 100ms until it is satisfied or the timeout expires. There are no `sleep` calls — the engine waits exactly as long as the UI takes, no more, no less.

This is fundamentally different from a script that does `click(); sleep(2); assert_title()`. A sleep either waits too long (slow) or not long enough (flaky). The poll loop eliminates both failure modes: it proceeds the instant the UI is ready, and it retries up to the declared timeout if it is not.

## What Happens on Failure: Structured Recovery

### Recovery Handler

A timeout does not immediately fail the step. Before giving up, the engine evaluates the declared recovery handlers in order:

```
step times out
  └─ check recovery handlers
       ├─ trigger condition matches?
       │    └─ run corrective actions
       │         ├─ RetryStep  → re-execute the original action and re-poll
       │         ├─ SkipStep   → treat the step as passed and move on
       │         └─ Fail       → fail the workflow
       └─ no handler matches?
            └─ check fallback action    → re-poll with fresh timeout
                 └─ still not satisfied → apply on_failure policy (abort or continue)
```

A recovery handler has three parts:
- A **trigger condition** — a UIA query or expression that detects the unexpected state (e.g., "is there an unknown dialog blocking the window?")
- **Corrective actions** — steps to clear that state (e.g., dismiss the dialog)
- A **resume strategy** — `retry_step`, `skip_step`, or `fail`

Handlers are checked local-first (phase scope) then global (workflow scope), so phase-specific cases take priority over general ones. A per-workflow cap (`max_recoveries`) prevents infinite recovery loops.

This model keeps the happy path clean. Unexpected UI states are handled in one explicit place, not scattered through the workflow as defensive checks.

### Fallback Actions

A step can also declare a `fallback` action — a secondary action to try if the primary action fails and no recovery handler matches. The engine runs the fallback and re-polls `expect` with a fresh timeout. If the fallback also fails to satisfy the condition, `on_failure` determines the outcome.

### Flow Control

Two flags modify a step's standard behaviour:

| Flag | Values | Effect |
|---|---|---|
| `on_failure` | `abort` (default), `continue` | Whether a failed step stops the workflow or is skipped |
| `on_success` | `continue` (default), `return_phase` | Whether success advances to the next step or exits the current phase immediately |

`on_failure: continue` is useful for optional steps — probing for a state that may or may not exist. `on_success: return_phase` is useful for early exits: if a condition is already satisfied before the phase's main work, skip the remaining steps.

## What the Engine Maintains

The engine maintains three pieces of state across steps:

**Anchors** are named, cached handles to live UI elements. They are resolved once (lazily on first use or eagerly at mount, depending on tier) and held across steps. On staleness, they are automatically re-resolved — the engine does not require you to re-find elements whose handles have been invalidated by a UI redraw. See [Anchors](./04-anchors.md) for the full lifetime model.

**The shadow DOM** is a cached mirror of the UIA element tree. When the engine needs to find a descendant of a scoped anchor, it uses a three-tier lookup: a cached live handle (1 COM call), a narrowed re-query from the cached step-parent if the handle is stale, and a full DFS from the anchor root only as a last resort. This avoids redundant tree traversals across repeated steps on the same UI.

**Workflow variables** accumulate across steps. Values written by `Extract`, `Eval`, and `Exec` actions are available to all subsequent steps via `{output.*}` substitution. Parameters passed at invocation are available as `{param.*}`. Variables are scoped to the workflow or sub-workflow that wrote them; output from sub-workflows is merged into the parent's output on return.

## The Anatomy of a Workflow File

| Field | Description |
|---|---|
| `name` | Unique identifier |
| `description` | What this workflow does |
| `params` | Input parameters with defaults |
| `outputs` | Named values to return to the caller |
| `launch` | Optional: application to open before running |
| `anchors` | Named UI element handles and their lifetime tiers |
| `defaults` | Default timeout and retry policy |
| `recovery_handlers` | Global handlers for known bad states |
| `phases` | Ordered list of execution phases |

The pages that follow cover each of these in depth.
