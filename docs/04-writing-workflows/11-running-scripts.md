---
title: Running External Scripts
sidebar_label: Running Scripts
---

# Running External Scripts

The `Exec` action runs any executable on the Windows machine: Python scripts, PowerShell, batch files, or any program reachable via `PATH`. This is the bridge between the workflow engine and the broader scripting ecosystem.

## Basic Usage

```yaml
- intent: run post-processing script
  action:
    type: Exec
    command: python
    args:
      - "{workflow.dir}\\process.py"
      - "--input"
      - "{output.exported_file}"
  expect:
    type: ExecSucceeded
```

`command` is resolved via `PATH`. `args` are passed as a list — no shell quoting required. `ExecSucceeded` checks that the process exited with code 0.

Use `{workflow.dir}` to locate scripts that live alongside the workflow file. This works regardless of the directory the executor was launched from.

## Passing Workflow Data to a Script

`{output.*}` and `{param.*}` tokens are substituted in both `command` and `args` before the process is spawned:

```yaml
- intent: post-process the exported file
  action:
    type: Exec
    command: python
    args:
      - "{workflow.dir}\\process.py"
      - "--input"
      - "{output.exported_path}"
      - "--output-dir"
      - "{param.output_dir}"
  expect:
    type: ExecSucceeded
```

## Capturing Script Output

Set `key` to capture the process's stdout. Each line of output is stored as a separate value under the key:

```yaml
- intent: get the computed result from the script
  action:
    type: Exec
    command: python
    args:
      - "{workflow.dir}\\compute.py"
      - "{output.input_data}"
    key: result
  expect:
    type: ExecSucceeded
```

The captured value is available as `{output.result}` in subsequent steps.

## Writing Extracted Data to a File

When a workflow has extracted multiple values from the UI — a list of items, a set of row labels, a tree of names — you often need to pass that data to a script. `WriteOutput` writes all values stored under a key to a file, one CSV-quoted line per value:

```yaml
- intent: extract all toolpath names from the tree
  action:
    type: Extract
    key: toolpaths
    scope: toolpaths_tree
    selector: "> [role='tree item'] > * > [role='tree item']"
    attribute: name
    multiple: true
  expect:
    type: EvalCondition
    expr: "output_count('toolpaths') > 0"

- intent: write toolpath names to a file for the script
  action:
    type: WriteOutput
    key: toolpaths
    path: "{param.output_dir}toolpaths.csv"
  expect:
    type: Always

- intent: run post-processing script
  action:
    type: Exec
    command: python
    args:
      - "{workflow.dir}\\stitch.py"
      - "--toolpaths"
      - "{param.output_dir}toolpaths.csv"
  expect:
    type: ExecSucceeded
```

`WriteOutput` creates or truncates the file. Each stored value becomes one quoted line — safe to read back as a CSV from Python.

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

## Combining UI Automation and Scripting

A workflow can drive a GUI application to produce data, write it to a file, hand it to a Python script for processing, then use the script's output in subsequent UI steps. The full power of the Python ecosystem is available at any point in the workflow — data transformation, file format conversion, API calls, or anything else that is easier to express in code than in YAML.
