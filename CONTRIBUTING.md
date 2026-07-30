# Contributing to EngiPrep

Thank you for taking the time to contribute to **EngiPrep** — an open study tool built for CS & Engineering students. Every improvement you make directly helps real students prepare better.

---

## 📋 Table of Contents

- [Ways to Contribute](#-ways-to-contribute)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [PR Workflow](#-pull-request-pr-workflow)
- [Curriculum Contributions](#-curriculum-contributions)
- [Code Guidelines](#-code-architecture-guidelines)
- [Commit Conventions](#-commit-conventions)

---

## 💡 Ways to Contribute

| Contribution Type | Where |
|---|---|
| 📝 Improve topic subtopics (more specific, exam-relevant) | `src/js/data/curriculum.js` |
| 🎬 Fix a broken YouTube video link or suggest a better one | `src/js/data/curriculum.js` |
| 🃏 Add spaced repetition flashcards | `src/js/data/flashcards.js` |
| ❓ Add or improve daily quiz questions | `src/js/data/quizzes.js` |
| 💻 Add/improve C code snippet examples | `src/js/data/snippets.js` |
| 🐛 Report a UI bug, broken feature, or typo | [GitHub Issues](../../issues) |
| 🌐 Improve CSS styling or accessibility | `src/css/styles.css` |
| 🦀 Improve Rust backend commands | `src-tauri/src/lib.rs` |

> **Curriculum data files** (`curriculum.js`, `flashcards.js`, `quizzes.js`, `snippets.js`) are the easiest starting point — no Rust or build tools required!

---

## ✅ Prerequisites

Before contributing, make sure you have:

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | v20.x or higher | Frontend dev server & builds |
| **npm** | v10.x or higher | Package management |
| **Rust** | Latest stable | Tauri native backend |
| **Git** | Any recent version | Version control |

Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

---

## 🛠️ Getting Started

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/College_Prep.git
cd College_Prep

# 2. Install dependencies
npm install

# 3. Start the web dev server (fastest — no Rust needed)
npm run dev

# 4. Or run the full desktop app with Tauri
npm run tauri dev
```

The web dev server (`npm run dev`) opens in your browser and hot-reloads on every file change — ideal for working on curriculum data or UI changes.

---

## 🔀 Pull Request (PR) Workflow

1. **Create a topic branch** off `main`:
   ```bash
   git checkout -b feat/add-digital-logic-topic
   # or
   git checkout -b fix/broken-video-day-5-physics
   # or
   git checkout -b docs/improve-contributing-guide
   ```

2. **Make your changes** and test them locally (`npm run dev`).

3. **Verify the build passes** before opening your PR:
   ```bash
   # Frontend build check
   npm run build

   # Rust backend check (if you touched src-tauri/)
   cd src-tauri && cargo check && cd ..
   ```

4. **Push & open a Pull Request** against `main`:
   ```bash
   git push origin feat/add-digital-logic-topic
   ```
   Then open a PR on GitHub with a clear title and description of what you changed and why.

---

## 📚 Curriculum Contributions

The curriculum lives in [`src/js/data/curriculum.js`](src/js/data/curriculum.js). Each day entry looks like:

```js
{
  "day": 1,
  "phase": "Phase 1: Foundations",
  "math": {
    "topic": "Functions, Domain & Range",
    "subtopics": [
      "Types of Functions (One-to-One, Onto, Bijective)",
      "Algebra & Composition of Functions",
      "Domain & Range Algebraic Determination",
      "Piecewise Functions & Graphs"
    ],
    "docsUrl": "https://ocw.mit.edu/...",
    "videos": [
      {
        "title": "Channel Name - Descriptive Video Title",
        "embedId": "YouTube_Video_ID",
        "url": "https://www.youtube.com/watch?v=YouTube_Video_ID"
      }
    ]
  }
}
```

### Rules for Curriculum PRs

- ✅ **Subtopics must be specific** — e.g. `"u-Substitution: Choosing the Correct Inner Function u"` not `"Integration techniques"`.
- ✅ **YouTube links must be verified working** — paste the URL in your browser before submitting. Deleted or private videos will be rejected.
- ✅ **Videos should be from reputable educational channels** — 3Blue1Brown, CrashCourse, Khan Academy, MIT OpenCourseWare, CS50, freeCodeCamp, Traversy Media, etc.
- ✅ **Programs array** — should name specific exercises, e.g. `"Dynamic Array with malloc/free"` not `"Day 10 Program 1"`.

---

## 🎨 Code Architecture Guidelines

### Frontend (`src/`)
- Built with **Svelte 4** and Vanilla CSS design tokens
- All state lives in `App.svelte` reactive variables
- Keep components focused and modular
- Avoid inline styles; use CSS custom properties from `styles.css`

### Native Backend (`src-tauri/src/`)
- Written in **Rust** using Tauri v2 plugin architecture
- Custom Tauri commands go in `src-tauri/src/lib.rs`
- Keep `main.rs` minimal — it preserves the `windows_subsystem = "windows"` attribute that hides the terminal on Windows

### Data Files (`src/js/data/`)
- Plain JavaScript `export const` objects — no build step needed
- Keep JSON structure consistent with existing entries

---

## 📝 Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add quadratic formula to Day 3 math subtopics
fix: Replace broken YouTube video in Day 7 physics
docs: Clarify Rust setup in CONTRIBUTING
style: Improve flashcard card flip animation
refactor: Extract gamification XP logic to module
```

---

Thank you for helping make engineering education open-source and accessible. Every contribution matters. 🎓
