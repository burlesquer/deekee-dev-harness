---
name: freeze
description: |
  Restrict file edits to a specific directory. Blocks Edit and Write
  outside the allowed path. Use when debugging or making focused changes
  to avoid accidental edits elsewhere.
---

# /dk-harness freeze — Scoped Edit Protection

## Usage

Freeze to a directory:
```
/dk-harness freeze src/components/
```

This blocks all Edit/Write operations outside `src/components/`.

## How It Works

1. Set freeze boundary in `.dk-harness/state/freeze-state.json`
2. PreToolUse hook checks every Edit/Write against the boundary
3. Trailing slash means "this directory and children"
4. Blocked operations return an error with the freeze boundary

## Unfreeze

```
/dk-harness unfreeze
```

Removes the freeze boundary, allowing edits to all directories.

## Safety

- Freeze state persists across tool calls in the same session
- Does NOT persist across sessions (safety first)
- Always allows edits to `.dk-harness/` directory (state management)
