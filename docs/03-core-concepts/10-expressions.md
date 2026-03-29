---
title: Expressions
sidebar_label: Expressions
---

# Expressions

Expressions let you compute values at runtime within a workflow. They appear in action fields, condition predicates, and `Eval` steps, and are how you transform parameters, build strings from extracted data, and make decisions based on workflow state.

## Substitution syntax

Any string field in a workflow can embed a substitution using `{...}` syntax. There are four namespaces:

| Token | Resolves to |
|---|---|
| `{param.name}` | A declared workflow parameter |
| `{output.name}` | A value written by a previous `Extract` or `Eval` step |
| `{env.VARNAME}` | A Windows environment variable |
| `{workflow.dir}` | The directory containing the current workflow file |

```yaml
text: "{param.search_term}"
pattern:
  contains: "{output.extracted_name}"
args:
  - "{workflow.dir}\\post_process.py"
  - "{env.USERPROFILE}\\Documents"
```

`{workflow.dir}` is particularly useful for referencing sibling scripts and data files without hardcoding absolute paths — the workflow works regardless of where the library is installed.

## The Eval action

`Eval` computes an expression and stores the result in an output variable:

```yaml
- intent: build the output filename
  action:
    type: Eval
    key: output_path
    expr: "{param.base_dir}\\{output.app_name}_log.txt"
  expect:
    type: Always
```

The result is stored under `output.output_path` and available to all subsequent steps and conditions.

## Expressions in conditions

`EvalCondition` evaluates an expression as a boolean predicate. Supported operators: `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`.

```yaml
expect:
  type: EvalCondition
  expr: "{output.result_count} > 0"
```

String values from `{output.*}` are compared as strings unless they parse as numbers.

## Supported operations

## Error handling
