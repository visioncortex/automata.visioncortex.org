---
title: Composing with Subflows
sidebar_label: Subflows
---

# Composing with Subflows

A subflow phase delegates execution to a child workflow file. The child runs to completion, its declared outputs are returned to the parent, and the parent continues from the next phase.

## The workflow library pattern

Think of subflows the way you think of shell scripts calling other shell scripts. Each script is a self-contained unit with its own local variables, its own error handling, and a defined interface (arguments in, exit code out). You build up a library of focused scripts and compose them into larger pipelines.

```bash
#!/bin/bash
# orchestrator.sh
./open_file.sh "$FILE_PATH"
./run_analysis.sh
./save_results.sh "$OUTPUT_DIR"
./cleanup.sh
```

Subflows work the same way. The orchestrating workflow declares what to do; the child workflows know how to do it:

```yaml
# process_file.yml — the orchestrator
phases:
  - name: open_file
    subflow: open_file.yml
    params:
      file_path: "{param.file_path}"

  - name: open_simulator
    subflow: open_simulator.yml

  - name: save_operation_info
    subflow: simulator_save_operation.yml
    params:
      output_dir: "{param.output_dir}"

  - name: reset
    subflow: reset.yml
```

### Why this pays off

**Author and test independently.** Each child workflow can be run directly to verify it works in isolation. `reset.yml` can be tested without going through the full pipeline. `open_file.yml` can be debugged with a specific test file. The full orchestrator only needs testing once each component is solid.

**Compose into arbitrarily complex flows.** An orchestrator that calls four subflows is easy to reason about. Each subflow can itself call further subflows. Complexity stays local — the orchestrator does not need to know how `open_file.yml` handles the Errors or Warnings dialog; it just calls the workflow and gets a clean result back.

**Reuse across workflows.** `reset.yml` is called both as a setup step before a file is opened and as a cleanup step after processing. The same file, called from different orchestrators.

## A real case study: Mastercam

The Mastercam workflow library processes CAM files end-to-end. The pipeline has five distinct stages, each in its own file:

| File | What it does |
|---|---|
| `launch.yml` | Launches Mastercam.exe, waits for the splash screen to clear |
| `open_file.yml` | Opens a `.mcam` file, dismisses load errors, extracts toolpath names |
| `open_simulator.yml` | Opens the Mastercam Simulator from the ribbon |
| `simulator_save_operation.yml` | Fast-forwards to the last operation, saves the Operation Info CSV |
| `reset.yml` | Closes the simulator, clicks New, returns to clean "Mastercam Design" state |

`process_file.yml` calls them in sequence, threads outputs between them, and finishes with a Python post-processing step:

```yaml
phases:
  - name: open_file
    subflow: open_file.yml
    params:
      file_path: "{param.file_path}"        # toolpaths → available as output.toolpaths

  - name: open_simulator
    subflow: open_simulator.yml

  - name: save_operation_info
    subflow: simulator_save_operation.yml
    params:
      output_dir: "{param.output_dir}"      # saved_file → available as output.saved_file

  - name: reset
    subflow: reset.yml

  - name: stitch_outputs
    steps:
      - intent: run post-processing script with outputs from subflows
        action:
          type: Exec
          command: python
          args:
            - "{param.script_path}"
            - "{param.output_dir}{output.saved_file}"
        expect:
          type: ExecSucceeded
```

`open_file.yml` declares `toolpaths` and `addin_export` in its `outputs:`. `simulator_save_operation.yml` declares `saved_file`. The orchestrator never touches the elements those workflows interact with — it just consumes their outputs.

## Variable scoping

Like shell scripts, each child workflow has its own local variable scope. Extracted values, `Eval` locals, and intermediate outputs are private to the child. They are not visible in the parent unless the child explicitly declares them in `outputs:`.

```yaml
# child workflow
outputs:
  - name: saved_file     # only this propagates to the parent
  - name: export_path

# "internal_temp" extracted during child execution → discarded on return
```

This prevents the child's internal bookkeeping from polluting the parent's output buffer — the same reason you use local variables in a shell function.

## Anchor scoping

Anchor scoping follows the same principle. Root and Session anchors are globally shared across depth — if the parent has a Root anchor named `mastercam`, the child can reference `scope: mastercam` and it resolves to the same window handle. The child is automating the same application, so sharing the window reference is correct.

Stable and Ephemeral anchors are depth-scoped and isolated. A Stable anchor named `toolbar` in a child workflow is a separate handle from a Stable anchor named `toolbar` in the parent. When the child exits, its Stable and Ephemeral handles are released without affecting the parent.

In the Mastercam library, every child file declares its own `mastercam` Root anchor. They all resolve to the same running window — there is only one Mastercam process — and the shadow DOM deduplicates the HWND lock automatically.

## Declaring a subflow phase

```yaml
phases:
  - name: search_store
    subflow: ../microsoft_store/search.yml
    params:
      search_term: "{param.app_name}"
```

- `subflow` is a path relative to the calling workflow file
- `params` passes values into the child's declared `params:` — keys must match names the child declares
- After the phase completes, the child's declared `outputs:` are available as `{output.<key>}` in subsequent phases

## Error handling

If the child workflow fails, the subflow phase fails and the parent stops — the same behaviour as a failed step. A `finally` phase in the parent still runs. The child's own `finally` phase also runs before control returns to the parent.
