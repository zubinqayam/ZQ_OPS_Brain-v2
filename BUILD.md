# ZQ Ops Brain v2 – Build Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | `node --version` |
| npm | ≥ 10 | bundled with Node |
| Rust | stable | `rustup update stable` |
| Tauri CLI | 2.x | installed via `npm install` |
| Python | ≥ 3.10 | for INNM Engine sidecar |

---

## Quick Start

```bash
# 1. Install all frontend and Tauri dependencies
npm install

# 2. Run in development mode (hot-reload)
npm run tauri-dev
```

---

## Build Windows (.exe)

```bash
npm run tauri-build
# Output: src-tauri/target/release/bundle/nsis/*.exe
```

### Code-signing (optional)

Set the following environment variables before building:

```bash
export TAURI_SIGNING_PRIVATE_KEY="<base64 key>"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<password>"
npm run tauri-build
```

---

## Build Android (.apk)

### Android prerequisites

1. Install [Android Studio](https://developer.android.com/studio) and Android SDK.
2. Install NDK 27:
   ```bash
   sdkmanager "ndk;27.0.11718014"
   ```
3. Add Rust Android targets:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi \
     i686-linux-android x86_64-linux-android
   ```
4. Set environment variables:
   ```bash
   export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
   export ANDROID_NDK_HOME="$ANDROID_SDK_ROOT/ndk/27.0.11718014"
   export NDK_HOME="$ANDROID_NDK_HOME"
   ```

### Build

```bash
# First time only – generate Android project files
npm run tauri-android-init

# Build release APK
npm run tauri-android-build
# Output: src-tauri/gen/android/app/build/outputs/apk/release/*.apk
```

---

## Build Linux

Install system dependencies:

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

Then:

```bash
npm run tauri-build
# Output: src-tauri/target/release/bundle/deb/*.deb
#         src-tauri/target/release/bundle/appimage/*.AppImage
```

---

## INNM Engine Sidecar

The INNM-WOSDS engine is a Python sidecar located in
`src-tauri/INNM_ENGINE/`.

### Running manually

```bash
cd src-tauri/INNM_ENGINE
echo "What is the status?" | python ibox_core.py
```

### Bundling as a binary (PyInstaller)

```bash
pip install pyinstaller
cd src-tauri/INNM_ENGINE
pyinstaller --onefile ibox_core.py --name innm-engine
cp dist/innm-engine ../binaries/innm-engine-x86_64-pc-windows-msvc.exe  # Windows
# or
cp dist/innm-engine ../binaries/innm-engine-x86_64-unknown-linux-gnu    # Linux
```

The binary name must match the Tauri sidecar naming convention:
`innm-engine-<target-triple>[.exe]`.

---

## CI/CD

GitHub Actions workflows are in `.github/workflows/build.yml`.

| Job | Trigger | Output |
|-----|---------|--------|
| `build-windows` | push to main / PR | `.exe` artifact |
| `build-android` | push to main / PR | `.apk` artifact |
| `build-linux` | push to main / PR | `.deb` / `.AppImage` artifacts |
| `release` | tag `v*` | GitHub Release with all artifacts |
