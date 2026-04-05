---
title: The Shadow DOM
sidebar_label: Shadow DOM
---

# The Shadow DOM

The shadow DOM is the engine's cached mirror of the live Windows UI element tree. It is the core of what makes ui-automata fast and reliable: fast enough to react to UI transitions in well under a second, and reliable enough to stay locked to the right window even when the desktop is busy.

## The Problem with Raw UIA

Before we can explain the shadow DOM, it helps to understand what life without it looks like.

Windows UI Automation is a cross-process RPC protocol. Every query (for example, "find the button named Save inside this window") is a round-trip to the target process. If you need to walk a path of nested elements (`window → panel → toolbar → button`), each step in that path is a separate cross-process call. An application with deep element trees can take hundreds of milliseconds just to resolve a single element path.

Traditional automation tools pay this cost on every step. Run a 20-step workflow and you are making 20+ round-trips, each one slow and each one re-discovering structure the tool already found on the previous step.

This is not fast enough for fluid automation. It is also fragile: if the application is momentarily busy (loading data, animating a transition), the query may return incomplete results or fail outright.

## How the Shadow DOM Solves It

ui-automata resolves each anchor once, caches the live element handle, and reuses it for every subsequent step. No re-traversal. No redundant round-trips. A cached handle lookup is effectively free compared to a cross-process UIA query.

The result: step execution is no longer bottlenecked by element resolution. When a button exists and is ready, the workflow clicks it in milliseconds, faster than any human can observe. The 100ms polling loop is the pace limit, not the element lookup.

This is the inverse of React's virtual DOM. React maintains a virtual tree to efficiently *write to* a UI it controls. The shadow DOM maintains a virtual tree to efficiently *read from* a UI it does not control.

## HWND Locking: Staying Bound to the Right Window

Speed is only half the problem. The other half is identity.

Imagine a workflow targeting a document editor. The user has a browser window in the background. Midway through the workflow, a notification pops up and the browser steals focus. Without identity tracking, a selector like `[name~=MyApp]` might now match a browser window that happens to have "MyApp" in its title. The workflow keeps running, against the wrong window.

HWND locking prevents this.

When a Root anchor is first resolved, the engine records the exact HWND (operating system window handle) of the matched window. Every subsequent resolution goes directly to that HWND, bypassing the selector entirely. No matter what happens to the desktop:

- Another window steals focus: the anchor is still bound to the original HWND
- The application changes its title during navigation: the anchor does not drift
- A new window with a similar title opens: it is ignored

A Root anchor is not "the window that currently matches this selector." It is "this specific window, forever." If that window is destroyed, the anchor fails with a fatal error rather than silently attaching to something else.

## What the Shadow DOM Stores

The shadow DOM holds four things:

- **defs**: the declared anchor topology (names, selectors, parent relationships, tiers)
- **nodes**: the cached element handles, keyed by anchor name
- **snapshots**: last-known tree snapshots per anchor, used to detect UI changes
- **locks**: the HWND and PID captured on first resolution of each Root anchor

## Lazy Resolution

Stable anchors are not resolved at mount time. The engine resolves them on first use and caches the result. A Stable anchor pointing at a panel that has not appeared yet does not block the phase from starting: it is resolved the first time a step references it as `scope`.

Root anchors are the exception: they are resolved immediately on first mount, because a missing application window is an unrecoverable error that should fail fast.

## Stale Handle Recovery

UIs are not static. A document panel reloads when the user saves. A toolbar refreshes when mode changes. When this happens, the cached handles pointing into that subtree go stale: the elements they reference have been destroyed and recreated.

The engine detects staleness when it tries to use a cached handle and the UIA call fails. Rather than failing the step, it walks up the element tree to find the nearest live ancestor, then re-queries downward from there. The Stable anchor is silently re-resolved, and the step proceeds as if nothing happened.

The behavior differs by tier:

| Tier | On stale |
|---|---|
| `Root` | Fatal error: the application window is gone |
| `Session` | Non-fatal; re-resolved on next use |
| `Stable` | Re-queried automatically from nearest live ancestor |
| `Ephemeral` | Released when its phase exits |

This walk-up strategy is why well-structured workflows rarely need explicit anchor re-mounting. The engine handles transient UI rebuilds automatically.

## Subflow Depth Scoping

Stable and Ephemeral anchors are scoped to the subflow that declares them — a child workflow's anchors do not conflict with parent anchors of the same name. Root and Session anchors are shared across all depths: if a subflow declares an anchor with the same name as one already mounted by the parent, the parent's cached handle is reused. No duplicate resolution, no duplicate element tree.
