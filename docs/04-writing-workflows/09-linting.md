---
title: Linting and Validation
sidebar_label: Linting
---

# Linting and Validation

The JSON Schema and the `ui-workflow-check` linter serve different roles. The schema validates structure — required fields, enum values, type shapes. The linter validates meaning — cross-references between parts of the workflow that a schema cannot express.

Use both. The schema gives instant inline feedback in the editor. The linter catches the errors that slip through.

## Running the Linter

```
ui-workflow-check workflow.yml
```

Pass multiple files to check them all at once:

```
ui-workflow-check open_file.yml reset.yml process_file.yml
```

Exits **0** if all files are valid. Exits **1** if any diagnostics are found. Exits **2** if called with no arguments.

When multiple files are passed, each valid file prints `<path>: ok` so you can see what was checked. Errors always print regardless.

## What the Linter Checks

### Cross-Reference Errors

These are the errors the schema cannot catch — references to things that must exist elsewhere in the same file:

| Check | Example error |
|---|---|
| Unknown anchor in `scope`, `mount`, or `unmount` | `unknown anchor 'editor' (declared: app, toolbar)` |
| Unknown recovery handler in `recovery.handlers` | `unknown recovery handler 'dismiss_ok' (declared: none)` |
| Unknown `{param.xxx}` in any string field | `unknown param 'output_dir' (declared: folder, filename)` |
| Unclosed `{` in an interpolation token | `unclosed '{' in interpolation token` |

### Selector Syntax

Every `selector` field is parsed by the same selector engine used at runtime. A selector that would fail to parse at runtime is an error at lint time:

```
error: expected predicate after '['
  --> workflow.yml:14:5
   |
14 |   selector: ">> [role=button name=Save]"
   |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ phases[0].steps[0].action.selector
```

(Missing `][` between predicates.)

### Expression Syntax

`expr` fields in `Eval` and `EvalCondition` are checked for syntax errors:

```
error: unexpected token '**' in expression
  --> workflow.yml:22:5
   |
22 |   expr: "count ** 2"
   |                ^^ phases[0].steps[1].action.expr
```

### Structural Constraints

Some structural rules cannot be expressed in JSON Schema:

- `TextMatch` must specify exactly one pattern field (`exact`, `contains`, `starts_with`, `regex`, or `non_empty`)
- `FlowControl` phase requires both `condition` and `go_to`
- `Subflow` phase requires `subflow`
- Action phase requires `steps`

### Missing Required Fields

The linter reports missing required fields with the YAML path to the offending node:

```
error: missing required field 'intent'
  --> workflow.yml:8
   |
 8 |   - action:
   |     phases[0].steps[0]
```

## Error Output Format

Errors use a Rust-compiler-style format with a source excerpt and caret underline:

```
error: unknown anchor 'editor' (declared: app)
  --> workflow.yml:31:14
   |
31 |     mount: [app, editor]
   |                  ^^^^^^ phases[1].mount[1]

aborting due to 1 error
```

Each error includes:
- The message
- File, line, and column
- The source line with a caret underline pointing at the offending value
- The dot-bracket path to the node (`phases[1].mount[1]`)

## Integrating with CI

Add a linting step to your pipeline before any workflow execution:

```yaml
# GitHub Actions example (Linux runner — shell expands the glob)
- name: Lint workflows
  run: ui-workflow-check workflows/*.yml
```

Because the linter exits 1 on any error, it will fail the build automatically. Run it on every commit that touches workflow files to catch broken cross-references before they reach a test environment.
