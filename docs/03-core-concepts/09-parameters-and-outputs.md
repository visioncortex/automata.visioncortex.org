---
title: Parameters and Outputs
sidebar_label: Params & Outputs
---

# Parameters and Outputs

Workflows are reusable. Parameters let callers pass values in; outputs let workflows return structured data back to the caller (whether that is another workflow, an MCP tool call, or a test assertion).

## Declaring Parameters

Parameters are declared at the top of the workflow file:

```yaml
params:
  - name: search_term
    description: The term to search for
  - name: output_dir
    description: Directory to write results to
    default: "{env.USERPROFILE}\\Documents\\"
```

| Field | Required | Description |
|---|---|---|
| `name` | yes | Parameter name; referenced as `{param.name}` |
| `description` | no | Human-readable description |
| `default` | no | Default value; omit to make the parameter required |

Default values support environment variable expansion via `{env.VAR_NAME}`. This is useful for user-specific paths that should not be hardcoded:

```yaml
default: "{env.USERPROFILE}\\Documents\\"
```

Parameters without a `default` must be supplied at runtime. Missing required parameters are a fatal error at workflow start.

## Referencing Parameters

Use `{param.name}` in any string field of the workflow YAML: selectors, intent strings, text fields, file paths, script arguments.

```yaml
- intent: type the search term
  action:
    type: TypeText
    scope: search_box
    selector: ">> [role=edit]"
    text: "{param.search_term}"
  expect:
    type: Always

- intent: run the export script
  action:
    type: Exec
    command: python
    args:
      - "{workflow.dir}\\export.py"
      - "--output"
      - "{param.output_dir}"
  expect:
    type: ExecSucceeded
```

`{workflow.dir}` is a built-in variable that expands to the directory containing the workflow YAML file itself, not the process working directory. Use it to reference scripts or assets that live alongside the workflow, so paths stay correct regardless of where `ui-workflow` is invoked from.

Substitution happens before YAML parsing, so parameters can appear in selectors as well:

```yaml
selector: ">> [role=list item][name={param.folder}]"
```

## Declaring Outputs

Outputs are declared at the top of the workflow file:

```yaml
outputs:
  - name: saved_file
    description: Path to the saved file
  - name: record_count
```

When `outputs:` is present, only the listed keys are returned to the caller when this workflow is used as a subflow. Keys produced by `Extract` or `Eval` that are not listed are workflow-local and discarded on return.

When `outputs:` is absent, all extracted keys are returned (backwards-compatible behaviour).

## Extracting Values into Outputs

Use the `Extract` action to read a value from a UI element. Use `EvalCondition` as the `expect` to verify the extraction actually produced something (`Always` will succeed even if the element was empty):

```yaml
- intent: read the export file path
  action:
    type: Extract
    key: saved_file
    scope: dialog
    selector: ">> [role=edit][name=Filename]"
    attribute: value
  expect:
    type: EvalCondition
    expr: "output.saved_file != ''"
```

Use `Eval` to compute a value:

```yaml
- intent: compute full save path
  action:
    type: Eval
    key: full_path
    expr: "param.output_dir + output.saved_file"
  expect:
    type: Always
```

Use `WriteOutput` to write output values to a file:

```yaml
- intent: write todo items to a file
  action:
    type: WriteOutput
    key: todo_items
    path: "{param.output_dir}todos.csv"
  expect:
    type: Always
```

## Using Outputs

Once written, an output key is available as `{output.key}` in all subsequent steps, conditions, and Eval expressions within the same workflow and any subflows it calls.

## Passing Parameters at Runtime

From the CLI, use `--` to separate the engine's own flags from the workflow parameters. Everything after `--` is passed through to the workflow rather than being interpreted by the engine (the same convention used by Cargo and many Unix tools):

```powershell
ui-workflow my_workflow.yml -- --search_term quarterly_report --output_dir C:\Reports
```

Without `--`, flags like `--search_term` would be parsed by the engine itself and produce an unknown-flag error. The `--` acts as a boundary: "stop processing my flags here, pass the rest to the workflow."

From the MCP tool, pass a `params` map in the `run_workflow` call.
