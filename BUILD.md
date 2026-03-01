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
