---
title: Why not pure vision-based computer use?
sidebar_label: Why not vision?
---

# Why not pure vision-based computer use?

Vision-based computer use (where an AI model looks at screenshots and decides where to click) is the obvious first approach to desktop automation. It works, up to a point. ui-automata takes a different path, and the reasons are worth understanding.

## Speed

Each vision step requires a screenshot, a round-trip to an inference API, and time to parse the response. Windows UI Automation queries are local and take milliseconds. A workflow that opens a file, reads three fields, and closes the dialog might need 8–10 steps. With UIA, that is under a second total. With vision, the time adds up fast — and inference models, while improving, will always carry that structural overhead.

For a one-off task the difference may not matter. For anything you run repeatedly or at scale, it does.

## Repeatability

Vision models infer intent from pixels. Pixel coordinates shift when the window is resized, when the user changes their display scaling, when the application is updated, or when a different language pack is installed. Every one of these breaks a vision-based automation silently: the model clicks in the wrong place and continues as if nothing happened.

UIA selectors target semantic properties: the element's role, its name, its automation ID. These survive resolution changes, theme changes, and most application updates. A selector that worked last week still works today.

## Cost Per Run

Vision inference is billed per token and per image. A logical "10-step" workflow generates far more than 10 screenshots in practice: activating a menu requires a screenshot, waiting for the submenu to appear requires another, clicking an item requires another. Each intermediate UI state the agent needs to observe is a separate inference call. At any meaningful run frequency, those costs add up.

UIA queries run locally on the Windows machine. Once the workflow is written, there is no inference cost to execute it.

## When Vision Comes into Play

Vision and ui-automata complement each other well. The typical pattern:

1. An agent uses the vision tool to explore an unfamiliar UI, understand its structure, and draft the initial workflow steps.
2. Those steps get written into a `.yml` workflow file and validated.
3. From that point on, every run is pure UIA: fast, deterministic, zero inference cost.

You get the exploratory flexibility of vision during authoring, and the speed and reliability of structured automation during execution.
