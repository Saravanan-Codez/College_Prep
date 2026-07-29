# EngiPrep by Falkon Labs — Master Code Signing & Security Guide (APK, EXE, DEB, RPM)

This document provides a comprehensive, production-grade guide for code signing **Android APKs**, **Windows EXEs/MSIs**, and **Linux DEB/RPM packages** to ensure error-free distribution across all platforms.

---

## 📱 1. Android APK & AAB Code Signing (PRE-CONFIGURED)

> [!IMPORTANT]
> **Pre-Configured Status:** The release keystore has already been generated and configured in your repository!
> - **Keystore Path:** `src-tauri/gen/android/release.keystore`
> - **Properties Config:** `src-tauri/gen/android/key.properties`
> - **Key Alias:** `engiprep_key`
> - **Keystore Pass:** `FalkonLabs2026!`

### How to Compile Signed Android APKs:
When you are ready to build for Android, run:

```bash
bun run tauri android build --apk
```

The resulting binary at `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk` will be **100% digitally signed** with your release key.

### Manual Verification of Signed APK:
To verify the signature on any Android device or build system:
```bash
apksigner verify --verbose src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

---

## 🪟 2. Windows EXE & MSI Code Signing (`signtool`)

When distributing a Windows binary (`.exe` or `.msi`), Microsoft Defender SmartScreen displays a warning banner ("Windows protected your PC") unless the executable is signed with a valid digital certificate.

### Option A: Local Bypass (For Personal Testing)
To run an unsigned `.exe` locally without warnings:
1. Open PowerShell as Administrator.
2. Run:
   ```powershell
   Unblock-File -Path .\EngiPrep-OS-Setup.exe
   ```

### Option B: Self-Signed Certificate Setup (For Internal Distribution)
1. **Create Self-Signed Certificate**:
   ```powershell
   $cert = New-SelfSignedCertificate -Type CodeSigningCert `
     -Subject "CN=Falkon Labs, O=Falkon Labs, C=US" `
     -CertStoreLocation "Cert:\CurrentUser\My" `
     -KeyUsage DigitalSignature `
     -FriendlyName "Falkon Labs Code Signing"
   ```

2. **Export to PFX File**:
   ```powershell
   Export-PfxCertificate -Cert $cert -FilePath .\FalkonLabsCert.pfx -Password (ConvertTo-SecureString -String "FalkonLabs2026!" -Force -AsPlainText)
   ```

3. **Sign Windows Executable**:
   ```powershell
   signtool sign /f .\FalkonLabsCert.pfx /p FalkonLabs2026! /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 .\EngiPrep-OS-Setup.exe
   ```

---

## 🐧 3. Linux Package Signing (DEB & RPM GPG Keys)

To sign `.deb` and `.rpm` packages for apt/dnf repository distribution:

### 1. Generate GPG Key Pair:
```bash
gpg --full-generate-key
```
- Select `RSA and RSA` (4096-bit), specify `Falkon Labs <dev@falkonlabs.io>`.

### 2. Sign Debian Package (`.deb`):
```bash
dpkg-sig --sign builder src-tauri/target/release/bundle/deb/CS\ College\ Prep\ OS_2.0.0_amd64.deb
```

### 3. Sign RedHat/Fedora Package (`.rpm`):
```bash
rpm --addsign src-tauri/target/release/bundle/rpm/CS\ College\ Prep\ OS-2.0.0-1.x86_64.rpm
```

---

## 🌐 Official Reference Documentation Links

- 📖 [Android Developer APK Signing Guide](https://developer.android.com/studio/publish/app-signing)
- 📖 [Tauri Mobile Android Guide](https://v2.tauri.app/start/migrate/from-tauri-1/#android-and-ios)
- 📖 [Microsoft SignTool Documentation](https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool)
- 📖 [Debian Package Signing Guide](https://wiki.debian.org/SecureApt)
