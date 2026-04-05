---
title: Contributing Workflows
sidebar_label: Contributing
---

# Contributing Workflows

The workflow library grows with real-world usage. If you have a workflow for an application not yet covered, contributions are welcome.

## Conventions

- One workflow per task, not one workflow per application. `explorer_open_folder` and `explorer_navigate` are separate files, not sections of a single `explorer.yml`.
- Declare all parameters with a `description`. Declare `outputs` explicitly — only keys the caller needs should propagate.
- Use `{workflow.dir}` for any scripts or assets packaged alongside the workflow.
- Add the schema comment at the top of every file: `# yaml-language-server: $schema=...`

## OS-Specific Workflows

If a workflow differs between Win10 and Win11, place both versions under `win10/<app>/` and `win11/<app>/` rather than adding version-detection logic to a single file. Keeping them separate makes each file simpler and independently testable.

## Testing

Run `ui-workflow-check` on the file before submitting. Run the workflow against the target application on the relevant OS version. If the workflow handles dialogs or error states, verify those paths too — not just the happy path.

## Submitting

Open a pull request against the `workflows/` directory. Include a brief description of what the workflow does and which OS app / versions it was tested on.
