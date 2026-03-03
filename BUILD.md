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
# INNM-WOSDS Build Instructions

## Prerequisites

### Windows (.exe) Build
- Node.js 20+
- Rust 1.75+
- Windows SDK (for Windows builds)
- Visual Studio Build Tools

### Android (.apk) Build
- Node.js 20+
- Rust 1.75+
- Android Studio
- Android SDK (API 33+)
- NDK (25+)

## Quick Build

### 1. Install Dependencies

```bash
cd /mnt/okcomputer/output/innm-wosds-tauri/app
npm install
```

### 2. Build for Windows (.exe)

```bash
# Development
npm run tauri-dev

# Production build
npm run tauri-build
```

Output: `src-tauri/target/release/bundle/nsis/INNM-WOSDS_1.0.0_x64-setup.exe`

### 3. Build for Android (.apk)

```bash
# Install Android targets
rustup target add aarch64-linux-android armv7-linux-androideabi

# Install cargo-ndk
cargo install cargo-ndk

# Build APK
npm run tauri-android-build
```

Output: `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk`

## Detailed Build Process

### Windows Build

```bash
# 1. Ensure Rust is installed with Windows target
rustup target add x86_64-pc-windows-msvc

# 2. Build the application
npx tauri build --target x86_64-pc-windows-msvc

# 3. Output locations:
# - MSI: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/
# - NSIS: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/
# - EXE: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/tauri/
```

### Android Build

```bash
# 1. Set up Android environment
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 2. Install Rust Android targets
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi

# 3. Build
npx tauri android build --release

# 4. Sign the APK (if needed)
# jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
#   -keystore my-key.keystore \
#   app-release.apk alias_name
```

## Project Structure

```
innm-wosds-tauri/app/
├── src/                    # React frontend
│   ├── App.tsx            # Main application
│   ├── App.css            # Styles
│   └── ...
├── src-tauri/             # Rust + Tauri backend
│   ├── src/main.rs        # Rust entry point
│   ├── tauri.conf.json    # Tauri configuration
│   ├── Cargo.toml         # Rust dependencies
│   ├── binaries/          # Python sidecar
│   │   └── innm-engine    # Python wrapper script
│   └── INNM_ENGINE/       # INNM Python modules
│       ├── ibox_core.py
│       ├── front_matrix.py
│       ├── back_matrix.py
│       ├── up_matrix.py
│       └── woods_builder.py
└── package.json
```

## Configuration

### Tauri Configuration (tauri.conf.json)

Key settings:
- `identifier`: "com.innm.wosds"
- `targets`: ["msi", "nsis", "appimage", "deb", "dmg", "app"]
- `externalBin`: ["binaries/innm-engine"]
- `resources`: ["INNM_ENGINE/**/*", "WOODS_STORE/**/*"]

### Environment Variables

- `WOODS_STORE_PATH`: Path to WOODS storage directory
- `INNM_ENGINE_PATH`: Path to INNM Python modules

## Troubleshooting

### Windows Build Issues

1. **MSVC not found**: Install Visual Studio Build Tools
2. **WiX not found**: Install WiX Toolset for MSI builds
3. **NSIS not found**: Install NSIS for installer builds

### Android Build Issues

1. **NDK not found**: Set NDK_HOME environment variable
2. **Cargo NDK not found**: Run `cargo install cargo-ndk`
3. **SDK licenses**: Accept SDK licenses with `sdkmanager --licenses`

## Distribution

### Code Signing (Recommended)

#### Windows
```bash
# Sign with signtool
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 "app.exe"
```

#### Android
```bash
# Generate keystore
keytool -genkey -v -keystore my-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-key.keystore app-release.apk alias_name

# Align with zipalign
zipalign -v 4 app-release.apk app-release-aligned.apk
```

## CI/CD (GitHub Actions)

See `.github/workflows/build.yml` for automated builds.

Required secrets:
- `WINDOWS_CERTIFICATE`: Base64-encoded PFX certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password
- `ANDROID_KEYSTORE`: Base64-encoded keystore
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
