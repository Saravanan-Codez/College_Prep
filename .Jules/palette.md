## 2024-05-24 - Screen Reader Support for Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where icon-only interactive elements in the application shell (like task toggles) and modals (like close buttons) lacked descriptive `aria-label`s, rendering their purpose invisible to screen reader users.
**Action:** Always verify that interactive buttons relying solely on visual icons have context-aware `aria-label` attributes to maintain full screen reader accessibility.

## 2024-10-27 - Screen Reader Support for Custom Checkboxes
**Learning:** Found an accessibility issue pattern where custom visually-styled toggles (e.g., the subtask markers) lacked semantic screen-reader states. While they visually represented checked/unchecked states through colors and icons, they were announced simply as buttons, leaving screen reader users unaware of their state.
**Action:** Always verify that interactive buttons functioning as checkboxes have explicit `role="checkbox"` and `aria-checked` attributes matching their internal state to maintain full screen reader accessibility.