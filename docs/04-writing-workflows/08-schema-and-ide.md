---
title: Schema and IDE Support
sidebar_label: Schema & IDE
---

# Schema and IDE Support

ui-automata ships a JSON Schema generated directly from the Rust types that power the executor. Add a single comment to any workflow file and your editor validates your YAML, offers autocomplete for every field, and shows inline documentation for every action and condition type.

## Adding the Schema Reference

Paste this comment at the top of any workflow YAML file:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/visioncortex/ui-automata/main/workflow-schema.json
name: my_workflow
...
```

The `yaml-language-server` comment is a convention understood by the [YAML Language Server](https://github.com/redhat-developer/yaml-language-server), which powers YAML support in VS Code, Neovim, and other editors. No extension configuration is required beyond installing the language server.

## VS Code setup

1. Install the **YAML** extension (Red Hat, `redhat.vscode-yaml`).
2. Add the schema comment to the top of your workflow file. Validation and autocomplete activate immediately — no workspace settings needed.

The extension will:
- Underline unknown fields in red
- Offer completions for `type:` fields (`Click`, `Extract`, `EvalCondition`, etc.)
- Show hover documentation pulled from the schema's `description` fields
- Validate required fields are present and values match their expected types

## What the Schema Validates

The schema is generated from the same Rust types used at runtime, so any file that passes schema validation is structurally correct. The schema checks:

| Check | Example error |
|---|---|
| Unknown top-level fields | `launche:` instead of `launch:` |
| Missing required fields | Phase without `name:`, step without `action:` |
| Invalid enum values | `type: Clicck` on an action |
| Wrong value type | `timeout: true` instead of a duration string |
| Required sub-fields | `ElementHasText` without `pattern:` |

The schema does not validate cross-references (e.g. that an anchor named in `mount:` was declared in `anchors:`). That is the job of the linter.
