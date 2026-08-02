## 2024-05-24 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like the task completion toggle and modal close buttons) frequently lack accessible names, making them difficult to use for screen reader users. The application had several instances of this pattern.
**Action:** Always add an `aria-label` attribute to buttons that rely solely on icons for visual identification to ensure they are accessible.
