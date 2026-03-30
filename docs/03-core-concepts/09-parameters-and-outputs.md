---
title: Parameters and Outputs
sidebar_label: Params & Outputs
---

# Parameters and Outputs

Workflows are reusable. Parameters let callers pass values in; outputs let workflows return structured data back to the caller — whether that is another workflow, an MCP tool call, or a test assertion.

## Declaring Parameters

Parameters are declared at the top of the workflow file:

```yaml
params:
  - name: search_term
    description: The term to search for
  - name: output_dir
    description: Directory to write results to
    default: "C:\\Users\\Public\\Documents"
```

| Field | Required | Description |
|---|---|---|
| `name` | yes | Parameter name; referenced as `{param.name}` |
| `description` | no | Human-readable description |
| `default` | no | Default value; omit to make the parameter required |

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

Use the `Extract` action to read a value from a UI element. Use `EvalCondition` as the `expect` to verify the extraction actually produced something — `Always` will succeed even if the element was empty:

```yaml
- intent: read the export file path
  action:
    type: Extract
    scope: dialog
    selector: ">> [role=edit][name=Filename]"
    key: saved_file
    attribute: value
  expect:
    type: EvalCondition
    expr: "output.saved_file != ''"
```

Use `Eval` to compute a value:

```yaml
- intent: build the output path
  action:
    type: Eval
    key: output_path
    expr: "{param.base_dir}\\{output.app_name}_export.csv"
  expect:
    type: Always
```

Use `WriteOutput` to write a value directly without computation:

```yaml
- intent: record the final status
  action:
    type: WriteOutput
    key: status
    value: "complete"
  expect:
    type: Always
```

## Using Outputs

Once written, an output key is available as `{output.key}` in all subsequent steps, conditions, and Eval expressions within the same workflow and any subflows it calls.

## Passing Parameters at Runtime

From the CLI:

```powershell
ui-workflow my_workflow.yml --param search_term=quarterly_report --param output_dir=C:\Reports
```

From the MCP tool, pass a `params` map in the `run_workflow` call.
