## 2026-08-02 - Svelte LocalStorage Debouncing
**Learning:** Frequent synchronous calls to `localStorage.setItem` inside Svelte components (like on every task toggle or flashcard rating) can block the main thread and cause UI jank.
**Action:** Always debounce state persistence logic that handles large JSON objects, ensuring `beforeunload` and `visibilitychange` listeners are added to flush pending saves on exit.

## 2026-08-04 - Redundant Iteration Loop String Checks
**Learning:** Evaluating multiple independent string inclusion checks (e.g. `k.includes('slotX')`) in tight loops over object keys is highly redundant if the keys represent mutually exclusive properties. This results in unnecessary string searches.
**Action:** Use `if-else if` control structures when properties are mutually exclusive to skip remaining checks once a match is found.
