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

## 2024-05-24 - Async Button State for Execution Pipelines
**Learning:** Found that long-running operations like compiling and running C code lacked visual loading states and screen reader announcements, leaving users unsure if an action was processing.
**Action:** When implementing UI loading states for execution pipelines, ensure both Tauri IPC calls and web browser fallbacks explicitly return Promises (e.g., wrapping `setTimeout`) so the frontend can correctly `await` their completion, show a visual loading spinner, and set `aria-busy="true"`.

## 2024-05-24 - Semantic Roles for Custom Progress Bars
**Learning:** Found an accessibility issue pattern where custom visual progress bars (using `div`s with animated widths) lacked semantic meaning, rendering them invisible to screen readers.
**Action:** When implementing custom progress bars, always ensure the container element includes `role="progressbar"` along with dynamic `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and a descriptive `aria-label` to provide accurate context to screen readers.

## 2024-11-20 - Toggle Buttons and aria-pressed
**Learning:** Found an accessibility issue pattern where toggle buttons (like Theme selectors or Soundscape presets) indicated their active state visually via an `.active` class but lacked semantic meaning, leaving screen reader users unaware of which option was currently selected or "pressed".
**Action:** When implementing toggle buttons (or buttons acting as radio/selection options), always ensure they include the `aria-pressed` attribute dynamically bound to their active state (e.g., `aria-pressed={isActive}`) to accurately announce their status to screen readers.

## 2024-05-18 - Async Action Button Loading States & Icon Button A11y
**Learning:** Found multiple instances where asynchronous action buttons lacked proper loading indicators and disabled states, and some icon-only buttons were missing essential ARIA labels. Proper loading states provide crucial feedback during operations like network syncing, preventing confusing double clicks. `aria-label`s on icon-only buttons like the Youtube play/copy link are essential to explain the action.
**Action:** When implementing async actions, always bind a `disabled` state and `aria-busy` to an `isProcessing` flag, wrapping the actual operation in a `try...finally` block to ensure the flag is unset. Always ensure any button consisting solely of icons or ambiguous text has a clear `aria-label` describing its exact effect.

## 2024-05-24 - Screen Reader Support for Dynamic Toast Notifications
**Learning:** Found an accessibility issue pattern where dynamic toast notifications (temporary messages added to the DOM) lacked live region roles. Without `role="status"` and `aria-live="polite"`, these notifications are completely invisible to screen readers, leaving those users unaware of successful actions or errors.
**Action:** When implementing or reviewing dynamic notification elements like toasts, always ensure they include `role="status"` (or `role="alert"` for critical messages) and an appropriate `aria-live` attribute so they are reliably announced by screen readers without interrupting the user.

## 2026-08-26 - AI Chat Window Auto-Scrolling and Input Disabling
**Learning:** Found that dynamic chat containers without auto-scroll force users to scroll manually after every response, degrading UX. Also, failing to disable inputs during async generation allows accidental double-submissions, leading to race conditions or duplicate AI requests.
**Action:** When implementing dynamic chat interfaces, use Svelte's `tick()` followed by `scrollTop = scrollHeight` to ensure new messages are always visible. Additionally, always bind the `disabled` state of input fields and buttons to the `isProcessing` flag to prevent multiple submissions.
