# CS College Prep OS — Tauri v2 Cross-Compilation Guide

This guide provides step-by-step instructions for compiling **EngiPrep** into native **Windows (`.exe` / `.msi`)** installers and **Android (`.apk`)** packages.

---

## 🪟 Part 1: Compiling for Windows (`.exe` / `.msi`)

### Quick Build Command
Open PowerShell / Command Prompt inside the repository folder:

```powershell
# Build Windows Executable (.exe & .msi installer)
npm run build:windows
```

- **Output Locations**:
  - Standalone Executable: `src-tauri\target\release\cs-college-prep-os.exe`
  - MSI Installer: `src-tauri\target\release\bundle\msi\EngiPrep_2.0.0_x64_en-US.msi`
  - NSIS Setup: `src-tauri\target\release\bundle\nsis\EngiPrep_2.0.0_x64-setup.exe`

*(Note: The build is configured with `windows_subsystem = "windows"` so no background console window appears when running the app.)*

---

## 📱 Part 2: Compiling for Android (`.apk`)

### Quick Build Command
Run the single automated build command in PowerShell:

```powershell
npm run build:android
```

- **Output Location**:
  `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

---

## ☁️ Part 3: Automated Cloud Builds (GitHub Releases)

We have configured **GitHub Actions CI/CD** in `.github/workflows/build.yml`!

- Everyday git commits do **not** trigger slow builds.
- When you publish a **GitHub Release**, GitHub Actions automatically spins up parallel runners (**Windows**, **Linux**, **macOS**, and **Android**), compiles all release binaries, and attaches them directly under the **Assets** section of your GitHub Release page!
