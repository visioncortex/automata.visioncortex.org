---
title: Expressions
sidebar_label: Expressions
---

# Expressions

Workflows have two distinct mechanisms for working with values at runtime. Understanding which one to use — and why they are separate — avoids confusion.

## Two Mechanisms

### 1. YAML substitution: `{...}`

Any string field in a workflow YAML file can embed `{...}` tokens. These are replaced in the raw YAML text before parsing, so they work in selectors, intent strings, file paths, and every other string field:

| Token | Resolves to |
|---|---|
| `{param.name}` | A declared workflow parameter |
| `{output.name}` | A runtime output value |
| `{env.VARNAME}` | A Windows environment variable |
| `{workflow.dir}` | The directory containing the current workflow file |

```yaml
selector: ">> [role=list item][name={param.folder}]"
text: "{param.search_term}"
args:
  - "{workflow.dir}\\post_process.py"
  - "{env.USERPROFILE}\\Documents"
```

YAML substitution is simple text replacement. It has no operators, no functions, no types.

### 2. The Expression Language

The expression language is a typed evaluator used specifically in:
- `Eval` action's `expr` field
- `EvalCondition` condition's `expr` field

It has three value types, arithmetic and comparison operators, and a set of built-in functions. Variables are referenced without braces: `output.key`, `param.key`, or a bare identifier.

```yaml
- intent: compute next font size cycling from 12 to 36
  action:
    type: Eval
    key: new_size
    expr: "(size + 8) % 24 + 12"
  expect:
    type: Always
```

Here `size` is a bare identifier that resolves from the locals/output buffer. No `{...}` needed.

## The Type System

The evaluator has three types: **String**, **Number** (64-bit float), and **Bool**.

All variables arrive as `String` — values from `Extract`, params, and locals are always stored as strings. The evaluator promotes them to `Number` when the context requires it and when the string parses as a valid number. `Bool` is never promoted or demoted automatically.

If you have written bash, this should feel familiar. In bash, `$count` is always a string; arithmetic context (`$(( ))` or `-gt`/`-lt`) promotes it to a number automatically:

```bash
count="10"
echo $(( count + 1 ))          # 11 — bash promotes string to number
[[ "$count" -gt 0 ]]           # numeric comparison
[[ "$status" == "done" ]]      # string comparison
[[ "$count" -gt 0 && "$status" == "done" ]]  # boolean AND
```

The expression language works the same way, without the different syntax for numeric vs string comparison:

```
output.count + 1               # "10" + 1 → 11
output.count > 0               # numeric comparison (both sides parse as numbers)
output.status == 'done'        # string comparison
output.count > 0 && output.status == 'done'
```

The key difference from bash: `Bool` is an explicit type. In bash, any non-empty string is truthy and you can write `[[ "$x" && "$y" ]]`. Here, `&&` requires its operands to actually be `Bool` — produced by a comparison — not just any non-empty value. Type errors are explicit rather than silently wrong.

| Concept | bash | Expression language |
|---|---|---|
| Variable reference | `$count` | `output.count` / `param.count` / `count` (bare) |
| Arithmetic | `$(( count + 1 ))` | `count + 1` |
| String concat | `"${a}${b}"` | `a + b` (when either side is non-numeric) |
| Numeric comparison | `[[ "$count" -gt 0 ]]` | `count > 0` |
| String comparison | `[[ "$status" == "done" ]]` | `output.status == 'done'` |
| Equality (auto-detects) | n/a | `output.size == 0` (numeric if both parse) |
| Boolean AND | `[[ ... && ... ]]` | `... && ...` — operands **must** be `Bool` |
| Boolean OR | `[[ ... \|\| ... ]]` | `... \|\| ...` — operands **must** be `Bool` |
| Implicit truthiness | `[[ "$x" ]]` (non-empty) | not supported — use `output.x != ''` |
| String literal | `"hello"` | `'hello'` (single quotes only) |
| String length | `${#var}` | `strlen(var)` |
| Math functions | `bc`, `awk` | `round()`, `floor()`, `ceil()`, `min()`, `max()` |
| Path join | `"$a/$b"` | `path_join(a, b)` |
| Subexpression | `$(...)` | `(...)` grouping only |

### The Polymorphic `+` Operator

`+` is the most context-sensitive operator:

- If both sides parse as numbers: **numeric addition**
- Otherwise: **string concatenation**

```
output.count + 1     # "10" + 1 → 11 (Number)
'v' + output.version # "v" + "3" → "v3" (String)
```

The coercion rule can surprise you: `'3' + 4` evaluates to `7` (Number), not `"34"`, because the string `'3'` parses as a number. Use explicit string prefixes to force concatenation when you mean it.

For building file paths, prefer `path_join` over manual concatenation — it handles separators correctly.

### Comparison Operators

`==` and `!=` try numeric comparison first, fall back to string comparison:

```
output.size == 0         # "0" == 0 → true (numeric)
output.status == 'done'  # string comparison
```

`<`, `<=`, `>`, `>=` require both sides to be numeric (or strings that parse as numbers):

```
output.count > 0         # "5" > 0 → true
output.count > 'abc'     # error: operator `>` requires a number
```

### Boolean Operators

`&&` and `||` require both operands to be `Bool`. There is no implicit truthiness — you cannot write `output.value && something`. You must produce a `Bool` first via a comparison:

```
output.count > 0 && output.status == 'ok'   # correct
output.count && output.status               # error: not Bool values
```


## Variable Namespaces

| Reference | Resolves to |
|---|---|
| `output.key` | Last value stored under `key` in the output buffer |
| `param.key` | Workflow parameter (immutable) |
| `local.key` | Local variable (Eval result, overwrite semantics) |
| `key` (bare) | Locals first, falls back to output buffer |

Bare identifiers are the short form for locals: in `(size + 8) % 24 + 12`, `size` resolves from the local variable written by a previous `Extract` step.

Missing keys resolve to `""` (empty string) rather than an error.


## Operator Precedence

From highest to lowest:

| Level | Operators |
|---|---|
| 1 | `()` grouping, literals, function calls, variable references |
| 2 | Unary `-` |
| 3 | `*` `/` `%` |
| 4 | `+` `-` |
| 5 | `==` `!=` `<` `<=` `>` `>=` → always return `Bool` |
| 6 | `&&` — both operands must be `Bool` |
| 7 | `\|\|` — both operands must be `Bool` |


## Built-In Functions

### Arithmetic

| Function | Description |
|---|---|
| `round(n)` | Round to nearest integer |
| `floor(n)` | Round down |
| `ceil(n)` | Round up |
| `min(a, b)` | Smaller of two numbers |
| `max(a, b)` | Larger of two numbers |

### String

| Function | Description |
|---|---|
| `trim(s)` | Remove leading and trailing whitespace |
| `strlen(s)` | Length of a string in bytes |
| `split_lines(text, n)` | Split `text` by newlines and return line at index `n` (negative index counts from the end) |

### Output Buffer

| Function | Description |
|---|---|
| `output_count('key')` | Number of values stored under `key` — useful after `Extract` with `multiple: true` |

### Path Manipulation

| Function | Description |
|---|---|
| `dirname(path)` | Parent directory of a path |
| `basename(path)` | Filename component of a path |
| `path_join(a, b)` | Join two path segments |


## String Literals

String literals use single quotes. Escape sequences: `\'`, `\\`, `\n`, `\r`, `\t`.

```
'hello world'
'C:\\Users\\chris'
'it\'s a value'
```

Integer-valued numbers are formatted without a decimal point: `12.0` becomes `"12"` when stored.


## `EvalCondition`

When used as a condition (`EvalCondition`), the expression **must** evaluate to `Bool`. An expression that returns a `Number` or `String` is an error.

```yaml
expect:
  type: EvalCondition
  expr: "output.count > 0 && output.status == 'ready'"
```


## Practical Examples

**Cycle a counter with modulo:**
```yaml
expr: "(size + 8) % 24 + 12"
```

**Build a file path from parts:**
```yaml
expr: "path_join(param.output_dir, output.filename)"
```

**Check that extraction produced a non-empty value:**
```yaml
expr: "output.saved_file != ''"
```

**Extract the first line from a multi-line result:**
```yaml
expr: "split_lines(output.raw_text, 0)"
```

**Check how many rows were captured:**
```yaml
expr: "output_count('rows') > 0"
```

**Guard a phase with two conditions:**
```yaml
expr: "output.count > 0 && output.status == 'complete'"
```
