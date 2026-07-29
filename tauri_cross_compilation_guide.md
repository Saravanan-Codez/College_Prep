# CS College Prep OS — Tauri v2 Cross-Compilation Guide (Windows & Android)

This guide provides step-by-step instructions for compiling the **CS College Prep OS** into native **Windows (`.exe` / `.msi`)** installers and **Android (`.apk` / `.aab`)** packages.

---

## 🪟 Part 1: How to Compile for Windows (`.exe` / `.msi`)

### Option A: Compiling Directly on Windows (Recommended for Local Build)

#### 1. Prerequisites (One-Time Setup):
- **Windows 10 / 11**
- **Install C++ Build Tools**:
  1. Download [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
  2. Select **"Desktop development with C++"** workload and install.
- **Install Rust**:
  - Download and run [rustup-init.exe](https://rustup.rs/).
- **Install Bun**:
  - Open PowerShell and run:
    ```powershell
    powershell -c "irm bun.sh/install.ps1 | iex"
    ```

#### 2. Build Commands:
Open PowerShell / Command Prompt inside the repository folder:

```powershell
# 1. Install project dependencies
bun install

# 2. Build Vite frontend bundle
bun run build

# 3. Build Windows Executable (.exe & .msi installer)
bun run tauri build
```

- **Output Location**:
  `src-tauri\target\release\bundle\msi\CS College Prep OS_2.0.0_x64_en-US.msi`
  `src-tauri\target\release\cs-college-prep-os.exe`

---

### Option B: Building Windows Binary from Linux using `cargo-xwin`

If you are on Linux and want to build a Windows binary:

```bash
# 1. Install cargo-xwin cross-compiler helper
cargo install cargo-xwin

# 2. Add Windows target
rustup target add x86_64-pc-windows-msvc

# 3. Run Tauri build with target flag
bun run tauri build --target x86_64-pc-windows-msvc
```

---

## 📱 Part 2: How to Compile for Android (`.apk` / `.aab`)

### 1. Prerequisites (One-Time Setup):
- **Install Android Studio & SDK**:
  1. Download [Android Studio](https://developer.android.com/studio).
  2. Open SDK Manager, install **Android SDK Platform 33/34** and **Android NDK (Side by side)**.
  3. Set Environment Variables:
     ```bash
     export ANDROID_HOME=$HOME/Android/Sdk
     export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
     ```
- **Install Rust Android Targets**:
  ```bash
  rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
  ```

### 2. Android Build Commands:

```bash
# 1. Initialize Android project files inside Tauri (One-time)
bun run tauri android init

# 2. Build Release APK package
bun run tauri android build --apk

# Or build Android App Bundle (.aab for Google Play Store)
bun run tauri android build --aab
```

- **Output APK Location**:
  `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk`

---

## ☁️ Part 3: Automated Cloud Builds (Zero Setup required!)

We have already set up **GitHub Actions CI/CD** in `.github/workflows/build.yml`!

Whenever you push your code to GitHub:
1. GitHub automatically spins up virtual machines for **Windows**, **Linux**, **macOS**, and **Android**.
2. Compiles `.exe`, `.msi`, `.apk`, `.deb`, and `.dmg` installers in parallel.
3. Automatically attaches all compiled binaries to your GitHub Releases page!
