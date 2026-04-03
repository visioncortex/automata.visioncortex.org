---
title: Control Flow
sidebar_label: Control Flow
---

# Control Flow

Workflows are not always linear. Preconditions allow phases to be skipped when a condition is not met. Phase jumps enable loops and branching. The `finally` block guarantees cleanup regardless of how a workflow ends.

<video controls width="100%" style={{borderRadius: '8px', marginBottom: '1.5rem'}}>
  <source src="/video/notepad-loop-counter.mp4" type="video/mp4" />
</video>

## Preconditions

A phase can declare a `precondition`. If the condition is false when the phase is reached, the phase is skipped entirely and execution continues with the next phase. This is not an error.

```yaml
- name: close_dialog
  precondition:
    type: DialogPresent
    scope: main_window
  steps:
    - intent: dismiss the dialog
      action:
        type: Click
        scope: main_window
        selector: ">> [role=button][name=OK]"
      expect:
        type: DialogAbsent
        scope: main_window
```

If no dialog is present when `close_dialog` is reached, the phase is skipped cleanly.

## Skipping a Phase vs. Failing

A failed `precondition` skips the phase. A failed step (timeout with no matching recovery handler) fails the workflow. These are distinct. Use `precondition` when a phase is genuinely optional; use recovery handlers when a step is expected to succeed but might not.

## Jumping to a Named Phase

A phase can use `flow_control` to jump to any named phase unconditionally, or conditionally based on an `EvalCondition`:

```yaml
- name: check
  flow_control:
    condition:
      type: EvalCondition
      expr: "i > 10"
    go_to: done
```

If the condition is true, execution jumps to the `done` phase. If false, execution falls through to the next phase in sequence.

An unconditional jump uses `Always`:

```yaml
- name: loop_back
  flow_control:
    condition:
      type: Always
    go_to: check
```

## Loops

Combining `Eval` variables, `EvalCondition`, and phase jumps gives you a full loop. The pattern is:

```
     ┌─────────┐
     │  init   │  set loop variable
     └────┬────┘
          │
          ▼
     ┌─────────┐   i > 10   ┌──────┐
┌────│  check  │───────────►│ done │
│    └────┬────┘            └──────┘
│         │ i ≤ 10
│         ▼
▲    ┌───────────┐
│    │ loop_body │ do work, increment i
│    └────┬──────┘
│         │
└─────────┘
```

Here is a complete example — `notepad_loop_counter` — which counts from 1 to 10, types each number into Notepad, accumulates a running total, and writes the final sum:

```yaml
phases:

  - name: init
    mount: [notepad, editor]
    steps:
      - intent: initialise counter
        action: { type: Eval, key: i, expr: "1" }
        expect: { type: Always }
      - intent: initialise total
        action: { type: Eval, key: total, expr: "0" }
        expect: { type: Always }

  - name: check
    flow_control:
      condition:
        type: EvalCondition
        expr: "i > 10"
      go_to: done

  - name: loop_body
    steps:
      - intent: accumulate running total
        action: { type: Eval, key: total, expr: "total + i" }
        expect: { type: Always }
      - intent: append counter value to Notepad
        action:
          type: TypeText
          scope: editor
          selector: "[role=edit][name='Text Editor']"
          text: "{output.i}\n"
        expect: { type: Always }
      - intent: increment counter
        action: { type: Eval, key: i, expr: "i + 1" }
        expect: { type: Always }

  - name: loop_back
    flow_control:
      condition: { type: Always }
      go_to: check

  - name: done
    steps:
      - intent: publish final sum
        action:
          type: Eval
          key: total
          expr: "total"
          output: sum
        expect: { type: Always }
      - intent: append sum line to Notepad
        action:
          type: TypeText
          scope: editor
          selector: "[role=edit][name='Text Editor']"
          text: "Sum: {output.sum}"
        expect: { type: Always }
```

Notepad ends up with:
```
1
2
3
4
5
6
7
8
9
10
Sum: 55
```

Phase jumps, mutable variables, and conditional branching together make the workflow language Turing complete. Anything you can express in a structured programming language — loops, counters, accumulators, conditional branches — you can express in a workflow.

## Early Exit

Jump to a terminal phase to exit early without error:

```yaml
- name: check_precondition
  flow_control:
    condition:
      type: EvalCondition
      expr: "var.item_count == 0"
    go_to: done
```

## The `finally` Block

A phase named `finally` runs unconditionally at the end of a workflow, whether it succeeded, failed, or was jumped to early. Use it to close applications, clean up temporary files, or restore state.

```yaml
- name: finally
  steps:
    - intent: close the application
      action:
        type: Execute
        command: "taskkill /IM notepad.exe /F"
      expect: { type: Always }
```

`finally` runs even if a previous phase failed — making it the right place for any cleanup that must always happen.
