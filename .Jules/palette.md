## 2024-05-24 - Screen Reader Support for Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where icon-only interactive elements in the application shell (like task toggles) and modals (like close buttons) lacked descriptive `aria-label`s, rendering their purpose invisible to screen reader users.
**Action:** Always verify that interactive buttons relying solely on visual icons have context-aware `aria-label` attributes to maintain full screen reader accessibility.
## 2026-08-02 - Focus-visible for accessibility
**Learning:** Interactive elements with `outline: none` completely break keyboard navigation. Relying solely on `:hover` styles is insufficient for accessibility.
**Action:** Use `:focus-visible` to selectively add focus rings only for keyboard users, maintaining visual cleanliness for mouse users while ensuring full accessibility.
