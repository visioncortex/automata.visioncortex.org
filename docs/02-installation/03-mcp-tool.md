---
title: Connecting Claude
sidebar_label: Connecting Claude
---

# Connecting Claude

`automata-agent` is an MCP server that exposes all ui-automata tools to Claude. It ships with the installer and supports two connection modes depending on which Claude client you use.

## Claude Code

Launch `automata-agent` by double-clicking it in `C:\Users\<you>\.ui-automata\`, or from PowerShell:

```powershell
automata-agent
```

The agent scans ports 3001–4000 for a free one, then prints the complete ready-to-paste MCP config to the terminal:

```
automata-agent started
port : 3001

MCP config (paste into .mcp.json, keep this window open):
{
  "mcpServers": {
    "ui-automata": {
      "type": "http",
      "url": "http://127.0.0.1:3001/mcp"
    }
  }
}
```

Copy the config block from the terminal (not from this page — the port may differ) and paste it into your `.mcp.json`. Keep the terminal window open while you work.

## Claude Desktop

Claude Desktop uses stdio instead of HTTP. Add the following to your `claude_desktop_config.json`, replacing `<you>` with your Windows username:

```json
{
  "mcpServers": {
    "ui-automata": {
      "command": "C:\\Users\\<you>\\.ui-automata\\automata-agent.exe",
      "args": ["--stdio"]
    }
  }
}
```

Claude Desktop launches `automata-agent` automatically — you do not need to start it manually. When it starts in stdio mode it also prints the equivalent HTTP config to the terminal, in case you want to switch modes later.

:::caution After editing the config

Claude Desktop must be **fully quit** before it will pick up the new config. Closing the window is not enough — Claude minimises to the taskbar. Right-click the Claude icon in the system tray and choose **Quit**, then relaunch it.

:::


## Which model to use

**Sonnet 4.6** is fast enough for interactive use: exploring a UI, running one-off actions, checking workflow status.

**Opus 4.6** reasons better about complex workflows and is the right choice when authoring multi-phase automations or debugging unexpected behaviour.

## Verify

Run the self-test to confirm all helper binaries are installed and runnable:

```powershell
automata-agent --self-test
```

Then ask Claude: *"list the ui-automata tools available to you"*. It should respond with the full tool list. If it does, the connection is working.

:::tip Before doing anything else

Ask Claude to read `CLAUDE.md` and the relevant workflows from the library before starting a task. This gives it the context it needs to work effectively without you having to explain the project each time.

In **Claude Code** (HTTP mode), the workflow library is exposed as MCP resources — Claude can browse and fetch them directly:

> *"Read the CLAUDE.md and the relevant workflows from the ui-automata resource list before we start."*

In **Claude Desktop** (stdio mode), use the built-in resources tool to fetch them:

> *"Use the resources tool to read CLAUDE.md and any relevant workflows from the ui-automata server before we start."*

Either way, a Claude that has read the library writes better workflows faster and makes fewer avoidable mistakes.

:::
