## 2024-05-18 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found a recurring pattern in the app where icon-only buttons (like modal close "X" and checkmarks) lacked `aria-label`s, making them invisible to screen readers.
**Action:** Consistently added descriptive `aria-label` (and `aria-pressed` for toggles) to all icon-only buttons.
