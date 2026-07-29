# 🎓 CS College Prep OS v2.0

> **An Open-Source, Cross-Platform 20-Day Computer Science Prep OS for Students**  
> Powered by **Svelte + Vue 3**, **Bun**, **Tauri v2**, **Tailwind CSS**, and **Google Gemini 1.5 Flash AI**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh/)
[![Svelte](https://img.shields.io/badge/Frontend-Svelte-ff3e00?logo=svelte)](https://svelte.dev/)
[![Vue.js](https://img.shields.io/badge/Frontend-Vue.js-4fc08d?logo=vuedotjs)](https://vuejs.org/)
[![Tauri v2](https://img.shields.io/badge/Native-Tauri_v2-24c8db?logo=tauri)](https://tauri.app/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

---

## 🌟 Overview

**CS College Prep OS** is a comprehensive, interactive 20-day preparation system designed for incoming Computer Science & Engineering students. It combines daily multi-session study schedules, an interactive C code runner with stack memory inspection, Anki SuperMemo-2 flashcards, offline Web Bluetooth peer-to-peer progress sync, Web Audio focus soundscapes, and a **Context-Aware Gemini AI Assistant**.

---

## ✨ Key Features

- 🤖 **Context-Aware Gemini AI Coach (BYOK)**:
  - Bring-Your-Own-Key Google AI Studio integration (`aistudio.google.com`).
  - Automatically aware of your active study day, math/physics topics, XP level, and live C playground code.
- 📶 **Offline Web Bluetooth & QR P2P Sync**:
  - Sync your study progress between phone and desktop completely offline without internet using Web Bluetooth or QR codes.
- 💻 **Interactive C Playground & Memory Inspector**:
  - Run C code in-browser, view stdout terminal output, and inspect local stack RAM variables.
- 🎴 **Anki SuperMemo-2 (SM-2) Spaced Repetition Flashcards**:
  - Algorithmically calculates review intervals ($I$) and ease factors ($EF$) based on rating performance.
- 🎧 **Web Audio Focus Soundscapes**:
  - 100% offline synthesized 10Hz Alpha Binaural Beats, Soft Rain, and Pink Noise.
- 💾 **JSON Progress Backup & Restore**:
  - Export progress backup files and import/merge with 1 click.
- 📱 **Multi-Platform Native Apps**:
  - Desktop: Windows (`.exe` / `.msi`), Linux (`.deb` / `.rpm`), macOS (`.dmg`).
  - Mobile: Android (`.apk`).

---

## 📂 Codebase Architecture

```
College_Prep_Tasks/
├── index.html                  # Clean HTML5 Entry Shell
├── package.json                # Bun & Vite dependencies
├── bunfig.toml                 # Bun runtime configuration
├── vite.config.js              # Vite build setup compiling Svelte & Vue components
├── manifest.json               # Progressive Web App (PWA) Manifest
├── sw.js                       # 100% Offline Service Worker Cache
├── tauri_cross_compilation_guide.md # Detailed Windows & Android build guide
├── .github/workflows/build.yml # Automated CI/CD cross-compilation pipeline
├── src-tauri/                  # Tauri v2 Rust Native Desktop & Mobile Kernel
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
└── src/                        # Frontend Components & Data
    ├── App.svelte              # Main Svelte App Controller
    ├── main.js                 # App Entrypoint
    ├── css/styles.css          # Design Tokens & Tailwind CSS
    └── js/
        ├── data/               # Curriculum, Quizzes, C Snippets, Flashcards
        └── modules/            # Audio SFX, C Runner, SM-2 Engine, P2P Sync, AI Mentor
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Install **[Bun](https://bun.sh/)** (recommended for ultra-fast installs) or Node.js v18+.
- Install **Rust** (`rustup`) for native desktop/mobile builds.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/College_Prep_Tasks.git
cd College_Prep_Tasks
bun install
```

### 2. Run Development Server
```bash
bun run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build Web Bundle
```bash
bun run build
```

### 4. Run Native Tauri Desktop App
```bash
bun run tauri dev
```

### 5. Compile Native Desktop Release Binaries
```bash
bun run tauri build
```
- **Linux Executable Binary**: `src-tauri/target/release/cs-college-prep-os`
- **Debian Package**: `src-tauri/target/release/bundle/deb/CS College Prep OS_2.0.0_amd64.deb`
- **RPM Package**: `src-tauri/target/release/bundle/rpm/CS College Prep OS-2.0.0-1.x86_64.rpm`

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting pull requests and reporting issues.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
