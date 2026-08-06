## 2026-08-02 - Svelte LocalStorage Debouncing
**Learning:** Frequent synchronous calls to `localStorage.setItem` inside Svelte components (like on every task toggle or flashcard rating) can block the main thread and cause UI jank.
**Action:** Always debounce state persistence logic that handles large JSON objects, ensuring `beforeunload` and `visibilitychange` listeners are added to flush pending saves on exit.

## 2026-08-03 - Secure Whitelist-Based Expression Evaluation
**Learning:** Relying on simple word character exclusions or regex blacklists in dynamic code evaluation (like `Function` or `eval`) is highly vulnerable to RCE via JSFuck or other non-alphanumeric JavaScript injection payloads.
**Action:** Restrict expressions to a strict character whitelist containing only digits, basic operators, parentheses, commas, dots, and whitespace after stripping predefined safe components.
