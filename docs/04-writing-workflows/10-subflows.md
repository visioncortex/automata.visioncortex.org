---
title: Composing with Subflows
sidebar_label: Subflows
---

# Composing with Subflows

A subflow phase delegates execution to a child workflow file. The child runs as if it were called directly, its declared outputs are returned to the parent, and execution continues in the parent once the child completes.

This lets you build libraries of reusable workflows and compose them into larger automations without copying steps.

## Declaring a subflow phase

Instead of `steps`, use the `subflow` key with a path relative to the calling workflow file:

```yaml
phases:
  - name: search_store
    subflow: ../microsoft_store/microsoft_store_search.yml
    params:
      search_term: "{param.app_name}"
```

The `params` map passes values into the child's declared parameters. Any key valid for the child's `params:` section can be set here.

## Accessing child outputs

After the subflow phase completes, the child's declared `outputs` are available in the parent as `{output.<key>}`:

```yaml
phases:
  - name: search_store
    subflow: ../microsoft_store/microsoft_store_search.yml
    params:
      search_term: python

  - name: report_results
    steps:
      - intent: type the results into Notepad
        action:
          type: TypeText
          scope: editor
          selector: "[role=edit]"
          text: "{output.results}"
        expect:
          type: Always
```

Only keys listed in the child's `outputs:` declaration propagate to the parent. Variables extracted by the child but not declared as outputs are discarded when the subflow returns.

## Paths and the workflow library

Subflow paths are resolved relative to the calling workflow file, so a workflow in `workflow-library/mastercam/` can reference `../microsoft_store/microsoft_store_search.yml` and it will resolve correctly regardless of the working directory the executor was launched from.

## Error handling

If the child workflow fails, the subflow phase fails and the parent workflow stops — the same behaviour as a failed step. A `finally` phase in the parent still runs.
