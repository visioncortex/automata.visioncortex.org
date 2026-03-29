---
title: File and System Operations
sidebar_label: File & System
---

# File and System Operations

Beyond UI automation, ui-automata exposes file system and system command capabilities on the connected Windows machine — useful for reading logs, moving artifacts, running scripts, and gathering diagnostics as part of a larger agent workflow.

## File operations

The `file` tool covers the full range of filesystem operations: list, read, write, append, copy, move, delete, mkdir, rmdir, stat, glob, and checksum.

**Access restrictions:** all write operations — `write`, `append`, `copy`, `move`, `delete`, `rmdir` — are restricted to paths under `%USERPROFILE%`. The restriction is enforced in the server; attempts to write outside the home directory return an explicit access-denied error. Read operations (`read`, `read_lines`, `list`, `stat`, `glob`, `checksum`) are unrestricted and can access any path the Windows user account can reach, including system folders.

## Clipboard

The `clipboard` tool reads and writes the Windows clipboard. Useful for extracting content that is easier to copy than to read via UIA, or for injecting data into an application via paste.

## Executing commands

The `system exec` action runs a program directly — pass the program and arguments as an array, no shell involved. `cmd.exe`, `powershell.exe`, and `bash.exe` (Git for Windows) are handled with sensible defaults auto-configured.

```
system exec ["powershell.exe", "Get-Service -Name Spooler | Select Status"]
system exec ["cmd.exe", "dir /b C:\\Users\\chris\\Documents"]
```

## System information

`system` also provides: current username and home directory (`whoami`), running process list (`list_processes`), process termination (`kill_process`), network config (`ipconfig`, `route_table`), and PATH lookup (`get_path`).

## Security considerations

The file and system tools give an agent broad access to the Windows machine. Some things to be aware of:

- **Reads are unrestricted.** The agent can read files anywhere the Windows user account can reach, including `C:\Windows\System32` and other system directories. Diagnostic tasks often need to read logs or configs outside the home directory.
- **All writes are restricted to `%USERPROFILE%`.** Write, append, copy, move, delete, and rmdir are blocked at the protocol level if the target path is outside the home directory.
- **`system exec` is unrestricted.** It runs arbitrary programs with the full privileges of the Windows user account — anything the user can do, the agent can do via `exec`. There is no allowlist. Treat it the same as giving shell access.

These tools are designed for agents operating in a controlled environment — a dedicated Windows VM or a machine where the risk profile is acceptable. For sensitive environments, consider whether you need all capabilities enabled.
