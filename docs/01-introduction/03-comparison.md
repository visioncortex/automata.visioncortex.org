---
title: How it compares
sidebar_label: Comparison
---

# How it compares

ui-automata occupies a specific niche in the desktop automation landscape. Here is how it differs from the tools you may already know.

## vs. AutoHotkey

AutoHotkey is a scripting language for Windows automation that has been around since 2003. It works, and for simple keyboard macros it is still a reasonable choice. The problems start when you need reliability: AutoHotkey scripts click at pixel coordinates or use window handles that go stale, `Sleep` calls to wait for things to load, and no structured way to detect or recover from failures. A script that works on your machine at 1080p breaks on a machine at 1440p. There is no audit trail, no recovery, and no way for an agent to inspect what went wrong.

## vs. UIPath / Power Automate

RPA platforms like UIPath and Power Automate are built for high-volume, pre-scripted business processes. They work well when every edge case is known in advance and the workflow can be authored by a specialist. They are not built for delegation: sending an agent to handle a task that requires judgment, exploration, or adaptation is outside their model. They are also expensive and slow to author: a UIPath workflow for a 10-step task takes hours to build with their visual designer. ui-automata workflows take minutes to write in YAML.

## vs. Selenium / Playwright

Selenium and Playwright automate web browsers. They are excellent at what they do. They do not work for native Windows applications: Win32, WPF, WinForms, Delphi, CAD software, legacy enterprise apps. If the thing you want to automate lives outside a browser, they are not an option.

## vs. PyAutoGUI / pywinauto

PyAutoGUI takes screenshots and clicks at pixel coordinates (the same fundamental problem as vision, without the intelligence). pywinauto wraps Windows UI Automation in Python and is closer in spirit to ui-automata, but it is imperative: you write loops, sleeps, and try/except blocks by hand. There is no declarative intent, no structured expect/recovery model, and no MCP interface for agents.

## vs. Vision-Based Agents (Computer Use, etc.)

Vision-based agents are useful for exploration and for tasks that genuinely require visual reasoning (reading a chart, identifying an image, handling a UI that has no UIA support at all). They are not the right tool for repeated execution: they are slow, expensive per run, fragile to layout changes, and produce no structured audit trail. See [Why not vision?](./02-why-not-vision) for a detailed breakdown.

## Summary

| | UI Automata | AutoHotkey | UIPath | Selenium | Vision agents |
|---|---|---|---|---|---|
| Native Windows apps | ✓ | ✓ | ✓ | ✗ | ✓ |
| Structured recovery | ✓ | ✗ | partial | ✗ | ✗ |
| Agent-native | ✓ | ✗ | ✗ | ✗ | ✓ |
| Audit trail | ✓ | ✗ | ✓ | partial | ✗ |
| Execution speed | fast | fast | fast | fast | slow |
| Cost per run | low | low | high | low | high |
| Resolution-stable | ✓ | ✗ | partial | — | ✗ |
