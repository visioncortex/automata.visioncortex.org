---
title: Windows Settings
sidebar_label: Windows Settings
---

# Windows Settings

<video controls width="100%" style={{borderRadius: '8px', marginBottom: '1.5rem'}}>
  <source src="/video/windows-settings.mp4" type="video/mp4" />
</video>

Windows Settings is a UWP app hosted by `ApplicationFrameHost.exe`, anchored by window title (`[name=Settings]`). These workflows navigate the modern Settings panels introduced in Win10 and expanded in Win11.

## `settings_about`

Opens Settings and navigates to **System › About**, which shows device specifications: CPU, RAM, storage, device name, Windows edition, and OS build number.

No parameters. Useful for inventory or environment reporting steps within a larger workflow.
