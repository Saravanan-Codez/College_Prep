# 🎓 EngiPrep by Falkon Labs

> **20-Day Engineering Mastery OS** — A cross-platform, offline-first study app for Computer Science & Engineering students preparing for college entrance and first-year coursework.

![Version](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-v2.0-FFC107?style=for-the-badge&logo=tauri&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-v4.2-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-v5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20Android%20%7C%20Linux%20%7C%20macOS-success?style=for-the-badge)
![Videos](https://img.shields.io/badge/YouTube%20Links-Verified%20✓-brightgreen?style=for-the-badge)

---

## 🌟 Core Features

- **📖 20-Day Curriculum** — 100% hand-crafted daily roadmap covering **Calculus**, **Physics**, **Chemistry**, **C Systems Programming**, **DSA**, **Web Dev**, and Systems Reading (*CSAPP / Clean Code*). Every topic has 4 specific exam-ready subtopics and **3 verified YouTube video links** (all links audited ✅).
- **✅ Interactive Subtopic Progress Markers** — Check off individual subtopics (`+15 XP`) with auto parent-task completion (`+50 XP`).
- **⚡ Dual-Engine C Code Runner**:
  - **Desktop / Mobile**: Compiles and executes native C via **GCC / Clang** (`-O2 -Wall -lm`) inside Tauri.
  - **Web Browser**: Client-side C execution sandbox with a visual Stack RAM Inspector.
- **🔊 Focus Soundscape & Music** — 10Hz Alpha Binaural Beats, Soft Rain, Focus Noise, Live Lofi Radio, and Spotify App integration.
- **📡 WiFi LAN Sync** — Offline peer-to-peer sync over local network or hotspot (Host/Client on port `7842`).
- **🤖 Context-Aware Gemini AI Coach** — Integrates your active day, subtopics, and C code for targeted tutoring.
- **💾 Full JSON Data Ownership** — Export/import your entire progress state (`engi_prep_state.json`).
- **🃏 Spaced Repetition Flashcards** — SM-2 algorithm for long-term retention of key definitions.
- **📊 Gamification System** — XP, streaks, level-ups, and unlockable achievement badges.

---

## 📚 Curriculum At a Glance

| Subject | Topics Covered (20 Days) |
|---|---|
| 📐 **Mathematics** | Functions & Limits → Derivatives → Integration → ODEs → 3D Vectors → Linear Algebra → Laplace & Fourier → Probability |
| ⚛️ **Physics** | Vectors & Units → Kinematics → Newton's Laws → Rotational Motion → SHM → Waves → Electromagnetism → Optics |
| 🧪 **Chemistry** | Atomic Structure → Chemical Bonding → Periodic Trends → Gas Laws → Thermochemistry → Equilibrium → Organic Chemistry |
| 💻 **C Programming** | Variables & I/O → Conditionals → Loops → Arrays → Strings → Functions → Pointers → Memory → Structs → Files → Capstone |
| 🌲 **DSA** | Search & Sort → Linked Lists → Stacks & Queues → Trees → Graphs → Dynamic Programming |
| 🌐 **Web Dev** | HTML5 → CSS Box/Flex/Grid → Responsive Design → JavaScript → DOM → Async/Await → REST API → Git → Deployment |

> Each day: **3 verified YouTube lectures** per subject + specific coding exercises + a chapter from *Clean Code* or *CSAPP*.

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Saravanan-Codez/College_Prep.git
cd College_Prep

# 2. Install dependencies
npm install

# 3. Run web dev server (instant — no Rust required)
npm run dev

# 4. Run full desktop app with Tauri backend
npm run tauri dev
```

**Prerequisites**: [Node.js v20+](https://nodejs.org) · [Rust stable](https://rustup.rs) · [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) *(Windows only)*

---

## 🏗️ Build Commands by Platform

### Environment Variables (Android / Linux / macOS)

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/29.0.13846066"
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
export PATH="$HOME/.cargo/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

### 1. 🌐 Web Application

```bash
npm run build      # → dist/  (deploy to Netlify, Vercel, etc.)
npm run preview    # preview production build locally
```

*Netlify: Build command `npm run build` · Publish directory `dist` · `NODE_VERSION=20`*

---

### 2. 📱 Android (APK & AAB)

```bash
# One-click release APK
npm run build:android

# Debug APK (for direct device testing)
npm run tauri android build --target aarch64 --apk --debug

# Google Play App Bundle
npm run build:android:aab
```

*Output: `src-tauri/gen/android/app/build/outputs/apk/universal/`*

👉 **Installing APK on your phone via ADB?** See the step-by-step **[ADB Installation Guide (Windows, Linux, macOS)](adb_installation_guide.md)**.

---

### 3. 🪟 Windows Desktop (.exe / .msi)

```cmd
npm run build:windows
```

*Outputs:*
- `src-tauri\target\release\cs-college-prep-os.exe`
- `src-tauri\target\release\bundle\msi\EngiPrep_2.0.0_x64_en-US.msi`
- `src-tauri\target\release\bundle\nsis\EngiPrep_2.0.0_x64-setup.exe`

---

### 4. 🐧 Linux Desktop (.AppImage / .deb)

```bash
rustup target add x86_64-unknown-linux-gnu
npm run tauri build
```

*Output: `src-tauri/target/release/bundle/{appimage,deb}/`*

---

### 5. 🍎 macOS Desktop (.dmg / .app)

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run tauri build
```

*Output: `src-tauri/target/release/bundle/{dmg,macos}/`*

---

## ☁️ Automated CI/CD (GitHub Actions)

Publishing a **GitHub Release** triggers 4 parallel runners (**Windows · Linux · macOS · Android**) that compile all release binaries and attach them to the Release Assets automatically.

Workflow: [`.github/workflows/build.yml`](.github/workflows/build.yml)

---

## 🛠️ Project Structure

```text
College_Prep/
├── index.html                  # Main HTML entry point
├── netlify.toml                # Netlify deployment config
├── package.json                # Scripts & dependencies
├── vite.config.js              # Vite bundler configuration
├── .github/
│   └── workflows/
│       └── build.yml           # Multi-platform CI/CD release workflow
├── public/
│   └── favicon.png             # Falkon Labs logo
├── scripts/
│   └── build-android.ps1       # 1-click Android release script
├── src/
│   ├── App.svelte              # Main Svelte UI shell (tabs, state, layout)
│   ├── components/
│   │   └── SplashScreen.svelte # Animated Falkon Labs splash screen
│   ├── css/
│   │   └── styles.css          # Dark glassmorphism design system
│   ├── js/
│   │   ├── app.js              # Core state manager & persistence layer
│   │   ├── data/
│   │   │   ├── curriculum.js   # ⭐ 20-day topics, subtopics & video links
│   │   │   ├── quizzes.js      # Daily quiz question banks
│   │   │   ├── flashcards.js   # SM-2 spaced repetition flashcard deck
│   │   │   └── snippets.js     # Day-by-day C code snippet examples
│   │   └── modules/
│   │       ├── audio.js        # Soundscape synthesizer & Spotify integration
│   │       ├── aiMentor.js     # Gemini AI coach API integration
│   │       ├── cRunner.js      # C code execution bridge (native + WASM)
│   │       ├── gamification.js # XP, levels, streaks & achievement badges
│   │       ├── sm2Engine.js    # Spaced repetition SM-2 algorithm
│   │       └── bluetoothP2PSync.js  # WiFi LAN peer-to-peer sync engine
│   └── resources/
│       └── images/             # Falkon Labs brand assets
└── src-tauri/
    ├── Cargo.toml              # Rust dependencies
    ├── tauri.conf.json         # App metadata & bundle configuration
    ├── gen/android/            # Generated Android Studio Gradle project
    └── src/
        ├── main.rs             # Windows GUI entry (hidden console mode)
        └── lib.rs              # Rust HTTP sync server & GCC C compiler bridge
```

---

## 🤝 Contributing

We welcome contributions of all kinds. Whether you're fixing a typo, adding a flashcard, or improving a subtopic explanation — every improvement directly helps a student preparing for their exams.

👉 Read the full **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup, workflow, and code guidelines.

**Quick ways to contribute:**

| Area | File to Edit |
|---|---|
| 📝 Improve topic subtopics | [`src/js/data/curriculum.js`](src/js/data/curriculum.js) |
| 🎬 Fix / suggest better YouTube videos | [`src/js/data/curriculum.js`](src/js/data/curriculum.js) |
| 🃏 Add flashcard definitions | [`src/js/data/flashcards.js`](src/js/data/flashcards.js) |
| ❓ Add quiz questions | [`src/js/data/quizzes.js`](src/js/data/quizzes.js) |
| 💻 Add C code snippets | [`src/js/data/snippets.js`](src/js/data/snippets.js) |
| 🐛 Report bugs / broken links | [GitHub Issues](../../issues) |

---

## 📄 License

Developed by **Falkon Labs**. All rights reserved.
