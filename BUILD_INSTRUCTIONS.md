# Block Dodge — Android APK Build Instructions

## What's inside this ZIP
```
BlockDodge/
├── www/               ← Your game files (HTML, CSS, JS)
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── audio/         ← Drop your .wav files here
│       └── README.txt
├── res/
│   └── icon/android/  ← Drop your app icons here (optional)
├── config.xml         ← Cordova app configuration
├── package.json
└── BUILD_INSTRUCTIONS.md  ← You are here
```

---

## Prerequisites (one-time setup)

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install Java JDK 17
Download from https://adoptium.net  
After install, set JAVA_HOME:
- **Windows:** `setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17..."`
- **Mac/Linux:** `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`

### 3. Install Android Studio & SDK
Download from https://developer.android.com/studio  
Open Android Studio → SDK Manager → Install:
- Android SDK Platform 33 (Android 13)
- Android SDK Build-Tools 33.0.2
- Android SDK Command-line Tools

Then set ANDROID_HOME:
- **Windows:** `setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"`
- **Mac:** `export ANDROID_HOME=$HOME/Library/Android/sdk`
- **Linux:** `export ANDROID_HOME=$HOME/Android/Sdk`

Also add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

### 4. Install Cordova globally
```bash
npm install -g cordova
```

---

## Build Steps

### Step 1 — Extract & enter the project folder
```bash
unzip BlockDodge.zip
cd BlockDodge
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Add Android platform
```bash
cordova platform add android
```

### Step 4 — Add audio files (if you have them)
Copy your audio files into `www/audio/`:
```
www/audio/hit.wav
www/audio/score.wav
www/audio/start.wav
```

### Step 5 — Build the APK
```bash
cordova build android
```

Your APK will be at:
```
platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 6 — Install on your phone
Enable **Developer Options** on your Android phone:
- Settings → About Phone → tap "Build Number" 7 times
- Settings → Developer Options → enable "USB Debugging"

Then run:
```bash
cordova run android
```
Or just copy the APK to your phone and open it (allow "Install from unknown sources").

---

## Expected APK Size
The debug APK will be **~4–8 MB** — well under your 50 MB limit.

---

## Optional: Customise the app

### Change app name / ID
Edit `config.xml`:
```xml
<widget id="com.yourname.blockdodge" version="1.0.0" ...>
  <name>Block Dodge</name>
```

### Add an app icon
Replace the placeholder PNGs in `res/icon/android/` with real icons:
- `icon-96.png`  → 96×96 px
- `icon-144.png` → 144×144 px
- `icon-192.png` → 192×192 px

### Build a release APK (for Google Play)
```bash
cordova build android --release
```
Then sign it with `keytool` and `apksigner` as per Google Play requirements.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `JAVA_HOME not set` | Install JDK 17 and set JAVA_HOME |
| `SDK not found` | Install Android Studio, set ANDROID_HOME |
| `cordova: command not found` | Run `npm install -g cordova` |
| Audio not playing on device | Ensure .wav files are in `www/audio/` |

---

**Need help?** The Cordova docs are at https://cordova.apache.org/docs/en/latest/
