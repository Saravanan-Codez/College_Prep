# CS College Prep OS — Code Signing & Security Guide (APK & EXE)

This guide provides instructions for code signing Android `.apk` / `.aab` bundles and Windows `.exe` / `.msi` installers to eliminate OS security warnings (such as "Unsigned Package" on Android or "Windows Protected Your PC" SmartScreen warnings).

---

## 📱 Part 1: Android APK Code Signing (`keytool` & `apksigner`)

By default, Tauri compiles Android apps in debug key mode. To generate a **signed production release APK** that installs seamlessly on all Android devices without security warnings:

### Step 1: Generate a Release Keystore
Open your terminal and run:

```bash
keytool -genkey -v -keystore release.keystore \
  -alias cs_prep_key -keyalg RSA -keysize 2048 -validity 10000
```
- Set a secure password when prompted (e.g. `MySecurePassword123`).

### Step 2: Configure `src-tauri/gen/android/key.properties`
Create a file at `src-tauri/gen/android/key.properties`:

```properties
storePassword=MySecurePassword123
keyPassword=MySecurePassword123
keyAlias=cs_prep_key
storeFile=/absolute/path/to/release.keystore
```

### Step 3: Build Signed Release APK
Run the Bun Tauri build command:

```bash
bun run tauri android build --apk
```

The compiled APK at `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk` will now be **100% digitally signed**!

---

## 🪟 Part 2: Windows EXE Code Signing & SmartScreen Bypass

When running an unsigned `.exe` or `.msi` on Windows, Microsoft Defender SmartScreen may display a warning dialog ("Windows protected your PC").

### Option A: 1-Click Unblock for Local Users
If running a self-built `.exe` on your Windows PC:
1. Right-click the `.exe` file -> Select **Properties**.
2. At the bottom under Security, check **Unblock** -> Click **Apply**.

Alternatively via PowerShell:
```powershell
Unblock-File -Path .\cs-college-prep-os.exe
```

### Option B: Sign Binary with a Self-Signed / EV Certificate
To sign your executable with `signtool` (included with Windows SDK):

1. Generate a self-signed certificate in PowerShell:
   ```powershell
   New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=CS Prep OS" -CertStoreLocation Cert:\CurrentUser\My
   ```

2. Sign the binary:
   ```powershell
   signtool sign /fd SHA256 /a /n "CS Prep OS" .\cs-college-prep-os.exe
   ```
