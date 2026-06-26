# Design Tokens

The single source of truth for visual values. Components must reference tokens, never
hard-coded literals.

## Colour
| Token            | Value     | Use                |
|------------------|-----------|--------------------|
| `--color-fg`     | `#1a1a1a` | Primary text       |
| `--color-accent` | `#c4982a` | Calls to action    |
| `--color-danger` | `#c0392b` | Destructive states |

## Spacing
A 4px scale: `space-1` = 4px, `space-2` = 8px, `space-4` = 16px, `space-6` = 24px.

## Type
Body 14px/1.5, headings via `--font-display`. Never set font sizes inline.
