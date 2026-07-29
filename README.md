# 🎓 CS College Prep OS v2.0

> **An Open-Source, Cross-Platform 20-Day Computer Science Prep OS for Students**  
> Powered by **Svelte + Vue 3**, **Bun**, **Tauri v2**, **Tailwind CSS**, and **Google Gemini 1.5 Flash AI**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh/)
[![Svelte](https://img.shields.io/badge/Frontend-Svelte-ff3e00?logo=svelte)](https://svelte.dev/)
[![Vue.js](https://img.shields.io/badge/Frontend-Vue.js-4fc08d?logo=vuedotjs)](https://vuejs.org/)
[![Tauri v2](https://img.shields.io/badge/Native-Tauri_v2-24c8db?logo=tauri)](https://tauri.app/)

---

## 🌟 Overview

**CS College Prep OS** is an all-in-one preparation operating system designed for incoming Computer Science & Engineering students. It features an adaptive desktop & mobile native app interface, an **all-inclusive Master JSON State system**, an offline Web Bluetooth peer-to-peer sync engine, Anki SM-2 flashcards, an interactive C code runner with stack RAM variable inspection, and a **Context-Aware Gemini AI Assistant**.

---

## 💾 Master JSON State Specification

The application treats the exported JSON backup file as the **Master Source of Truth**. Exporting your progress produces `cs_prep_master_state_YYYY-MM-DD.json` containing:

```json
{
  "appVersion": "2.0.0",
  "exportTimestamp": "2026-07-29T19:34:00.000Z",
  "currentDay": 1,
  "completedTasks": { "day1_slot0": true, "day1_slot1": true },
  "customNotes": { "day1": "Mastered functions domain and range" },
  "problemLogs": { "day1_p1": "Solved using vector dot product formula" },
  "quizScores": { "1": 2 },
  "xp": 350,
  "streakCount": 3,
  "unlockedBadges": ["first_step", "code_ninja"],
  "soundMuted": false,
  "flashcardsState": { "card_1": { "interval": 4, "easeFactor": 2.5 } },
  "geminiApiKey": "AIzaSy...",
  "chatMessages": [
    { "role": "assistant", "text": "Hello! I am your AI Coach..." },
    { "role": "user", "text": "Explain limits L'Hôpital rule" }
  ]
}
```

- **1-Click Export**: Save your entire study progress, notes, AI API key, and full AI chat history.
- **1-Click Import / Load**: Select any backup file and choose between **Overwrite** (replace state) or **Merge** (combine progress).

---

## ✨ Full Feature Suite

- 🤖 **Context-Aware Gemini AI Coach (BYOK)**:
  - Configure your free Google AI Studio API key (`aistudio.google.com`).
  - Automatically aware of your active study day, math/physics topics, XP level, and live C code.
- 📶 **Offline Web Bluetooth & QR P2P Sync**:
  - Sync your study progress between phone and desktop completely offline without internet using Web Bluetooth or QR codes.
- 💻 **Interactive C Playground & Stack Memory Inspector**:
  - Write & execute C code in-browser, view stdout terminal output, and inspect local stack RAM variables.
- 🎴 **Anki SuperMemo-2 (SM-2) Spaced Repetition Flashcards**:
  - Algorithmically calculates review intervals ($I$) and ease factors ($EF$) based on rating performance.
- 📚 **20-Day 6-Session Video Study Materials**:
  - Curated topic notes, reference links (cppreference, MDN, VisuAlgo, MIT OCW), and embedded YouTube video lessons for all 20 days.
- 📱 **Multi-Platform Native Apps**:
  - Desktop: Windows (`.exe` / `.msi`), Linux (`.deb` / `.rpm`), macOS (`.dmg`).
  - Mobile: Android (`.apk`).

---

## ⚡ Quick Start Guide

### Prerequisites
- Install **[Bun](https://bun.sh/)** (recommended for ultra-fast installs) or Node.js v18+.
- Install **Rust** (`rustup`) for native desktop/mobile builds.

```bash
# 1. Clone & Install Dependencies
git clone https://github.com/your-username/College_Prep_Tasks.git
cd College_Prep_Tasks
bun install

# 2. Run Development Server
bun run dev

# 3. Build Vite Web Bundle
bun run build

# 4. Compile Native Desktop App (Linux / Windows / macOS)
bun run tauri build
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
