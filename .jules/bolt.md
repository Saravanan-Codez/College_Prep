## 2026-08-02 - Svelte LocalStorage Debouncing
**Learning:** Frequent synchronous calls to `localStorage.setItem` inside Svelte components (like on every task toggle or flashcard rating) can block the main thread and cause UI jank.
**Action:** Always debounce state persistence logic that handles large JSON objects, ensuring `beforeunload` and `visibilitychange` listeners are added to flush pending saves on exit.
