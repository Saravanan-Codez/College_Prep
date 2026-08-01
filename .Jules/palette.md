## 2024-05-24 - Screen Reader Support for Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where icon-only interactive elements in the application shell (like task toggles) and modals (like close buttons) lacked descriptive `aria-label`s, rendering their purpose invisible to screen reader users.
**Action:** Always verify that interactive buttons relying solely on visual icons have context-aware `aria-label` attributes to maintain full screen reader accessibility.
## 2026-08-01 - Form Inputs and Landmark Accessibility
**Learning:** Encountered an accessibility issue pattern where inputs (such as text inputs, selectors, and textareas) lacked associated labels, preventing screen readers from identifying their purpose. Additionally, multiple navigation landmarks (`<nav>`) existed without descriptive names, causing confusion for structural navigation.
**Action:** When implementing or reviewing components, always verify that interactive form elements have visible `<label>`s or `aria-label` attributes, and ensure `<nav>` tags include descriptive `aria-label`s to distinguish different navigation areas (e.g., Main Navigation vs. Mobile Navigation).
