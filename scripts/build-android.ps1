# EngiPrep Android Build Script
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Program Files\Android\openjdk\jdk-21.0.8"
$env:ANDROID_HOME = "C:\Users\Admin\AppData\Local\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\29.0.13846066"
$env:PATH = "$env:JAVA_HOME\bin;$env:USERPROFILE\.cargo\bin;$env:NDK_HOME\toolchains\llvm\prebuilt\windows-x86_64\bin;" + $env:PATH
$env:CC_aarch64_linux_android = "$env:NDK_HOME\toolchains\llvm\prebuilt\windows-x86_64\bin\aarch64-linux-android24-clang.cmd"
$env:AR_aarch64_linux_android = "$env:NDK_HOME\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-ar.exe"
$env:CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = "$env:NDK_HOME\toolchains\llvm\prebuilt\windows-x86_64\bin\aarch64-linux-android24-clang.cmd"

Write-Host "🚀 Building Android Release APK..." -ForegroundColor Green
npx tauri android build --apk
Write-Host "✅ APK built successfully!" -ForegroundColor Green
