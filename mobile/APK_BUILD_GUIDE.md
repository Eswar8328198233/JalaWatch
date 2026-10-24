# 📦 JalaWatch Android APK Build Guide (Expo EAS)

This guide walks you through building an installable **standalone Android APK (`.apk`)** for your physical Android device using **Expo Application Services (EAS Build)**.

---

## 🛠️ Configuration Overview

The project is pre-configured with everything needed to produce a standalone `.apk`:

1. **Build Profile in `eas.json`**:
   - Profile `preview`: Sets `"distribution": "internal"` and `"android": { "buildType": "apk" }`.
   - Produces a direct, sideloadable `.apk` file (not a `.aab` which requires Google Play Console).
2. **Android Configuration in `app.json`**:
   - Package Name: `com.jalawatch.mobile`
   - Version Code: `1`
   - `usesCleartextTraffic: true`: Configured in both `app.json` and `AndroidManifest.xml` to allow your phone to connect over Wi-Fi to a local HTTP backend (e.g., `http://192.168.31.108:5000`) without being blocked by Android security policies.
   - Permissions: Location (`ACCESS_FINE_LOCATION`) and Camera/Storage configured with transparent privacy notices.
3. **No Embedded Secrets**:
   - Administrator passwords, secret keys, and database credentials are kept exclusively on the Flask backend.

---

## 🚀 Step-by-Step Instructions to Build the APK

### Step 1: Open Terminal in the `mobile/` Directory
Open PowerShell or your terminal and navigate to the mobile folder:
```powershell
cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\mobile
```

---

### Step 2: Log in to Your Expo Account
EAS Cloud Build requires a free Expo account to compile the native Android binaries on their cloud builders.

Run:
```powershell
npx eas-cli login
```

* **If you already have an Expo account**: Enter your email/username and password.
* **If you do not have an account yet**: Sign up for free at [expo.dev/signup](https://expo.dev/signup), then log in.

Verify your session by running:
```powershell
npx eas-cli whoami
```
*(It should print your Expo username).*

---

### Step 3: Initialize the Project on EAS (First Time Only)
Link this project to your Expo account:
```powershell
npx eas-cli project:init
```
* When prompted *"Would you like to link this project to an existing project on Expo?"*, select **Create a new project** or press Enter.
* This automatically generates an Expo `projectId` inside your `app.json`.

---

### Step 4: Run the Android APK Build
To build the installable APK, run:

```powershell
npx eas-cli build -p android --profile preview
```
*(Or use the package script: `npm run build:apk`)*

#### During the build prompt:
* **"Generate a new Android Keystore?"** → Select **Yes** (press Enter). EAS will automatically create and securely store your Android signing certificate.

---

### Step 5: Track Build Progress
EAS will upload your project code, set up an Android build environment on their high-performance cloud servers, compile the React Native binaries, and bundle the JavaScript assets.

* In the terminal, you will see a link like:
  ```
  https://expo.dev/accounts/<your-username>/projects/jalawatch-mobile/builds/<build-id>
  ```
* You can open this link in your browser to watch real-time build logs. Build time typically takes **5 to 8 minutes**.

---

### Step 6: Download & Install the APK on Your Physical Phone
When the build completes successfully:

1. **Terminal Output**:
   * A direct download URL for the `.apk` file will be printed.
   * A **QR code** will appear in your terminal.
2. **On Your Phone**:
   * Scan the QR code using your phone's camera, or open the download link in Chrome/Firefox on your phone.
   * Tap **Download** to save the `.apk` file (e.g., `jalawatch-xxx.apk`).
   * Tap the downloaded file to install.
   * *If Android displays a "Play Protect" alert for an unreleased app: tap **"More details"** → **"Install anyway"**.*
3. Open **JalaWatch** on your phone!

---

## 🌐 Configuring the Backend API URL

### For Local Wi-Fi Testing (Phone + Laptop on same Wi-Fi)
Ensure your Flask backend is running on your computer:
```powershell
cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\backend
venv\Scripts\python app.py
```
Find your computer's Wi-Fi IP address (e.g., `192.168.31.108`) and build with:
```powershell
npx eas-cli build -p android --profile preview --env EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
```

### For Production / Cloud Backend
If your Flask backend is deployed on a cloud server or tunnel (e.g., `https://api.jalawatch.org`):
```powershell
npx eas-cli build -p android --profile production --env EXPO_PUBLIC_API_URL=https://api.jalawatch.org
```

---

## 📋 Build Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`Not logged in`** | EAS CLI requires Expo credentials | Run `npx eas-cli login`. |
| **`App cannot connect to backend`** | Phone cannot reach `localhost` | Physical phones cannot access `localhost`. Use your computer's LAN IP (`http://192.168.x.x:5000`) or a cloud URL. |
| **`Cleartext HTTP blocked`** | Android blocks unencrypted HTTP | Already resolved: `usesCleartextTraffic: true` is configured in `app.json` and `AndroidManifest.xml`. |
| **`Build queuing time`** | Free tier cloud worker queue | Free tier builds on Expo queue for 1–3 minutes before starting. Be patient while the cloud runner initializes. |
