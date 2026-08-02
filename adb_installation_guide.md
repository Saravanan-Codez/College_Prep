# 📲 Complete ADB Android Installation Guide (Windows, Linux, macOS)

This guide provides step-by-step instructions for installing the **EngiPrep APK** (`app-universal-release-unsigned.apk` or `app-release.apk`) directly onto your Android smartphone using **ADB (Android Debug Bridge)** over USB or Wireless Debugging.

---

## 📱 Part 1: Android Phone Setup (Required for All Platforms)

Before running ADB commands on your computer, enable **Developer Options** and **USB Debugging** on your phone:

### 1. Enable Developer Options:
1. Open **Settings** on your Android phone.
2. Scroll down and tap **About Phone** (or *System Info*).
3. Find **Build Number** (on Xiaomi/MIUI, tap *MIUI Version*; on Samsung, tap *Software Information* > *Build Number*).
4. Tap **Build Number 7 times** continuously until you see a pop-up saying *"You are now a developer!"*.

### 2. Enable USB Debugging:
1. Go back to main **Settings** → **System** (or *Additional Settings*).
2. Tap **Developer Options**.
3. Scroll down to **Debugging** and toggle **USB Debugging** to **ON**.
4. *(Optional for Xiaomi / MIUI users)*: Enable **"Install via USB"** and **"USB Debugging (Security Settings)"**.

---

## 🪟 Part 2: Installing APK from Windows

### Step 1: Obtain ADB Tool on Windows
If you installed Android SDK earlier, `adb.exe` is located at `C:\Users\<User>\AppData\Local\Android\Sdk\platform-tools\adb.exe` or `D:\Apps\platform-tools\adb.exe`.

If you do NOT have ADB installed:
1. Download [SDK Platform-Tools for Windows (ZIP)](https://dl.google.com/android/repository/platform-tools-latest-windows.zip).
2. Extract the ZIP folder to `C:\platform-tools`.

### Step 2: Connect Phone & Authorize
1. Connect your Android phone to your PC using a USB cable.
2. Change USB connection mode on your phone to **File Transfer / MTP**.
3. Open **PowerShell** or **Command Prompt** and navigate to your ADB folder (or project folder):
   ```powershell
   cd C:\platform-tools
   ```
4. Check if your phone is detected:
   ```powershell
   .\adb.exe devices
   ```
5. Look at your phone screen! A pop-up prompt will ask:  
   **"Allow USB Debugging?"**  
   Check **"Always allow from this computer"** and tap **Allow**.
6. Run `.\adb.exe devices` again. The status should now say `device` (not `unauthorized`).

### Step 3: Install the APK
Run the following command pointing to your compiled APK path:

```powershell
# From your project directory:
.\adb.exe install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

*(Note: The `-r` flag reinstalls/updates the app while retaining user data).*

---

## 🐧 Part 3: Installing APK from Linux (Ubuntu / Debian / Arch / Fedora)

### Step 1: Install ADB via Package Manager

- **Ubuntu / Debian / Mint**:
  ```bash
  sudo apt update
  sudo apt install -y android-tools-adb android-tools-fastboot
  ```

- **Arch Linux / Manjaro**:
  ```bash
  sudo pacman -S android-tools
  ```

- **Fedora / RHEL**:
  ```bash
  sudo dnf install android-tools
  ```

### Step 2: Connect Phone & Set Permissions
1. Connect your phone via USB cable.
2. Verify ADB server is running:
   ```bash
   adb devices
   ```
3. Look at your Android phone screen and accept the **"Allow USB Debugging?"** prompt.

### Step 3: Install the APK
From your project directory terminal, run:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

---

## 🍎 Part 4: Installing APK from macOS (Intel & Apple Silicon)

### Step 1: Install ADB via Homebrew
Open Terminal and install `platform-tools` using Homebrew:

```bash
# Install Homebrew if not already installed:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install android-platform-tools
```

### Step 2: Connect Phone & Authorize
1. Connect your Android phone to your Mac using a USB-C / USB cable.
2. In Terminal, run:
   ```bash
   adb devices
   ```
3. Tap **Allow** on your phone's screen prompt.

### Step 3: Install the APK
From your project directory in Terminal, run:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

---

## 📶 Part 5: Wireless ADB Installation (No Cable Required!)

For Android 11+ devices on the same Wi-Fi network:

1. On your phone: Go to **Settings** → **Developer Options** → Enable **Wireless Debugging**.
2. Tap **Wireless Debugging** → Tap **"Pair device with pairing code"**. Note the IP address, Port, and 6-digit Code.
3. On your computer:
   ```bash
   adb pair <IP_ADDRESS>:<PAIRING_PORT>
   # Enter the 6-digit code when prompted
   ```
4. Connect to the device:
   ```bash
   adb connect <IP_ADDRESS>:<CONNECT_PORT>
   ```
5. Install the APK:
   ```bash
   adb install -r path/to/app-release-unsigned.apk
   ```

---

## ❓ Troubleshooting Common ADB Errors

| Error Message | Cause | Solution |
| :--- | :--- | :--- |
| `device unauthorized` | Phone authorization prompt not accepted yet | Unlock phone, disconnect/reconnect USB, and tap "Always Allow". |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Existing version signed with a different key | Uninstall previous version of EngiPrep from phone first (`adb uninstall com.csprepos.desktop`). |
| `command not found: adb` | ADB binary is not in your system PATH | Specify full path to ADB (e.g. `.\adb.exe` or `C:\platform-tools\adb.exe`). |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | Phone storage full | Free up at least 100 MB of internal storage on the phone. |
