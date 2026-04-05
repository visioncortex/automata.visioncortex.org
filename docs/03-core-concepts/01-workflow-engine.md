---
title: The Workflow Engine
sidebar_label: Workflow Engine
---

# The Workflow Engine

## Overview

The name *Automata* is deliberate. An automaton is a state machine (a system that moves through defined states in response to inputs). A workflow is exactly that.

Each **phase** is a state. Execution follows a linear path through phases (that is the happy path). Phases can be skipped via preconditions, jumped to via flow control, or interrupted by recovery handlers when something goes wrong. The `finally` phase runs unconditionally at the end, regardless of how the workflow exits. Together these are the building blocks for any automation: a main path, conditional branches, loops, and guaranteed cleanup.

Workflows can also call other workflows as sub-workflows. Each sub-workflow is its own state machine, nested inside the caller's. State (anchors, variables) is scoped to the nesting level that introduced it and cleaned up automatically when that level exits.

## The Shortcomings of Traditional RPA

Traditional RPA tools share a common set of failure modes.

#### Coordinate-based interaction.

Most RPA tools record mouse clicks at screen coordinates or match pixels on screen. These break when the window moves, the display scaling changes, the font rendering differs, or the application is updated. The failure is silent: the click lands in the wrong place and the tool has no idea.

#### Timing assumptions ("click, sleep, pray")

Scripts insert `sleep()` calls between actions to wait for the UI to catch up. No sleep duration is both fast enough on a powerful machine and slow enough on a busy VM. The result is workflows that are either flaky (too short) or unnecessarily slow (too long).

#### No understanding of UI state

Scripts fire actions and move on. They have no model of what the application is doing. A click that was not received, a dialog that appeared, a loading spinner that didn't clear — the script does not know. It proceeds blindly.

#### No structured recovery

When something unexpected happens (an "overwrite?" dialog, a transient error box, a button that takes longer to enable than usual), scripts either crash or silently continue in a broken state. Edge cases are handled as ad-hoc `if` branches scattered throughout the code.

## Design Principles

The failure modes above point to what a reliable workflow engine must do. These are the principles UI Automata is built around.

#### Every action is an intent, not a command

A command says *do this*. An intent says *do this, and I expect to see that*. The difference is verifiability. If the expected outcome is not observed, the engine knows something went wrong and can act accordingly, rather than proceeding blindly into a broken state.

#### The UI is the source of truth

Don't assume a click worked. Don't assume a window is in the same state it was in 100ms ago. After every action, observe the UI to confirm the expected state has been reached. The poll interval is short (100ms); the timeout is generous (seconds to minutes, depending on the step). The UI is free to load at whatever pace it needs.

#### Recovery is domain knowledge

Every complex application has a finite set of things that can go wrong: error dialogs, save prompts, server-busy warnings, stale focus. This knowledge should be **declarative data**: a list of recovery handlers, each saying: *if I observe this condition, take these actions, then resume from where I was*. The executor applies them automatically whenever a step times out, without the step needing to know anything about recovery.

#### Workflows should be reusable and composable

A workflow that opens a file dialog should not have to be rewritten every time a different file needs to be opened. Parameters make workflows reusable: callers pass in values, the workflow operates on them. Sub-workflows make them composable: complex automations are built from smaller, tested pieces rather than monolithic scripts. Each sub-workflow is its own state machine with its own scope; the parent orchestrates, the children do the work.

## How UI Automata Is Different

### Semantic element locator

Elements are located by their role, accessible name, and AutomationId: properties that are stable across window positions, themes, and OS versions. When the engine clicks an element, it targets the element itself, not a point on screen. Clicks are also guarded: if the target element's bounding box is covered by another window, the click is refused rather than landing on the wrong target.

### Poll loop, not sleeps

Every step ends with a declared postcondition: what state the UI must be in before the workflow proceeds. The engine polls that condition every 100ms:

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

It proceeds the instant the condition is met, and bails cleanly if it is not met within the timeout. There is no dead reckoning: the workflow never blindly continues into a state it has not verified.

### Shadow DOM for UI State

The engine maintains a cached mirror of the live UIA element tree. Every element the engine interacts with is looked up in this mirror before acting. On staleness (when the app rebuilds its UI tree), the cache is automatically refreshed from the nearest live ancestor. The engine always operates against a known-good view of the UI.

### Structured recovery

Recovery handlers are declared conditions paired with corrective actions and a resume strategy:

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

A handler has three parts: a **trigger condition** (detect the unexpected state, e.g. a dialog popped up), **corrective actions** (e.g. dismiss the dialog), and a **resume strategy**. Handlers are checked local-first (phase scope) then global (workflow scope). A per-workflow cap (`max_recoveries`) prevents infinite recovery loops. This is exception handling for UI automation: the happy path stays clean; known edge cases are handled explicitly in one place.

## Engine Internals

**Anchors** are named, cached handles to live UI elements. They are resolved once and held across steps. On staleness, they are automatically re-resolved. See [Anchors](./04-anchors.md) for the full lifetime model.

**The shadow DOM** is a cached mirror of the UIA element tree. When the engine finds a descendant of a scoped anchor, it uses a three-tier lookup: cached live handle (1 COM call), narrowed re-query from the cached step-parent if stale, full DFS from the anchor root only as a last resort.

**Workflow variables** accumulate across steps. Values from `Extract`, `Eval`, and `Exec` are available to subsequent steps via `{output.*}`. Parameters are available as `{param.*}`. Sub-workflow output is merged into the parent's output on return.

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
