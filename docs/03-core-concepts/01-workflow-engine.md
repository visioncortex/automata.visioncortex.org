---
title: The Workflow Engine
sidebar_label: Workflow Engine
---

# The Workflow Engine

A workflow file is static YAML. The workflow engine is what runs it. Understanding what the engine does on each step — and what it does when something goes wrong — is the foundation for writing workflows that are reliable in practice, not just on the happy path.

## The execution model

The engine runs phases in order. Within each phase, it runs steps in order. Each step has the same lifecycle:

1. **Execute** the action (click, type, extract, etc.)
2. **Poll** the `expect` condition every 100ms
3. If the condition passes before the timeout: advance to the next step
4. If the timeout expires: check recovery handlers, then retry, skip, or fail

That polling loop is the core of the engine. There are no `sleep` calls. The engine does not guess how long to wait — it waits exactly as long as the UI takes to reach the expected state, up to the declared timeout.

## What the engine tracks

While a workflow runs, the engine maintains several pieces of state:

**Anchors** are named, cached handles to live UI elements. The engine resolves them lazily when first used and holds them for the lifetime of the phase or anchor tier. When a handle goes stale (because the app rebuilt its UI), the engine re-queries from the nearest live ancestor.

**The shadow DOM** is a cached mirror of the element tree. Rather than issuing a fresh UIA query on every step, the engine reuses cached structure and only re-queries the subtrees it has reason to believe have changed.

**Workflow variables** accumulate across steps. Extracted values, evaluated expressions, and parameter substitutions are all stored here and available to subsequent steps by name.

## What happens on timeout

A timeout is not an immediate failure. Before failing the step, the engine checks the declared recovery handlers in order. Each handler specifies a trigger condition — "is there an unexpected dialog on screen?", "is the target element still disabled?" — and if the trigger matches, the engine runs the handler's corrective actions and then resumes according to the handler's strategy: retry the step, skip it, or fail the workflow.

If no handler matches, the step fails and the workflow stops.

This design separates the common case (things go as expected) from the exceptional case (something interrupted the flow). The happy path stays clean; edge cases are handled explicitly and in one place.

## How phases fit in

Phases are the unit of lifecycle management. When a phase starts, it mounts its declared anchors — resolving their handles and making them available as `scope` targets in actions and conditions. When the phase ends, anchors listed in `unmount:` are released. Root anchors are the exception: they cannot be unmounted and persist for the entire workflow, locked to the original window handle.

This means anchor lifetime is explicit. Only anchors you declare in `unmount:` are released at phase end; everything else stays live until the workflow finishes.

## The anatomy of a workflow file

For reference, a workflow file has the following top-level structure:

```yaml
name:              # unique identifier
description:       # what this workflow does
params:            # input parameters with defaults
outputs:           # named values to return to the caller
launch:            # optional: application to open before running
anchors:           # named UI element handles and their lifetime tiers
defaults:          # default timeout and retry policy
recovery_handlers: # global handlers for known bad states
phases:            # ordered list of execution phases
```

The pages that follow cover each of these in depth.
