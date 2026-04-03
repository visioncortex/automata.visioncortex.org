---
title: Installation
sidebar_label: Installation
---

# Installation

One PowerShell command installs everything: the workflow engine, the MCP tool, and the workflow library.

## Install

Open PowerShell on your Windows machine and run:

```powershell
PowerShell -ExecutionPolicy Bypass -Command "iwr https://raw.githubusercontent.com/visioncortex/ui-automata/refs/heads/main/install/install-windows.ps1 | iex"
```

Or download the script first if you prefer to inspect it before running:

```powershell
# Download
iwr https://raw.githubusercontent.com/visioncortex/ui-automata/refs/heads/main/install/install-windows.ps1 -OutFile install-windows.ps1

# Review, then run
PowerShell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

The installer downloads the latest binaries and places them in `C:\Users\<you>\.ui-automata\`, which is added to your `PATH` automatically.

## Verify

Open a new PowerShell window and run the self-test to confirm all helper binaries are present:

```powershell
automata-agent --self-test
```

Then run the bundled Notepad demo to confirm the workflow engine works end-to-end. Pick the folder that matches your Windows version:

```powershell
# Windows 11
ui-workflow $env:USERPROFILE\.ui-automata\workflows\win11\notepad\notepad_demo.yml

# Windows 10
ui-workflow $env:USERPROFILE\.ui-automata\workflows\win10\notepad\notepad_demo.yml
```

You should see Notepad open, some text typed, and the workflow complete successfully. If it does, you are ready to go.
