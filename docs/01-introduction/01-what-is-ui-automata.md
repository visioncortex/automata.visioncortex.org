---
title: What is UI Automata?
sidebar_label: What is UI Automata?
---

# What is UI Automata?

UI Automata is a declarative workflow engine for Windows UI automation, designed from the ground up for AI agents. Instead of writing scripts that click at coordinates or sleep-and-hope, you describe what should happen. The engine handles action, recovery, and observability.

## The Delegation Problem

There is a category of work that is too interactive to automate with a traditional script, and too tedious to keep doing by hand. Checking a service status in Event Viewer. Extracting a value from a legacy desktop application. Configuring a settings dialog that has no API. These tasks require judgment (but not much of it). They are exactly the kind of thing you would hand off to a capable colleague.

AI agents can be that colleague. But today, "computer use" usually means an agent staring at screenshots, guessing where to click, and hoping nothing moved. That approach is slow, expensive, and breaks the moment the window is a pixel off.

UI Automata is a different answer: give the agent a structured, reliable interface to the Windows UI (fast, auditable, and recoverable) so it can act with the same confidence a human would.

## How It Works

You write a workflow in YAML. Each step has three parts: an **action** (what to do), an **expect** (what state the UI should be in afterward), and optionally a **recovery** (what to do if something goes wrong).

```yaml
- intent: click the Save button
  action:
    type: Click
    scope: main_window
    selector: ">> [role=button][name=Save]"
  expect:
    type: DialogPresent
    scope: main_window
  timeout: 10s
```

The engine executes the action, then polls the `expect` condition every 100ms. If the condition passes, it moves to the next step. If the timeout expires, it checks declared recovery handlers (for example, a "File already exists?" dialog that needs to be dismissed) before retrying or failing cleanly.

There are no sleeps. No guessing. No silent failures.

## Key Properties

**Declarative.** You describe goals, not procedures. The engine handles the polling loop, the retry logic, and the anchor lifecycle.

**Observable.** Every step carries an `intent` field: a human-readable description of what it is trying to do. The engine logs every step with its outcome, giving you and your agent a full structured trace to reason about.

**Recoverable.** Timeouts are not failures by default. A recovery handler can detect a known bad state (a popup, a transient disabled button, a stale dialog) and correct it automatically before retrying the step.

**Agent-native.** The MCP interface lets an AI agent inspect a live Windows UI, author workflow steps interactively, run them immediately, and promote working steps into a reusable workflow file. The entire loop (explore, script, verify, save) happens in a conversation.

## Who It Is For

**IT and support teams** that want an agent to handle interactive Windows tasks (checking service state, gathering diagnostics, configuring software) without having to RDP in manually.

**Developers** building automations for Windows-only applications that have no REST API, no CLI, and no automation hook beyond what Windows UI Automation exposes.

**Anyone** who has a desktop task they would rather delegate than do themselves.
