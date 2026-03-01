# INNM-WOSDS Build Instructions

## Project Location
`/mnt/okcomputer/output/innm-wosds-tauri/app/`

## Quick Start

### 1. Install Dependencies
```bash
cd /mnt/okcomputer/output/innm-wosds-tauri/app
npm install
```

### 2. Build for Windows (.exe)
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Build
npm run tauri build
```

**Output:**
- MSI: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/`
- NSIS: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`

### 3. Build for Android (.apk)
```bash
# Install Android SDK and NDK
# Download from: https://developer.android.com/studio

# Set environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Install Rust Android targets
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi

# Install cargo-ndk
cargo install cargo-ndk

# Build APK
npm run tauri-android-build
```

**Output:**
- APK: `src-tauri/gen/android/app/build/outputs/apk/release/`

## Project Structure

```
innm-wosds-tauri/app/
├── src/                          # React Frontend
│   ├── App.tsx                  # Main UI with Chat/WOODS/Matrix tabs
│   ├── App.css                  # Custom styles
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Tailwind base styles
│   ├── lib/utils.ts             # Utility functions
│   └── components/ui/           # shadcn/ui components (40+)
├── src-tauri/                   # Rust + Tauri Backend
│   ├── src/
│   │   └── main.rs              # Rust main with Python sidecar
│   ├── tauri.conf.json          # Tauri configuration
│   ├── Cargo.toml               # Rust dependencies
│   ├── build.rs                 # Build script
│   ├── binaries/
│   │   └── innm-engine          # Python sidecar wrapper
│   ├── INNM_ENGINE/             # INNM Python modules
│   │   ├── ibox_core.py         # IntelligenceBox (main brain)
│   │   ├── front_matrix.py      # Input processing
│   │   ├── back_matrix.py       # Context validation
│   │   ├── up_matrix.py         # Response synthesis
│   │   ├── woods_builder.py     # Folder indexing
│   │   └── innm_bridge.py       # Bridge to app layer
│   └── icons/                   # App icons
├── .github/workflows/
│   └── build.yml                # GitHub Actions CI/CD
├── package.json                 # Node dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── BUILD.md                     # Detailed build docs
└── README.md                    # Project documentation
```

## npm Scripts

```bash
npm run dev              # Start development server
npm run build            # Build frontend
npm run preview          # Preview production build
npm run tauri-dev        # Start Tauri development
npm run tauri-build      # Build Windows executable
npm run tauri-android    # Start Android development
npm run tauri-android-build  # Build Android APK
```

## Features

### Triangular Matrix Engine
- **FRONT Matrix**: Keyword extraction, intent detection, query vectorization
- **BACK Matrix**: Conversation history, constraint checking, scope validation
- **UP Matrix**: WOODS data retrieval, relevance scoring, answer synthesis

### WOODS Folder Mapping
- Index folders containing text documents
- Supported formats: .txt, .md, .csv, .log
- Creates `active_mapcore.json` for document retrieval
- Chunks documents into ~700 character segments

### Chat Interface
- Natural language queries
- Real-time response streaming
- WOODS status indicator
- Message history

## GitHub Actions CI/CD

The `.github/workflows/build.yml` file includes automated builds for:
- Windows (.exe, .msi)
- Android (.apk)
- Linux (.AppImage, .deb)
- macOS (.dmg, .app)

### Required Secrets

Add these to your GitHub repository settings:

- `TAURI_SIGNING_PRIVATE_KEY` - For app signing
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - Key password
- `ANDROID_KEYSTORE_BASE64` - Base64-encoded Android keystore
- `ANDROID_KEY_ALIAS` - Key alias
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_PASSWORD` - Key password
- `GITHUB_TOKEN` - Automatically provided

## Troubleshooting

### Windows Build
```bash
# If MSVC not found, install Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/

# If WiX not found (for MSI)
# Install WiX Toolset: https://wixtoolset.org/
```

### Android Build
```bash
# If NDK not found
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653

# Accept SDK licenses
sdkmanager --licenses

# Verify targets installed
rustup target list --installed
```

### Python Sidecar
The Python sidecar (`binaries/innm-engine`) wraps the INNM engine and communicates via stdin/stdout. Ensure Python 3.10+ is available on the target system.

## Distribution

### Code Signing (Recommended)

**Windows:**
```bash
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 "app.exe"
```

**Android:**
```bash
# Generate keystore
keytool -genkey -v -keystore my-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-key.keystore app-release.apk alias_name

# Align
zipalign -v 4 app-release.apk app-release-aligned.apk
```

## License

Apache 2.0
