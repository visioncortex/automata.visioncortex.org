---
title: Conditions
sidebar_label: Conditions
---

# Conditions

A condition is a boolean predicate the engine polls every 100ms until it passes or the step's timeout expires. The same condition types appear as `expect`, `precondition`, recovery `trigger`, and flow-control predicates.

## Element conditions

These conditions locate an element within an anchor's subtree using a selector.

| Type | True when |
|---|---|
| `ElementFound` | The selector matches at least one element |
| `ElementEnabled` | The matched element is enabled (not greyed out) |
| `ElementVisible` | The matched element is visible on screen |
| `ElementHasText` | The matched element's text satisfies a `pattern` |
| `ElementHasChildren` | The matched element has at least one child |

All five require `scope` (anchor name) and `selector`.

```yaml
expect:
  type: ElementFound
  scope: editor
  selector: ">> [role=button][name=Save]"
```

### `ElementHasText` and `TextMatch`

`ElementHasText` requires a `pattern` block. Exactly one field should be set:

```yaml
expect:
  type: ElementHasText
  scope: results_panel
  selector: ">> [role=text][name=Status]"
  pattern:
    contains: "Complete"
```

| Pattern field | Behaviour |
|---|---|
| `exact` | Exact string match |
| `contains` | Substring match |
| `starts_with` | Prefix match |
| `regex` | [fancy-regex](https://github.com/fancy-regex/fancy-regex) pattern (supports backreferences, lookahead) |
| `non_empty: true` | True when the text is not empty |

`{output.*}` substitution is applied to `exact`, `contains`, and `starts_with` values at evaluation time.

Use `regex` when the other match modes cannot express the condition. The main reason to reach for it over a plain pattern is **backreferences** — matching the same value in two positions. A common case is detecting when a progress counter reaches completion:

```yaml
- intent: wait for processing to finish
  action:
    type: NoOp
  expect:
    type: ElementHasText
    scope: status_bar
    selector: ">> [role=edit][name=Progress]"
    pattern:
      regex: "^(\\d+) of \\1$"
  timeout: 120s
```

`(\d+) of \1` matches text like `"123 of 123"` — where the total equals the current count — using a backreference to the first capture group. `exact` cannot be used because the numbers are not known in advance. Only the backreference can express "these two numbers must be the same."

## Window conditions

| Type | Fields | True when |
|---|---|---|
| `WindowWithAttribute` | `title`, `automation_id`, `pid`, `process` | Any application window matches the given attributes |
| `ProcessRunning` | `process` | Any window belongs to the named process |
| `WindowClosed` | `anchor` | The anchored window is no longer open |
| `WindowWithState` | `anchor`, `state` | The anchor's window is in the given state |
| `DialogPresent` | `scope` | The scope anchor's window has a dialog child |
| `DialogAbsent` | `scope` | The scope anchor's window has no dialog child |
| `ForegroundIsDialog` | `scope`, `title` (optional) | The OS foreground window is a dialog, optionally matching a title |

`WindowWithAttribute` requires at least one of `title`, `automation_id`, or `pid`. `process` is an optional filter.

```yaml
expect:
  type: WindowWithAttribute
  title:
    contains: "Save As"
  process: notepad
```

`WindowWithState` accepts `state: active` (foreground window) or `state: visible` (not minimized or hidden).

```yaml
expect:
  type: WindowWithState
  anchor: main_window
  state: active
```

## System conditions

| Type | Fields | True when |
|---|---|---|
| `FileExists` | `path` | The file exists on disk |
| `ExecSucceeded` | — | The most recent `Exec` action exited with code 0 |
| `EvalCondition` | `expr` | The expression evaluates to true |
| `Always` | — | Always true immediately |

`FileExists.path` supports `{output.*}` substitution.

`EvalCondition` evaluates a boolean expression against the current output, locals, and params. Operators: `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`.

```yaml
expect:
  type: EvalCondition
  expr: "{output.count} > 0"
```

`Always` is used as `expect` on steps where the action itself guarantees success (e.g. `NoOp`, `Capture`, `Eval`).

## Logic combinators

Compose conditions with `AllOf`, `AnyOf`, and `Not`.

```yaml
expect:
  type: AllOf
  conditions:
    - type: ElementFound
      scope: panel
      selector: ">> [name=Done]"
    - type: DialogAbsent
      scope: main_window
```

```yaml
precondition:
  type: Not
  condition:
    type: FileExists
    path: "{output.output_path}"
```

`AllOf` short-circuits on the first false; `AnyOf` short-circuits on the first true.

## `TitleMatch`

`WindowWithAttribute.title` and `ForegroundIsDialog.title` use `TitleMatch`:

| Field | Behaviour |
|---|---|
| `exact` | Exact window title |
| `contains` | Title contains substring |
| `starts_with` | Title begins with prefix |
