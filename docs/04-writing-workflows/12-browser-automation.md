---
title: Browser Automation
sidebar_label: Browser Automation
---

# Browser Automation

The workflow engine supports automating a web browser (Microsoft Edge) through two complementary mechanisms:

- **CDP** (`BrowserNavigate`, `browser` MCP tool) — reads and drives page content via the Chromium DevTools Protocol.
- **UIA** (`run_actions`, `Invoke`, `Click`, `PressKey`) — interacts with the browser as a native Windows application, including the toolbar, Downloads panel, and links that open new tabs.

Most browser workflows use both. Knowing which to reach for avoids the most common failure modes.

## CDP vs UIA: When to Use Which

| Task | Use |
|---|---|
| Navigate to a URL | CDP (`BrowserNavigate`) |
| Read page content, extract text or URLs | CDP `eval` / `dom` |
| Click a same-tab link (no `target=_blank`) | CDP `eval` `.click()` |
| Click a link that opens a new tab or window | UIA `Invoke` |
| Click the browser's own UI (address bar, toolbar) | UIA |
| Open or dismiss Edge dialogs (pop-up blocked, permissions) | UIA |
| Type into a web form field | CDP `eval` or UIA `SetValue` |

## Declaring Browser and Tab Anchors

```yaml
anchors:
  edge:
    type: Browser

  git_tab:
    type: Tab
    parent: edge
```

Mount both in the phase that opens the browser. The `Browser` anchor establishes the CDP connection and provides the UIA scope for the browser window. The `Tab` anchor tracks an individual tab.

```yaml
phases:
  - name: navigate
    mount: [edge, git_tab]
    steps:
      - intent: navigate to the target page
        action:
          type: BrowserNavigate
          scope: git_tab
          url: "https://example.com"
        expect:
          type: TabWithAttribute
          scope: git_tab
          title:
            contains: "Example Domain"
        timeout: 30s
```

After mounting, subsequent phases can use `edge` and `git_tab` as scope without re-mounting.

## Clicking Links That Open New Tabs

CDP `.click()` dispatches a **synthetic event** — it does not count as a user gesture. Edge blocks pop-ups and new-tab navigations triggered by synthetic events.

Symptoms:
- A "Pop-up blocked" button appears in the address bar.
- The download or new tab never opens.

Use UIA `Invoke` instead. `Invoke` calls `IInvokePattern::Invoke()` directly, which Edge counts as a real interaction:

```yaml
- intent: click the Download button
  action:
    type: Invoke
    scope: git_tab
    selector: ">> [role=link][id=download]"
  expect:
    type: Always
```

:::caution
Always use `Invoke` (not CDP `.click()`) for `target=_blank` links and download links. CDP clicks on these will silently fail — the pop-up is blocked with no error in the workflow.
:::

## `Invoke` vs `Click` for Browser Links

Both `Invoke` and `Click` send real user-gesture events, unlike CDP. Choose based on the element's position:

| Action | How it works | When to use |
|---|---|---|
| `Invoke` | Calls `IInvokePattern` directly; no bounding rect needed | Off-screen elements, toolbar buttons, download links, `target=_blank` links |
| `Click` | Sends `SendInput` mouse events to the element's bounding rect | On-screen, in-page buttons with valid (non-zero) bounds |

## Discovering UIA Element Names

UIA element names come from the accessibility tree — `aria-label`, `title`, inner text — not necessarily from the visible rendered text. The name you see on screen may differ from the name the selector must match.

Always discover the real UIA name before writing selectors. Never guess the name from page source; use what the tree reports.

## Opening the Downloads Panel

Edge's Downloads panel is a UIA dialog, not a web page. Use `PressKey ctrl+j` to open it, and check for the dialog element to confirm it appeared:

```yaml
- intent: open Downloads panel if it did not appear automatically
  precondition:
    type: Not
    condition:
      type: ElementFound
      scope: edge
      selector: ">> [role=dialog][name=Downloads]"
  action:
    type: PressKey
    scope: edge
    selector: "*"
    key: "ctrl+j"
  expect:
    type: ElementFound
    scope: edge
    selector: ">> [role=dialog][name=Downloads]"
  timeout: 3s
```

To anchor the Downloads panel for repeated access, declare it as a `Stable` anchor parented to the `Browser`:

```yaml
anchors:
  downloads_panel:
    type: Stable
    parent: edge
    selector: ">> [role=dialog][name=Downloads]"
```

## Handling a Pop-up Blocked Prompt

If a CDP `.click()` was used on a `target=_blank` link by mistake, dismiss the prompt and allow via UIA:

```yaml
- intent: open pop-up blocked menu
  action:
    type: Click
    scope: edge
    selector: ">> [role=tool bar] >> [role=button][name^=Pop-up]"
  expect:
    type: ElementFound
    scope: edge
    selector: ">> [role=radio button][name^=Always allow]"
- intent: select Always allow
  action:
    type: Click
    scope: edge
    selector: ">> [role=radio button][name^=Always allow]"
  expect:
    type: ElementFound
    scope: edge
    selector: ">> [role=radio button][name^=Always allow]"
- intent: click Done
  action:
    type: Click
    scope: edge
    selector: ">> [role=button][name=Done]"
  expect:
    type: Not
    condition:
      type: ElementFound
      scope: edge
      selector: ">> [role=radio button][name^=Always allow]"
```

## Multiple Edge Windows

When more than one Edge window is open, `scope: edge` targets the topmost (z-order front) window. To target a specific window, get its `hwnd` from `desktop list_windows` and filter by it when constructing the anchor.

## Closing the Browser

Use `CloseWindow` via UIA — do not kill the process. `CloseWindow` sends `WM_CLOSE`, which triggers Edge's normal shutdown path (session save, prompt for unsaved tabs, etc.):

```yaml
- intent: close the browser
  action:
    type: CloseWindow
    scope: edge
  expect:
    type: Always
```
