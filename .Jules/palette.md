## 2024-05-24 - Screen Reader Support for Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where icon-only interactive elements in the application shell (like task toggles) and modals (like close buttons) lacked descriptive `aria-label`s, rendering their purpose invisible to screen reader users.
**Action:** Always verify that interactive buttons relying solely on visual icons have context-aware `aria-label` attributes to maintain full screen reader accessibility.
## 2026-08-01 - Form Inputs and Landmark Accessibility
**Learning:** Encountered an accessibility issue pattern where inputs (such as text inputs, selectors, and textareas) lacked associated labels, preventing screen readers from identifying their purpose. Additionally, multiple navigation landmarks (`<nav>`) existed without descriptive names, causing confusion for structural navigation.
**Action:** When implementing or reviewing components, always verify that interactive form elements have visible `<label>`s or `aria-label` attributes, and ensure `<nav>` tags include descriptive `aria-label`s to distinguish different navigation areas (e.g., Main Navigation vs. Mobile Navigation).

## 2024-10-27 - Screen Reader Support for Custom Checkboxes
**Learning:** Found an accessibility issue pattern where custom visually-styled toggles (e.g., the subtask markers) lacked semantic screen-reader states. While they visually represented checked/unchecked states through colors and icons, they were announced simply as buttons, leaving screen reader users unaware of their state.
**Action:** Always verify that interactive buttons functioning as checkboxes have explicit `role="checkbox"` and `aria-checked` attributes matching their internal state to maintain full screen reader accessibility.

## 2024-05-24 - Async Button State and Accessibility
**Learning:** Found that async buttons (like the AI Mentor chat send button) lacked visual loading states and screen reader announcements while operations were pending, leaving users unsure if an action was processing.
**Action:** Always ensure async action buttons visually indicate their loading state (e.g. replacing icons with spinners) and include the `aria-busy="true"` attribute to explicitly announce the loading state to screen readers.
## 2026-08-07 - Add aria-labels to dynamically generated buttons
**Learning:** When using loops (`{#each}`) to dynamically render buttons that contain dynamic text and icons, screen readers may not accurately describe the button's action if only an icon or generic text is provided.
**Action:** Ensure dynamic action buttons like 'Copy IP' or 'Copy Link' have descriptive `aria-label` attributes that fully describe what action will be taken, such as interpolating variables directly into the `aria-label` (e.g., `aria-label="Copy IP {ip} to clipboard"`).

## 2024-11-20 - Navigation Items and aria-current
**Learning:** Found an accessibility issue pattern where active navigation buttons relied solely on visual cues (the `.active` class) to denote their state, leaving screen reader users unaware of the current page/section.
**Action:** When implementing or reviewing navigation items (tabs, links, or buttons acting as navigation), always verify they include the `aria-current="page"` attribute dynamically bound to their active state to ensure structural context for screen readers.
