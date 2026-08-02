# Changelog

All notable changes to **EngiPrep** are documented here.

---

## [2.0.1] — 2026-07-30

### 🎬 Curriculum — YouTube Video Audit
- Audited all **63 YouTube video IDs** across the 20-day curriculum via the YouTube oEmbed API
- Replaced **27 broken / deleted videos** (404/400) with verified working alternatives from trusted educational channels (3Blue1Brown, CrashCourse, Khan Academy, MIT OCW, freeCodeCamp, CS50)
- Final result: **0 broken links** out of 47 unique video IDs

### 📚 Curriculum — Subtopic Enrichment
- Replaced all **generic placeholder subtopics** (e.g. *"Theoretical Fundamentals & Definitions"*) across Days 6–20 with **specific, exam-relevant bullet points** for every subject
- Enriched **86 topic blocks** covering Mathematics, Physics, Chemistry, C Programming, DSA, and Web Development
- Replaced **45 generic program placeholders** (e.g. *"Day 10 Program 1"*) with descriptive C exercise names

### 📝 Repository
- Rewrote `README.md` with curriculum overview table, quick-start section, contributor guide table, and enriched project structure tree
- Rewrote `CONTRIBUTING.md` with curriculum PR rules, YouTube video verification guidelines, commit conventions, and contribution type table
- Added GitHub Issue templates: **Bug Report** and **Curriculum Improvement**
- Added this `CHANGELOG.md`

---

## [2.0.0] — 2026-07-xx

### Added
- Cross-platform Tauri v2 app (Windows, Android, Linux, macOS)
- 20-day engineering curriculum with Math, Physics, Chemistry, C, DSA, Web
- Dual-engine C code runner (native GCC + browser WASM)
- WiFi LAN peer-to-peer sync (Host/Client on port 7842)
- Gemini AI context-aware study coach
- SM-2 spaced repetition flashcard engine
- Gamification system: XP, streaks, level-up, achievement badges
- Focus soundscapes: binaural beats, rain, lofi radio, Spotify integration
- Full JSON state export/import
- Automated multi-platform GitHub Actions CI/CD

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*
