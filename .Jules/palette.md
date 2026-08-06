## 2024-05-24 - Screen Reader Support for Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where icon-only interactive elements in the application shell (like task toggles) and modals (like close buttons) lacked descriptive `aria-label`s, rendering their purpose invisible to screen reader users.
**Action:** Always verify that interactive buttons relying solely on visual icons have context-aware `aria-label` attributes to maintain full screen reader accessibility.
## 2026-08-01 - Form Inputs and Landmark Accessibility
**Learning:** Encountered an accessibility issue pattern where inputs (such as text inputs, selectors, and textareas) lacked associated labels, preventing screen readers from identifying their purpose. Additionally, multiple navigation landmarks (`<nav>`) existed without descriptive names, causing confusion for structural navigation.
**Action:** When implementing or reviewing components, always verify that interactive form elements have visible `<label>`s or `aria-label` attributes, and ensure `<nav>` tags include descriptive `aria-label`s to distinguish different navigation areas (e.g., Main Navigation vs. Mobile Navigation).

## 2024-10-27 - Screen Reader Support for Custom Checkboxes
**Learning:** Found an accessibility issue pattern where custom visually-styled toggles (e.g., the subtask markers) lacked semantic screen-reader states. While they visually represented checked/unchecked states through colors and icons, they were announced simply as buttons, leaving screen reader users unaware of their state.
**Action:** Always verify that interactive buttons functioning as checkboxes have explicit `role="checkbox"` and `aria-checked` attributes matching their internal state to maintain full screen reader accessibility.

## 2024-11-20 - Async Action Buttons and Loading States
**Learning:** Found an accessibility issue pattern where async action buttons (such as the AI Coach send button and the WiFi sync button) lacked proper ARIA attributes to indicate loading states. They disabled correctly but screen readers were unaware that a background process was running, leaving users hanging.
**Action:** Always ensure that buttons triggering asynchronous actions explicitly use the `aria-busy` attribute dynamically tied to their loading state, and include a visual indicator like a spinning icon (`fa-spinner fa-spin`) to signal activity.
