# How to Get Your APK Using GitHub Actions
## (No Android Studio needed — GitHub builds it for free!)

---

## Step 1 — Create a GitHub account
If you don't have one:
→ Go to https://github.com and sign up (it's free)

---

## Step 2 — Create a new repository

1. Click the **+** icon (top-right) → **New repository**
2. Name it: `block-dodge`
3. Set it to **Public** (required for free Actions minutes)
4. Click **Create repository**

---

## Step 3 — Upload your files

On the new empty repo page:

1. Click **uploading an existing file** (link in the middle of the page)
2. Drag and drop ALL the files from this ZIP:
   ```
   www/
   .github/
   config.xml
   package.json
   .gitignore
   ```
   > ⚠️ Make sure you upload the **folders** too, not just loose files.
   > GitHub's drag-and-drop supports folders.

3. Scroll down → click **Commit changes**

---

## Step 4 — Watch it build

1. Click the **Actions** tab at the top of your repo
2. You'll see **"Build Block Dodge APK"** running (yellow spinner)
3. Wait ~5–10 minutes for it to finish (turns green ✅)

---

## Step 5 — Download your APK

1. Click on the finished workflow run
2. Scroll down to the **Artifacts** section
3. Click **BlockDodge-debug-apk** to download a ZIP
4. Extract the ZIP → you get **app-debug.apk**

---

## Step 6 — Install on your Android phone

1. Send the APK to your phone (WhatsApp, email, Google Drive, USB cable)
2. Open it on your phone
3. If prompted "Install from unknown sources":
   - Tap **Settings** → enable **Install unknown apps** for your browser/file manager
4. Tap **Install** → Done! 🎉

---

## Want to add your audio files later?

1. Go to your GitHub repo
2. Navigate to `www/audio/`
3. Click **Add file** → **Upload files**
4. Upload `hit.wav`, `score.wav`, `start.wav`
5. Commit → GitHub will auto-rebuild the APK!

---

## Trigger a rebuild anytime

Go to **Actions** tab → click **Build Block Dodge APK** → click **Run workflow** → **Run workflow** (green button).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Actions tab not visible | Make sure repo is Public |
| Build failed (red ✗) | Click the run → click the job → read the error log |
| APK won't install | Enable "Install unknown apps" in phone settings |
| Can't upload folders | Use GitHub Desktop app (free) instead |

---

**GitHub Desktop (optional, easier uploads):**
Download at https://desktop.github.com — lets you drag your whole project folder in one go.
