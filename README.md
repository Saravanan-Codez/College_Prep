# EngiPrep by Falkon Labs

> **20-Day Engineering Mastery OS** — A cross-platform, offline-first study app for Computer Science & Engineering students.

![EngiPrep](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-v2.0-FFC107?style=for-the-badge&logo=tauri&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-v4.2-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-v5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 🌟 Core Features

- **📖 20-Day In-Depth Curriculum**: 100% hand-crafted roadmap covering Calculus, Physics, Chemistry, C Systems Programming, DSA, Web Dev, and Systems Reading (CSAPP / Clean Code).
- **✅ Interactive Subtopic Progress Markers**: Check off individual subtopics (`+15 XP`) with automatic parent task completion (`+50 XP`).
- **⚡ Dual-Engine C Code Runner**:
  - **Desktop / Mobile**: Compiles and executes native C code via **GCC / Clang** (`-O2 -Wall -lm`) inside Tauri.
  - **Web Browser**: Runs client-side C Execution Engine & Interactive Stack RAM Inspector.
- **🔊 Focus Soundscape & Music**: 10Hz Alpha Binaural Beats, Soft Rain, Focus Noise, Live Lofi Radio, and direct Spotify App integration.
- **📡 WiFi LAN Sync**: Offline peer-to-peer sync over local network or mobile hotspot (Host/Client mode on port `7842`).
- **🤖 Context-Aware Gemini AI Coach**: Integrates your current study day, subtopics, and C code context for targeted tutoring.
- **💾 Full JSON Data Ownership**: Export and import your entire state (`engi_prep_state.json`).

---

## 🚀 Build Commands by Platform

### Environment Setup (Prerequisites)

```bash
# Set Android & Java environment variables (Linux / macOS)
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/26.1.10909125"
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
export PATH="$HOME/.bun/bin:$HOME/.cargo/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

---

### 1. 🌐 Web Application (Netlify / Vercel / Static Hosting)

```bash
# Install dependencies
bun install   # or: npm install

# Build static production bundle to dist/
bun run build # or: npm run build

# Preview production build locally
bun run preview
```

**Netlify Deployment Settings:**
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variable**: `NODE_VERSION = 20`

---

### 2. 📱 Android Mobile (APK & AAB)

#### Debug APK (For Immediate Device Testing)
```bash
bun run tauri android build --target aarch64 --apk --debug
```
*Output Location:* `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`

#### Release APK (Optimized for Distribution)
```bash
bun run tauri android build --target aarch64 --apk
```
*Output Location:* `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

#### Android App Bundle (Google Play Store AAB)
```bash
bun run tauri android build --target aarch64 --aab
```

---

### 3. 🐧 Linux Desktop (.AppImage / .deb)

```bash
# Add rust target
rustup target add x86_64-unknown-linux-gnu

# Build Linux AppImage and DEB packages
bun run tauri build
```
*Output Location:* `src-tauri/target/release/bundle/appimage/` and `src-tauri/target/release/bundle/deb/`

---

### 4. 🪟 Windows Desktop (.exe / .msi)

```cmd
:: On Windows machine (PowerShell / CMD)
rustup target add x86_64-pc-windows-msvc

:: Build Windows installer (.msi) and standalone executable (.exe)
bun run tauri build
```
*Output Location:* `src-tauri\target\release\bundle\msi\` and `src-tauri\target\release\bundle\nsis\`

---

### 5. 🍎 macOS Desktop (.dmg / .app)

```bash
# On macOS machine (Intel / Apple Silicon)
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

# Build macOS DMG and Application bundle
bun run tauri build
```
*Output Location:* `src-tauri/target/release/bundle/dmg/` and `src-tauri/target/release/bundle/macos/`

---

## 🛠️ Project Structure

```
College_Prep/
├── index.html                 # Main HTML entry with mobile viewport settings
├── netlify.toml               # Netlify production build configuration
├── package.json               # Node.js dependencies & scripts
├── public/
│   └── favicon.png            # Falkon Labs logo browser favicon
├── src/
│   ├── App.svelte             # Main Svelte UI Shell
│   ├── components/
│   │   └── SplashScreen.svelte# Animated Falkon Labs Splash Screen
│   ├── css/
│   │   └── styles.css         # Dark glassmorphism design system
│   ├── js/
│   │   ├── data/              # 20-day curriculum, quizzes, flashcards
│   │   └── modules/           # Audio synth, AI mentor, C runner, P2P sync
│   └── resources/
│       └── images/            # Falkon Labs PNG logo asset
└── src-tauri/
    ├── Cargo.toml             # Rust dependencies (lazy_static, get_if_addrs)
    ├── tauri.conf.json        # EngiPrep app metadata & bundle configuration
    └── src/
        └── lib.rs             # Rust native HTTP sync server & GCC C compiler backend
```

---

## 📄 License

Developed by **Falkon Labs**. All rights reserved.
