---
title: Running External Scripts
sidebar_label: Running Scripts
---

# Running External Scripts

The `Exec` action runs any executable on the Windows machine: Python scripts, PowerShell, batch files, or any program reachable via `PATH`. This is the bridge between the workflow engine and the broader scripting ecosystem.

## Basic usage

```yaml
- intent: run post-processing script
  action:
    type: Exec
    command: python
    args:
      - "C:\\scripts\\process.py"
      - "--input"
      - "{output.exported_file}"
  expect:
    type: ExecSucceeded
```

`command` is resolved via `PATH`. `args` are passed as a list — no shell quoting required. `ExecSucceeded` checks that the process exited with code 0.

## Passing workflow data to a script

`{output.*}` and `{param.*}` tokens are substituted in both `command` and `args` before the process is spawned. This means you can pass extracted UI values directly to a script:

```yaml
- intent: export data from the CAD application
  action:
    type: Extract
    key: exported_path
    scope: app
    selector: ">> [role=edit][name='Output file']"
    attribute: text
  expect:
    type: Always

- intent: post-process the exported file
  action:
    type: Exec
    command: python
    args:
      - "{param.script_path}"
      - "--input"
      - "{output.exported_path}"
      - "--output-dir"
      - "{param.output_dir}"
  expect:
    type: ExecSucceeded
```

## Capturing script output

If you set `key`, the process's stdout is captured and stored in the output buffer — one entry per line:

```yaml
- intent: get list of installed packages
  action:
    type: Exec
    command: python
    args: ["-m", "pip", "list", "--format=freeze"]
    key: installed_packages
  expect:
    type: ExecSucceeded
```

The captured lines are available as `{output.installed_packages}` in subsequent steps and returned as a workflow output if declared.

## PowerShell

PowerShell scripts work the same way:

```yaml
- intent: query service status
  action:
    type: Exec
    command: powershell
    args:
      - "-Command"
      - "Get-Service -Name '{param.service_name}' | Select-Object -ExpandProperty Status"
    key: service_status
  expect:
    type: ExecSucceeded
```

## Combining UI automation and scripting

This is where ui-automata becomes more than a click tool. A workflow can drive a GUI application to produce a file, then hand that file off to a Python script for processing, then use the script's output in subsequent UI steps. The full power of the Python ecosystem is available at any point in the workflow.
