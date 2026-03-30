---
title: Extracting Data
sidebar_label: Extracting Data
---

# Extracting Data

Many workflows do not just drive a UI — they read from it. The `Extract` action reads a value from a UI element and stores it under a named key. That key is then available as `{output.key}` in every subsequent step, condition, and expression.

## Extract a Single Value

```yaml
- intent: read the current filename
  action:
    type: Extract
    key: filename
    scope: save_dialog
    selector: ">> [role='combo box'][name='File name:'] >> [role=edit]"
    attribute: text
  expect:
    type: EvalCondition
    expr: "output.filename != ''"
```

Use `EvalCondition` as `expect` to verify the extraction actually produced something. `Always` would succeed even if the element was empty or the selector matched nothing meaningful.

## Attribute Types

| Attribute | Reads |
|---|---|
| `text` *(default)* | The ValuePattern text, falling back to the Name property. Use for edit fields and value-bearing controls. |
| `name` | The UIA Name property — the element's accessible label or caption. |
| `inner_text` | Direct children's names joined by newlines. Useful for composite controls like list items or tooltips where the meaningful content lives in child elements. |

## Extract, Compute, Reuse

The real power of extraction is what you can do with the value once you have it. A common pattern: read a value from the UI, compute a derived value, then use it to drive a subsequent action.

Here is a concrete example: a Save As dialog shows a default filename. The workflow needs to prepend an output directory — without knowing the filename in advance.

```yaml
anchors:
  save_dialog:
    type: Session
    selector: "[name='Save As']"

phases:
  - name: save_to_output_dir
    mount: [save_dialog]
    steps:
      - intent: extract the default file name before saving
        action:
          type: Extract
          key: saved_file
          scope: save_dialog
          selector: ">> [role='combo box'][name='File name:'] >> [role=edit]"
          attribute: text
        expect:
          type: EvalCondition
          expr: "output.saved_file != ''"

      - intent: compute full save path
        action:
          type: Eval
          key: full_path
          expr: "param.output_dir + output.saved_file"
        expect:
          type: Always

      - intent: set full path in file name field
        action:
          type: SetValue
          scope: save_dialog
          selector: ">> [role='combo box'][name='File name:'] >> [role=edit]"
          value: "{output.full_path}"
        expect:
          type: ElementHasText
          scope: save_dialog
          selector: ">> [role='combo box'][name='File name:'] >> [role=edit]"
          pattern:
            contains: "{output.full_path}"
```

Three steps: extract the default name, build the full path with `Eval`, write it back with `SetValue`. The `expect` on the final step verifies the field actually contains the computed value before the workflow proceeds.

## Extract Multiple Values

Set `multiple: true` to extract all matching elements. The values are stored as a list under the key.

```yaml
- intent: extract all row labels from the results table
  action:
    type: Extract
    key: row_labels
    scope: results_panel
    selector: ">> [role=list item]"
    attribute: name
    multiple: true
  expect:
    type: EvalCondition
    expr: "output_count('row_labels') > 0"
```

## Returning Values as Workflow Outputs

When the workflow is used as a subflow, only keys declared in `outputs:` are returned to the caller. Keys not listed are workflow-local.

```yaml
outputs:
  - name: saved_file
  - name: full_path
```

See [Parameters and Outputs](../03-core-concepts/09-parameters-and-outputs.md) for the full declaration syntax.
